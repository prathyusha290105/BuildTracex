import { supabase } from '@/lib/supabase';
import { ActivityLog } from '@/types';

export const activityService = {
  async getActivityLogs(limit = 50): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*, user:profiles!user_id(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Error fetching activity logs:', error.message);
      return [];
    }
    return (data as ActivityLog[]) || [];
  },

  async logActivity(
    action: string,
    entityType: string,
    entityId?: string | null,
    entityReference?: string | null,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('activity_logs').insert([
        {
          user_id: user?.id || null,
          action,
          entity_type: entityType,
          entity_id: entityId || null,
          entity_reference: entityReference || null,
          metadata: metadata || {},
        },
      ]);
    } catch (err) {
      console.warn('Could not record activity log:', err);
    }
  },
};
