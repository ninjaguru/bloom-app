import { create } from 'zustand';
import { AppNotification } from '../types';
import { markNotificationsAsRead } from '../lib/notifications';

interface NotificationsStore {
  notifications: AppNotification[];
  unreadCount: number;
  panelOpen: boolean;
  setNotifications: (items: AppNotification[]) => void;
  setPanelOpen: (open: boolean) => void;
  markAllRead: (uid: string) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  panelOpen: false,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  markAllRead: async (uid: string) => {
    if (!uid) return;
    await markNotificationsAsRead(uid);
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },
}));
