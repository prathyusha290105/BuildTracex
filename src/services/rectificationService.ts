import { supabase } from '@/lib/supabase';
import { RectificationSubmission } from '@/types';
import { activityService } from './activityService';
import { notificationService } from './notificationService';
import { evidenceService } from './evidenceService';

export const rectificationService = {
  async submitRectification(params: {
    defectId: string;
    description: string;
    completionSummary?: string | null;
    photos?: File[];
  }): Promise<RectificationSubmission> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    // 1. Insert rectification submission record
    const { data: submission, error } = await supabase
      .from('rectification_submissions')
      .insert([
        {
          defect_id: params.defectId,
          submitted_by: user.id,
          description: params.description,
          completion_summary: params.completionSummary || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // 2. Upload any rectification photos
    if (params.photos && params.photos.length > 0) {
      for (const file of params.photos) {
        await evidenceService.uploadFile(file, 'contractor_rectification', {
          defect_id: params.defectId,
          rectification_submission_id: submission.id,
          caption: 'Contractor rectification evidence',
        });
      }
    }

    // 3. Update defect status to rectification_submitted
    const { data: currentDefect } = await supabase
      .from('defects')
      .select('status, reference, project_id, reported_by')
      .eq('id', params.defectId)
      .single();

    const previousStatus = currentDefect?.status || 'rectification_in_progress';
    const nextStatus = 'rectification_submitted';

    await supabase
      .from('defects')
      .update({ status: nextStatus })
      .eq('id', params.defectId);

    // 4. Record status history
    await supabase.from('defect_status_history').insert([
      {
        defect_id: params.defectId,
        previous_status: previousStatus,
        new_status: nextStatus,
        changed_by: user.id,
        reason: 'Contractor submitted rectification report and evidence for review',
      },
    ]);

    // 5. Log activity
    await activityService.logActivity(
      'submit_rectification',
      'defect',
      params.defectId,
      currentDefect?.reference || 'Defect',
      { submission_id: submission.id }
    );

    // 6. Notify QA/QC Engineer / Reporter that reinspection is ready
    if (currentDefect?.reported_by) {
      await notificationService.createNotification(
        currentDefect.reported_by,
        'rectification_submitted',
        `Rectification Submitted: ${currentDefect.reference}`,
        `Contractor has submitted rectification details. Please schedule site reinspection.`,
        'defect',
        params.defectId
      );
    }

    return submission as RectificationSubmission;
  },
};
