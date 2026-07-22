import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { requestNotificationPermission } from '../../lib/notifications';

export const NotificationBanner: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [dismissed, setDismissed] = useState(false);

  if (
    !user ||
    dismissed ||
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    Notification.permission !== 'default'
  ) {
    return null;
  }

  const handleEnable = async () => {
    setDismissed(true);
    await requestNotificationPermission(user.uid);
  };

  return (
    <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white py-2.5 px-4 text-xs font-medium flex items-center justify-between shadow-md">
      <div className="flex items-center space-x-2 mx-auto sm:mx-0">
        <Bell className="w-4 h-4 animate-bounce" />
        <span>Enable instant booking alerts and technician arrival notifications</span>
      </div>
      <div className="flex items-center space-x-3">
        <button
          onClick={handleEnable}
          className="px-3 py-1 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
        >
          Enable Now
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-white/20 rounded-md transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
