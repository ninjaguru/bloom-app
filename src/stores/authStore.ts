import { create } from 'zustand';
import { FirebaseUser, CustomerProfile } from '../types';

interface AuthStore {
  user: FirebaseUser | null;
  profile: CustomerProfile | null;
  setUser: (user: FirebaseUser | null) => void;
  setProfile: (profile: CustomerProfile | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
}));
