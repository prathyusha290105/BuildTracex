import { supabase } from '@/lib/supabase';
import { Defect, DefectStatus, DefectSeverity, DefectStatusHistory, Comment, UserRole } from '@/types';
import { canTransitionStatus, isDefectOverdue } from '@/lib/utils';
import { activityService } from './activityService';
import { notificationService } from './notificationService';

export interface DefectFilters {
  projectId?: string;
  buildingId?: string;
  floorId?: string;
  zoneId?: string;
  contractorId?: string;
  assignedTo?: string;
  status?: DefectStatus | 'all';
  severity?: DefectSeverity | 'all';
  isOverdue?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export const defectService = {
  async getDefects(filters?: DefectFilters): Promise<{ defects: Defect[]; totalCount: number }> {
    let query = supabase
      .from('defects')
      .select(
        `*,
        project:projects(*),
        building:buildings(*),
        floor:floors(*),
        zone:zones(*),
        contractor:contractors(*),
        reporter:profiles!reported_by(*),
        assignee:profiles!assigned_to(*)`,
        { count: 'exact' }
      );

    if (filters?.projectId && filters.projectId !== 'all') {
      query = query.eq('project_id', filters.projectId);
    }
    if (filters?.buildingId && filters.buildingId !== 'all') {
      query = query.eq('building_id', filters.buildingId);
    }
    if (filters?.floorId && filters.floorId !== 'all') {
      query = query.eq('floor_id', filters.floorId);
    }
    if (filters?.zoneId && filters.zoneId !== 'all') {
      query = query.eq('zone_id', filters.zoneId);
    }
    if (filters?.contractorId && filters.contractorId !== 'all') {
      query = query.eq('contractor_id', filters.contractorId);
    }
    if (filters?.assignedTo && filters.assignedTo !== 'all') {
      query = query.eq('assigned_to', filters.assignedTo);
    }
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.severity && filters.severity !== 'all') {
      query = query.eq('severity', filters.severity);
    }
    if (filters?.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      query = query.or(`reference.ilike.${term},title.ilike.${term},description.ilike.${term}`);
    }

    query = query.order('created_at', { ascending: false });

    if (filters?.limit) {
      const from = filters.offset || 0;
      query = query.range(from, from + filters.limit - 1);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    let defects = (data as Defect[]) || [];

    // Filter by overdue client-side if requested
    if (filters?.isOverdue) {
      defects = defects.filter((d) => isDefectOverdue(d.status, d.due_date));
    }

    return {
      defects,
      totalCount: count || defects.length,
    };
  },

  async getDefectById(id: string): Promise<Defect> {
    const { data: defect, error } = await supabase
      .from('defects')
      .select(
        `*,
        project:projects(*),
        building:buildings(*),
        floor:floors(*),
        zone:zones(*),
        contractor:contractors(*),
        reporter:profiles!reported_by(*),
        assignee:profiles!assigned_to(*),
        closer:profiles!closed_by(*)`
      )
      .eq('id', id)
      .single();

    if (error) throw error;

    // Fetch related evidence, rectifications, reinspections, comments, and history
    const [
      { data: evidence },
      { data: rectifications },
      { data: reinspections },
      { data: comments },
      { data: history },
    ] = await Promise.all([
      supabase.from('evidence_files').select('*').eq('defect_id', id).order('created_at', { ascending: true }),
      supabase.from('rectification_submissions').select('*, submitter:profiles!submitted_by(*)').eq('defect_id', id).order('submitted_at', { ascending: false }),
      supabase.from('reinspections').select('*, reviewer:profiles!reviewer_id(*)').eq('defect_id', id).order('reviewed_at', { ascending: false }),
      supabase.from('comments').select('*, user:profiles!user_id(*)').eq('defect_id', id).order('created_at', { ascending: true }),
      supabase.from('defect_status_history').select('*, changer:profiles!changed_by(*)').eq('defect_id', id).order('created_at', { ascending: false }),
    ]);

    // Attach public URLs to evidence files
    const enrichedEvidence = (evidence || []).map((ev) => {
      const { data: urlData } = supabase.storage.from('evidence').getPublicUrl(ev.storage_path);
      return {
        ...ev,
        url: urlData?.publicUrl || '',
      };
    });

    return {
      ...defect,
      evidence: enrichedEvidence,
      rectifications: (rectifications as any) || [],
      reinspections: (reinspections as any) || [],
      comments: (comments as Comment[]) || [],
      history: (history as DefectStatusHistory[]) || [],
    } as Defect;
  },

  async generateNextReference(): Promise<string> {
    const { data } = await supabase
      .from('defects')
      .select('reference')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!data || data.length === 0 || !data[0].reference) {
      return 'BTX-0001';
    }

    const match = data[0].reference.match(/BTX-(\d+)/);
    if (!match) return 'BTX-0001';

    const nextNum = parseInt(match[1], 10) + 1;
    return `BTX-${String(nextNum).padStart(4, '0')}`;
  },

