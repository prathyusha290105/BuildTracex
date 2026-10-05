import { supabase } from '@/lib/supabase';
import { Inspection, InspectionResponse, ChecklistResponse } from '@/types';
import { activityService } from './activityService';

export const inspectionService = {
  async getInspections(projectId?: string): Promise<Inspection[]> {
    let query = supabase
      .from('inspections')
      .select(
        `*,
        project:projects(*),
        building:buildings(*),
        floor:floors(*),
        zone:zones(*),
        inspector:profiles!inspector_id(*)`
      )
      .order('inspection_date', { ascending: false });

    if (projectId && projectId !== 'all') {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as Inspection[]) || [];
  },

  async getInspectionById(id: string): Promise<Inspection> {
    const { data: inspection, error } = await supabase
      .from('inspections')
      .select(
        `*,
        project:projects(*),
        building:buildings(*),
        floor:floors(*),
        zone:zones(*),
        inspector:profiles!inspector_id(*)`
      )
      .eq('id', id)
      .single();

    if (error) throw error;

    // Fetch responses and linked defects
    const [{ data: responses }, { data: defects }, { data: evidence }] = await Promise.all([
      supabase.from('inspection_responses').select('*').eq('inspection_id', id).order('created_at', { ascending: true }),
      supabase.from('defects').select('*, contractor:contractors(*)').eq('inspection_id', id),
      supabase.from('evidence_files').select('*').eq('inspection_id', id),
    ]);

    // Attach public URLs to evidence
    const enrichedEvidence = (evidence || []).map((ev) => {
      const { data: urlData } = supabase.storage.from('evidence').getPublicUrl(ev.storage_path);
      return {
        ...ev,
        url: urlData?.publicUrl || '',
      };
    });

    // Map evidence to individual responses if linked
    const responsesWithEvidence = (responses || []).map((resp) => ({
      ...resp,
      evidence: enrichedEvidence.filter((e) => e.inspection_response_id === resp.id),
    }));

    return {
      ...inspection,
      responses: responsesWithEvidence as InspectionResponse[],
      defects: (defects as any) || [],
      evidence: enrichedEvidence,
    } as Inspection;
  },

  async generateNextReference(): Promise<string> {
    const { data } = await supabase
      .from('inspections')
      .select('reference')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!data || data.length === 0 || !data[0].reference) {
      return 'INS-0001';
    }

    const match = data[0].reference.match(/INS-(\d+)/);
    if (!match) return 'INS-0001';

    const nextNum = parseInt(match[1], 10) + 1;
    return `INS-${String(nextNum).padStart(4, '0')}`;
  },

  async createInspection(data: {
    project_id: string;
    building_id?: string | null;
    floor_id?: string | null;
    zone_id?: string | null;
    template_id: string;
    template_name_snapshot: string;
    inspection_date?: string;
    notes?: string | null;
    responses: Array<{
      template_item_id: string;
      item_title_snapshot: string;
      item_description_snapshot?: string | null;
      response: ChecklistResponse;
      remarks?: string | null;
    }>;
  }): Promise<Inspection> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    const reference = await this.generateNextReference();

    // 1. Create inspection record
    const { data: newInspection, error: inspError } = await supabase
      .from('inspections')
      .insert([
        {
          reference,
          project_id: data.project_id,
          building_id: data.building_id || null,
          floor_id: data.floor_id || null,
          zone_id: data.zone_id || null,
          template_id: data.template_id,
          template_name_snapshot: data.template_name_snapshot,
          inspector_id: user.id,
          inspection_date: data.inspection_date || new Date().toISOString().split('T')[0],
          status: 'completed',
          notes: data.notes || null,
          submitted_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (inspError) throw inspError;

    // 2. Insert responses
    if (data.responses && data.responses.length > 0) {
      const responseRows = data.responses.map((r) => ({
        inspection_id: newInspection.id,
        template_item_id: r.template_item_id,
        item_title_snapshot: r.item_title_snapshot,
        item_description_snapshot: r.item_description_snapshot || null,
        response: r.response,
        remarks: r.remarks || null,
      }));

      const { error: respError } = await supabase
        .from('inspection_responses')
        .insert(responseRows);

      if (respError) throw respError;
    }

    // 3. Log activity
    await activityService.logActivity(
      'complete_inspection',
      'inspection',
      newInspection.id,
      newInspection.reference,
      {
        template: data.template_name_snapshot,
        total_items: data.responses.length,
        failed_items: data.responses.filter((r) => r.response === 'fail').length,
      }
    );

    return this.getInspectionById(newInspection.id);
  },
};
