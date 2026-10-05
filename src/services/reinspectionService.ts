import { supabase } from '@/lib/supabase';
import { Reinspection } from '@/types';
import { activityService } from './activityService';
import { notificationService } from './notificationService';
import { evidenceService } from './evidenceService';

export const reinspectionService = {
  async submitReinspection(params: {
    defectId: string;
    rectificationSubmissionId?: string | null;
    outcome: 'approved' | 'rejected';
    comments: string;
    photos?: File[];
  }): Promise<Reinspection> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    if (params.outcome === 'rejected' && (!params.comments || !params.comments.trim())) {
      throw new Error('A detailed rejection reason is mandatory when failing a reinspection.');
    }

    // 1. Insert reinspection record
    const { data: reinspection, error } = await supabase
      .from('reinspections')
      .insert([
        {
          defect_id: params.defectId,
          rectification_submission_id: params.rectificationSubmissionId || null,
          reviewer_id: user.id,
          outcome: params.outcome,
          comments: params.comments,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // 2. Upload reinspection photos if any
    if (params.photos && params.photos.length > 0) {
      for (const file of params.photos) {
        await evidenceService.uploadFile(file, 'reinspection', {
          defect_id: params.defectId,
          reinspection_id: reinspection.id,
          caption: `Reinspection verification photo (${params.outcome})`,
        });
      }
    }

    // 3. Fetch current defect
    const { data: currentDefect } = await supabase
      .from('defects')
      .select('status, reference, contractor_id')
      .eq('id', params.defectId)
      .single();

    const previousStatus = currentDefect?.status || 'awaiting_reinspection';

    if (params.outcome === 'approved') {
      // Transition to closed
      await supabase
        .from('defects')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          closed_by: user.id,
        })
        .eq('id', params.defectId);

      // Status history
      await supabase.from('defect_status_history').insert([
        {
          defect_id: params.defectId,
          previous_status: previousStatus,
          new_status: 'closed',
          changed_by: user.id,
          reason: `Reinspection passed: ${params.comments}`,
        },
      ]);

      // Activity
      await activityService.logActivity(
        'approve_closure',
        'defect',
        params.defectId,
        currentDefect?.reference || 'Defect',
        { comments: params.comments }
      );

      // Notify contractor
      if (currentDefect?.contractor_id) {
        const { data: contractorUsers } = await supabase
          .from('contractor_users')
          .select('user_id')
          .eq('contractor_id', currentDefect.contractor_id);

        if (contractorUsers) {
          for (const cu of contractorUsers) {
            await notificationService.createNotification(
              cu.user_id,
              'defect_closed',
              `Defect Closed: ${currentDefect.reference}`,
              `Repair verified and approved by QA/QC inspector: "${params.comments}"`,
              'defect',
              params.defectId
            );
          }
        }
      }
    } else {
      // Outcome is 'rejected' -> Transition to 'reopened'
      await supabase
        .from('defects')
        .update({
          status: 'reopened',
        })
        .eq('id', params.defectId);

      // Status history
      await supabase.from('defect_status_history').insert([
        {
          defect_id: params.defectId,
          previous_status: previousStatus,
          new_status: 'rejected',
          changed_by: user.id,
          reason: `Reinspection rejected: ${params.comments}`,
        },
        {
          defect_id: params.defectId,
          previous_status: 'rejected',
          new_status: 'reopened',
          changed_by: user.id,
          reason: `Reopened for contractor rework: ${params.comments}`,
        },
      ]);

      // Activity
      await activityService.logActivity(
        'reject_rectification',
        'defect',
        params.defectId,
        currentDefect?.reference || 'Defect',
        { reason: params.comments }
      );

      // Notify contractor
      if (currentDefect?.contractor_id) {
        const { data: contractorUsers } = await supabase
          .from('contractor_users')
          .select('user_id')
          .eq('contractor_id', currentDefect.contractor_id);

        if (contractorUsers) {
          for (const cu of contractorUsers) {
            await notificationService.createNotification(
              cu.user_id,
              'rectification_rejected',
              `Rectification Rejected: ${currentDefect.reference}`,
              `Reinspection failed. Rejection reason: "${params.comments}". Please perform necessary rework.`,
              'defect',
              params.defectId
            );
          }
        }
      }
    }

    return reinspection as Reinspection;
  },

  async reopenDefect(defectId: string, reason: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    if (!reason || !reason.trim()) {
      throw new Error('A recorded reason is required to reopen a closed defect.');
    }

    const { data: currentDefect } = await supabase
      .from('defects')
      .select('status, reference, contractor_id')
      .eq('id', defectId)
      .single();

    await supabase
      .from('defects')
      .update({
        status: 'reopened',
        closed_at: null,
        closed_by: null,
      })
      .eq('id', defectId);

    await supabase.from('defect_status_history').insert([
      {
        defect_id: defectId,
        previous_status: currentDefect?.status || 'closed',
        new_status: 'reopened',
        changed_by: user.id,
        reason,
      },
    ]);

    await activityService.logActivity(
      'reopen_defect',
      'defect',
      defectId,
      currentDefect?.reference || 'Defect',
      { reason }
    );

    if (currentDefect?.contractor_id) {
      const { data: contractorUsers } = await supabase
        .from('contractor_users')
        .select('user_id')
        .eq('contractor_id', currentDefect.contractor_id);

      if (contractorUsers) {
        for (const cu of contractorUsers) {
          await notificationService.createNotification(
            cu.user_id,
            'defect_reopened',
            `Defect Reopened: ${currentDefect.reference}`,
            `This defect has been reopened with reason: "${reason}".`,
            'defect',
            defectId
          );
        }
      }
    }
  },
};
