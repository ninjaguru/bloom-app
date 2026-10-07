import React from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotificationsStore } from '../../stores/notificationsStore';
import { useAuthStore } from '../../stores/authStore';

export const NotificationPanel: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const notifications = useNotificationsStore((s) => s.notifications);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const panelOpen = useNotificationsStore((s) => s.panelOpen);

  if (!panelOpen || !user) return null;

  return (
    <div className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:-translate-x-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 md:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in duration-150 flex max-h-[calc(100dvh-11rem)] flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-pink-400" />
          <h4 className="text-sm font-bold text-white font-outfit">Notifications</h4>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500 text-white">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead(user.uid)}
            className="flex items-center space-x-1 text-xs text-pink-400 hover:text-pink-300 font-medium transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 max-h-72 space-y-2 overflow-y-auto pr-1">
        {notifications.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">
            No notifications yet
          </p>
        ) : (
          notifications.map((n) => {
            const dateObj =
              n.createdAt && 'toDate' in n.createdAt ? n.createdAt.toDate?.() : null;
            const timeStr = dateObj
              ? dateObj.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            return (
              <div
                key={n.id}
                className={`p-3 rounded-xl border text-xs transition-colors ${
                  !n.read
                    ? 'bg-pink-500/10 border-pink-500/30 text-slate-200'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                }`}
              >
                <div className="font-bold text-slate-100 mb-0.5">{n.title}</div>
                <div className="font-light leading-relaxed">{n.body}</div>
                {timeStr && (
                  <div className="text-[10px] text-slate-500 mt-1.5 text-right">
                    {timeStr}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
