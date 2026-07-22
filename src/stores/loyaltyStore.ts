import { create } from 'zustand';

interface LoyaltyStore {
  available: number;
  nextExpiry: Date | null;
  loading: boolean;
  setBalance: (available: number, nextExpiry: Date | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useLoyaltyStore = create<LoyaltyStore>((set) => ({
  available: 0,
  nextExpiry: null,
  loading: false,
  setBalance: (available, nextExpiry) => set({ available, nextExpiry, loading: false }),
  setLoading: (loading) => set({ loading }),
}));
