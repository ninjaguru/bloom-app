import { create } from 'zustand';
import { db, auth } from '../lib/firebase';
import { triggerReferralReward } from '../lib/referral';
import { writeBookingNotification } from '../lib/notifications';
import { earnPoints, spendPoints, pointsToRupees } from '../lib/loyalty';
import {
  collection, addDoc, serverTimestamp,
  query, where, getDocs,
  updateDoc, doc, increment,
} from 'firebase/firestore';
import { Service, CartItem, Coupon, CartTotals, BookingDetails, ServiceAddon } from '../types';

// Pure function — called inside set() to recompute totals whenever state changes.
// Storing result in state gives components a stable reference (no infinite loop).
function computeTotals(
  items: Record<string, CartItem>,
  coupon: Coupon | null,
  loyaltyPointsToRedeem: number,
  usePassCredit?: boolean,
): CartTotals {
  const itemsArray = Object.entries(items).map(([id, { service, quantity }]) => ({
    id,
    service,
    quantity,
    lineTotal: service.price * quantity,
  }));

  const totalItems = itemsArray.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal   = itemsArray.reduce((sum, i) => sum + i.lineTotal, 0);

  let discountPercent = 0;
  let discountAmount  = 0;
  let couponCode: string | null = null;
  let couponType: 'percent' | 'flat' | null = null;

  if (coupon) {
    couponCode = coupon.code;
    couponType = coupon.type;
    if (coupon.type === 'percent') {
      discountPercent = coupon.value;
      discountAmount  = Math.round(subtotal * (discountPercent / 100));
    } else {
      discountAmount = Math.min(coupon.value, subtotal);
    }
  }

  const loyaltyDiscount = loyaltyPointsToRedeem > 0 ? pointsToRupees(loyaltyPointsToRedeem) : 0;
  const total = usePassCredit ? 0 : Math.max(0, subtotal - discountAmount - loyaltyDiscount);

  return {
    items: itemsArray,
    totalItems,
    subtotal,
    discountPercent,
    discountAmount,
    loyaltyDiscount,
    loyaltyPointsToRedeem,
    total,
    couponCode,
    couponType,
  };
}

const EMPTY_TOTALS: CartTotals = computeTotals({}, null, 0, false);

interface CartStore {
  items: Record<string, CartItem>;
  coupon: Coupon | null;
  loyaltyPointsToRedeem: number;
  usePassCredit: boolean;
  totals: CartTotals;
  selectedAddons: ServiceAddon[];
  addToCart: (service: Service) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  applyCoupon: (coupon: Coupon) => void;
  clearCoupon: () => void;
  applyLoyaltyPoints: (points: number) => void;
  clearLoyaltyPoints: () => void;
  setUsePassCredit: (use: boolean) => void;
  setSelectedAddons: (addons: ServiceAddon[]) => void;
  clearCart: () => void;
  validateAndApplyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  checkout: (details: BookingDetails) => Promise<string | null>;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: {},
  coupon: null,
  loyaltyPointsToRedeem: 0,
  usePassCredit: false,
  totals: EMPTY_TOTALS,
  selectedAddons: [],

  addToCart: (service) => {
    const key = service.serviceId || service.id;
    set((state) => {
      const nextItems = {
        ...state.items,
        [key]: {
          service,
          quantity: state.items[key] ? state.items[key].quantity + 1 : 1,
        },
      };
      return { items: nextItems, totals: computeTotals(nextItems, state.coupon, state.loyaltyPointsToRedeem, state.usePassCredit) };
    });
  },

  removeFromCart: (id) => {
    set((state) => {
      const nextItems = { ...state.items };
      delete nextItems[id];
      return { items: nextItems, totals: computeTotals(nextItems, state.coupon, state.loyaltyPointsToRedeem, state.usePassCredit) };
    });
  },

  updateQuantity: (id, delta) => {
    set((state) => {
      const item = state.items[id];
      if (!item) return state;
      const newQty = item.quantity + delta;
      let nextItems: Record<string, CartItem>;
      if (newQty <= 0) {
        nextItems = { ...state.items };
        delete nextItems[id];
      } else {
        nextItems = { ...state.items, [id]: { ...item, quantity: newQty } };
      }
      return { items: nextItems, totals: computeTotals(nextItems, state.coupon, state.loyaltyPointsToRedeem, state.usePassCredit) };
    });
  },

  applyCoupon: (coupon) => {
    set((state) => ({ coupon, totals: computeTotals(state.items, coupon, state.loyaltyPointsToRedeem, state.usePassCredit) }));
  },

  clearCoupon: () => {
    set((state) => ({ coupon: null, totals: computeTotals(state.items, null, state.loyaltyPointsToRedeem, state.usePassCredit) }));
  },

  applyLoyaltyPoints: (points) => {
    set((state) => ({ loyaltyPointsToRedeem: points, totals: computeTotals(state.items, state.coupon, points, state.usePassCredit) }));
  },

  clearLoyaltyPoints: () => {
    set((state) => ({ loyaltyPointsToRedeem: 0, totals: computeTotals(state.items, state.coupon, 0, state.usePassCredit) }));
  },