  async createDefect(
    defectData: {
      title: string;
      description?: string | null;
      category?: string | null;
      severity: DefectSeverity;
      project_id: string;
      building_id?: string | null;
      floor_id?: string | null;
      zone_id?: string | null;
      inspection_id?: string | null;
      inspection_response_id?: string | null;
      contractor_id?: string | null;
      assigned_to?: string | null;
      due_date?: string | null;
    }
  ): Promise<Defect> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    const reference = await this.generateNextReference();
    const initialStatus: DefectStatus = defectData.contractor_id ? 'assigned' : 'open';

    const { data: newDefect, error } = await supabase
      .from('defects')
      .insert([
        {
          ...defectData,
          reference,
          status: initialStatus,
          reported_by: user.id,
          assigned_at: defectData.contractor_id ? new Date().toISOString() : null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Log status history
    await supabase.from('defect_status_history').insert([
      {
        defect_id: newDefect.id,
        previous_status: null,
        new_status: initialStatus,
        changed_by: user.id,
        reason: defectData.inspection_id ? 'Created from failed inspection item' : 'Manual defect entry',
      },
    ]);

    // Log activity
    await activityService.logActivity(
      'create_defect',
      'defect',
      newDefect.id,
      newDefect.reference,
      { title: newDefect.title, severity: newDefect.severity }
    );

    // If assigned to contractor, notify contractor users
    if (defectData.contractor_id) {
      const { data: contractorUsers } = await supabase
        .from('contractor_users')
        .select('user_id')
        .eq('contractor_id', defectData.contractor_id);

      if (contractorUsers && contractorUsers.length > 0) {
        for (const cu of contractorUsers) {
          await notificationService.createNotification(
            cu.user_id,
            'new_assignment',
            `New Defect Assigned: ${newDefect.reference}`,
            `Defect "${newDefect.title}" has been assigned to your organization. Due by: ${defectData.due_date || 'N/A'}.`,
            'defect',
            newDefect.id
          );
        }
      }
    }

    return this.getDefectById(newDefect.id);
  },

  async assignDefect(
    defectId: string,
    contractorId: string,
    assignedTo?: string | null,
    dueDate?: string | null,
    reason?: string | null
  ): Promise<Defect> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    const current = await this.getDefectById(defectId);
    const wasAssigned = current.status === 'assigned';
    const nextStatus: DefectStatus = current.status === 'open' ? 'assigned' : current.status;

    const { data: updated, error } = await supabase
      .from('defects')
      .update({
        contractor_id: contractorId,
        assigned_to: assignedTo || null,
        due_date: dueDate || null,
        status: nextStatus,
        assigned_at: new Date().toISOString(),
      })
      .eq('id', defectId)
      .select()
      .single();

    if (error) throw error;

    // Record status history if status changed
    if (current.status !== nextStatus) {
      await supabase.from('defect_status_history').insert([
        {
          defect_id: defectId,
          previous_status: current.status,
          new_status: nextStatus,
          changed_by: user.id,
          reason: reason || 'Assigned to contractor',
        },
      ]);
    }

    // Log activity
    await activityService.logActivity(
      wasAssigned ? 'reassign_defect' : 'assign_defect',
      'defect',
      defectId,
      updated.reference,
      { contractor_id: contractorId, due_date: dueDate }
    );

    // Notify contractor users
    const { data: contractorUsers } = await supabase
      .from('contractor_users')
      .select('user_id')
      .eq('contractor_id', contractorId);

    if (contractorUsers && contractorUsers.length > 0) {
      for (const cu of contractorUsers) {
        await notificationService.createNotification(
          cu.user_id,
          wasAssigned ? 'reassignment' : 'new_assignment',
          `Defect Assignment: ${updated.reference}`,
          `Defect "${updated.title}" is assigned to your team with deadline ${dueDate || 'unspecified'}.`,
          'defect',
          defectId
        );
      }
    }

    return this.getDefectById(defectId);
  },

  async transitionStatus(
    defectId: string,
    newStatus: DefectStatus,
    reason?: string | null,
    userRole: UserRole = 'qaqc_engineer'
  ): Promise<Defect> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    const current = await this.getDefectById(defectId);

    const validation = canTransitionStatus(current.status, newStatus, userRole);
    if (!validation.allowed) {
      throw new Error(validation.reason || 'Invalid status transition.');
    }

    const updates: Partial<Defect> = {
      status: newStatus,
    };

    if (newStatus === 'closed') {
      updates.closed_at = new Date().toISOString();
      updates.closed_by = user.id;
    }

    const { error } = await supabase
      .from('defects')
      .update(updates)
      .eq('id', defectId);

    if (error) throw error;

    // Record history
    await supabase.from('defect_status_history').insert([
      {
        defect_id: defectId,
        previous_status: current.status,
        new_status: newStatus,
        changed_by: user.id,
        reason: reason || `Status changed to ${newStatus}`,
      },
    ]);

    // Log activity
    await activityService.logActivity(
      'transition_defect_status',
      'defect',
      defectId,
      current.reference,
      { from: current.status, to: newStatus, reason }
    );

    return this.getDefectById(defectId);
  },

  async addComment(defectId: string, content: string): Promise<Comment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          defect_id: defectId,
          user_id: user.id,
          content,
        },
      ])
      .select('*, user:profiles!user_id(*)')
      .single();

    if (error) throw error;
    return data as Comment;
  },
};
