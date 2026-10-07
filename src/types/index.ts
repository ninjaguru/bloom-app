import { Timestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

export type { FirebaseUser };

export interface RitualStep {
  title: string;
  description?: string;
  durationMinutes?: number;
  imageUrl?: string;
}

export interface Service {
  id: string;
  serviceId?: string;
  title: string;
  category: string;
  gender: 'women' | 'men' | 'both';
  price: number;
  originalPrice?: number;
  durationMinutes: number;
  rating: number;
  reviewCount: number;
  imageUrl?: string;
  ritualSteps?: RitualStep[];
  isBundle?: boolean;
  tag?: string;
  description?: string;
}

export interface CartItem {
  service: Service;
  quantity: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'flat';
  value: number;
  active: boolean;
  maxUses?: number;
  usedCount: number;
  expiresAt?: Timestamp | { toDate: () => Date };
  minOrderValue?: number;
}

export interface CartTotalsItem extends CartItem {
  id: string;
  lineTotal: number;
}

export interface CartTotals {
  items: CartTotalsItem[];
  totalItems: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  loyaltyDiscount: number;
  loyaltyPointsToRedeem: number;
  total: number;
  couponCode: string | null;
  couponType: 'percent' | 'flat' | null;
}

export interface SavedAddress {
  id: string;
  label: string;
  apartment: string;
  flat: string;
  createdAt?: Timestamp | { toDate: () => Date };
}

export interface CustomerProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  apartment?: string;
  flat?: string;
  referralCode?: string;
  referredBy?: string;
  firstOrderRewarded?: boolean;
  earnedReferralCoupons?: string[];
  fcmToken?: string;
}

export interface BookingDetails {
  customer: {
    name: string;
    phone: string;
    address: string;
    apartment: string;
    flat: string;
  };
  appointment: {
    date: string;
    timeSlot: string;
  };
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Timestamp | { toDate?: () => Date };
}

export interface Society {
  id: string;
  name: string;
  active: boolean;
}

export interface Slot {
  id: string;
  timeSlot: string;
  active: boolean;
  societies?: string[];
  order?: number;
}

// ── Subscription / Bloom Pass ──
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  gender: 'women' | 'men' | 'both';
  credits: number;
  durationDays: number;
  description: string;
  features: string[];
  active: boolean;
  tag?: string;
}

export interface CustomerSubscription {
  id: string;
  customerUid: string;
  planId: string;
  planName: string;
  creditsTotal: number;
  creditsUsed: number;
  startDate: Timestamp | { toDate: () => Date };
  endDate: Timestamp | { toDate: () => Date };
  active: boolean;
  autoRenew: boolean;
  createdAt: Timestamp | { toDate: () => Date };
}

// ── Add-ons ──
export interface ServiceAddon {
  id: string;
  title: string;
  price: number;
  durationMinutes: number;
  description?: string;
  active: boolean;
}