  setUsePassCredit: (use) => {
    set((state) => {
      const next = { ...state, usePassCredit: use };
      next.totals = computeTotals(state.items, state.coupon, state.loyaltyPointsToRedeem, use);
      return { usePassCredit: use, totals: next.totals };
    });
  },

  setSelectedAddons: (addons) => {
    set({ selectedAddons: addons });
  },

  clearCart: () => set({ items: {}, loyaltyPointsToRedeem: 0, coupon: null, usePassCredit: false, selectedAddons: [], totals: EMPTY_TOTALS }),

  validateAndApplyCoupon: async (code) => {
    if (!code || !code.trim()) return { success: false, message: 'Enter a coupon code.' };
    const upperCode = code.trim().toUpperCase();
    try {
      const snap = await getDocs(
        query(collection(db, 'coupons'), where('code', '==', upperCode), where('active', '==', true))
      );
      if (snap.empty) return { success: false, message: 'Invalid or expired coupon code.' };

      const couponDoc = snap.docs[0];
      const coupon: Coupon = { id: couponDoc.id, ...couponDoc.data() } as Coupon;

      const expiresAtDate = coupon.expiresAt && 'toDate' in coupon.expiresAt ? coupon.expiresAt.toDate() : null;
      if (expiresAtDate && expiresAtDate < new Date()) {
        return { success: false, message: 'This coupon has expired.' };
      }
      if (coupon.maxUses && (coupon.usedCount || 0) >= coupon.maxUses) {
        return { success: false, message: 'Coupon usage limit reached.' };
      }

      const { totals } = get();
      if (coupon.minOrderValue && totals.subtotal < coupon.minOrderValue) {
        return { success: false, message: `Min order ₹${coupon.minOrderValue.toLocaleString('en-IN')} required.` };
      }

      get().applyCoupon(coupon);

      const label = coupon.type === 'percent' ? `${coupon.value}% off` : `₹${coupon.value} off`;
      return { success: true, message: `"${upperCode}" applied — ${label}!` };
    } catch (err) {
      console.error('Coupon validation error:', err);
      return { success: false, message: 'Could not validate coupon. Try again.' };
    }
  },

  checkout: async (bookingDetails) => {
    const { totals, loyaltyPointsToRedeem, coupon, usePassCredit, selectedAddons } = get();
    if (totals.items.length === 0) return null;

    const redeemedPoints = loyaltyPointsToRedeem;
    const customerUid   = auth.currentUser?.uid || null;

    const addonItems = selectedAddons.map((a) => ({
      serviceId:       a.id,
      title:           a.title,
      category:        'Add-on',
      price:           a.price,
      quantity:        1,
      lineTotal:       a.price,
      durationMinutes: a.durationMinutes || 0,
    }));

    const orderData = {
      items: [
        ...totals.items.map((item) => ({
          serviceId:       item.id,
          title:           item.service.title,
          category:        item.service.category || '',
          price:           item.service.price,
          quantity:        item.quantity,
          lineTotal:       item.lineTotal,
          durationMinutes: item.service.durationMinutes || 0,
        })),
        ...addonItems,
      ],
      totalItems:           totals.totalItems + addonItems.length,
      subtotal:             totals.subtotal + addonItems.reduce((s, a) => s + a.lineTotal, 0),
      discountPercent:      totals.discountPercent,
      discountAmount:       totals.discountAmount,
      couponCode:           totals.couponCode || null,
      loyaltyPointsRedeemed: redeemedPoints,
      loyaltyDiscount:      totals.loyaltyDiscount,
      usedPassCredit: usePassCredit,
      total:                totals.total,
      customer:             bookingDetails.customer || {},
      appointment:          bookingDetails.appointment || {},
      status:               'confirmed',
      createdAt:            serverTimestamp(),
      customerUid,
    };

    const docRef = await addDoc(collection(db, 'orders'), orderData);

    if (coupon?.id) {
      try {
        await updateDoc(doc(db, 'coupons', coupon.id), { usedCount: increment(1) });
      } catch (e) {
        console.warn('Could not increment coupon usage:', e);
      }
    }

    if (usePassCredit && customerUid) {
      const { getActiveSubscription, useSubscriptionCredit: useCredit } = await import('../lib/subscriptions');
      const activeSub = await getActiveSubscription(customerUid);
      if (activeSub) {
        await useCredit(activeSub.id);
      }
    }

    get().clearCart();

    if (customerUid) {
      triggerReferralReward(customerUid).catch(() => {});
      const serviceList = orderData.items.map((i) => i.title).join(', ');
      const appt = orderData.appointment;
      writeBookingNotification(
        customerUid,
        'Booking Confirmed ✓',
        `${serviceList} · ${appt.date || ''} ${appt.timeSlot || ''}`.trim()
      ).catch(() => {});
      earnPoints(customerUid, docRef.id, orderData.total).catch(() => {});
      if (redeemedPoints > 0) {
        spendPoints(customerUid, docRef.id, redeemedPoints).catch(() => {});
      }
    }

    return docRef.id;
  },
}));

// Stable selector — returns stored reference, same between renders unless an action fires.
export const selectCartTotals = (state: CartStore): CartTotals => state.totals;
