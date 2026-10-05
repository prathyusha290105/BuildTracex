import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { formatDate, formatDateTime } from '@/lib/utils';
import {
  Bell,
  CheckCircle2,
  CheckCheck,
  AlertTriangle,
  HardHat,
  RotateCcw,
  Inbox,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { isContractor } = useAuth();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_assignment':
      case 'reassignment':
        return <HardHat className="w-5 h-5 text-amber-500" />;
      case 'rectification_submitted':
        return <CheckCircle2 className="w-5 h-5 text-cyan-500" />;
      case 'reinspection_required':
        return <AlertTriangle className="w-5 h-5 text-blue-500" />;
      case 'rectification_rejected':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'defect_closed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'defect_reopened':
        return <RotateCcw className="w-5 h-5 text-orange-500" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.is_read) {
      await markAsRead(n.id);
    }
    if (n.entity_type === 'defect' && n.entity_id) {
      navigate(isContractor() ? `/contractor/defects/${n.entity_id}` : `/defects/${n.entity_id}`);
    } else if (n.entity_type === 'inspection' && n.entity_id) {
      navigate(`/inspections/${n.entity_id}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <span>Notification & Escalation Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated alerts for assignments, due dates, rectification submissions, and closure reviews
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="gap-1.5 font-semibold text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setFilter('all')}
          className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Notifications ({notifications.length})
        </button>

        <button
          onClick={() => setFilter('unread')}
          className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            filter === 'unread'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-lg border border-slate-200">
          <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No notifications to display</p>
          <p className="text-xs text-slate-400 mt-0.5">You are all caught up on site activities.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 rounded-lg border transition-all cursor-pointer flex items-start gap-3.5 ${
                !n.is_read
                  ? 'bg-blue-50/40 border-blue-200 shadow-sm hover:bg-blue-50/70'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="p-2 rounded-full bg-white shadow-sm flex-shrink-0 mt-0.5 border border-slate-100">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-xs truncate ${!n.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                    {n.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    {formatDateTime(n.created_at)}
                  </span>
                </div>

                {n.message && (
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                )}
              </div>

              {!n.is_read && (
                <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
