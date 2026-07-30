import { create } from 'zustand';
import { SubscriptionPlan, CustomerSubscription } from '../types';

interface SubscriptionStore {
  plans: SubscriptionPlan[];
  activeSubscription: CustomerSubscription | null;
  loading: boolean;
  setPlans: (plans: SubscriptionPlan[]) => void;
  setActiveSubscription: (sub: CustomerSubscription | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  plans: [],
  activeSubscription: null,
  loading: false,
  setPlans: (plans) => set({ plans }),
  setActiveSubscription: (activeSubscription) => set({ activeSubscription }),
  setLoading: (loading) => set({ loading }),
}));
