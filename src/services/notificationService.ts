import { supabase } from '@/lib/supabase';
import { Notification, NotificationType } from '@/types';

export const notificationService = {
  async getNotifications(limit = 20): Promise<Notification[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Error fetching notifications:', error.message);
      return [];
    }
    return (data as Notification[]) || [];
  },

  async getUnreadCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false);

    if (error) return 0;
    return count || 0;
  },

  async markAsRead(notificationId: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);
  },

  async markAllAsRead(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', user.id)
      .eq('is_read', false);
  },

  async createNotification(
    recipientId: string,
    type: NotificationType,
    title: string,
    message?: string,
    entityType?: string,
    entityId?: string
  ): Promise<void> {
    try {
      await supabase.from('notifications').insert([
        {
          recipient_id: recipientId,
          type,
          title,
          message,
          entity_type: entityType,
          entity_id: entityId,
          is_read: false,
        },
      ]);
    } catch (err) {
      console.warn('Could not dispatch notification:', err);
    }
  },
};
