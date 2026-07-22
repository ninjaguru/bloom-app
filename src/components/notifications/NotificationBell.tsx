import React, { useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationsStore } from '../../stores/notificationsStore';
import { useAuthStore } from '../../stores/authStore';
import { NotificationPanel } from './NotificationPanel';

export const NotificationBell: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const panelOpen = useNotificationsStore((s) => s.panelOpen);
  const setPanelOpen = useNotificationsStore((s) => s.setPanelOpen);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setPanelOpen]);

  if (!user) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className="relative p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-bold text-white shadow-md animate-in zoom-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationPanel />
    </div>
  );
};
