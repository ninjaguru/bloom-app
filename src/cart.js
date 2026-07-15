import { db } from './firebase.js';
import { getAuth } from 'firebase/auth';
import {
  collection, addDoc, serverTimestamp,
  query, where, getDocs,
  updateDoc, doc, increment,
} from 'firebase/firestore';

const cartItems = new Map();
const listeners = new Set();

/* ---------- Coupon State ---------- */
let appliedCoupon = null;

/* ---------- Notify Listeners ---------- */
function notify() {
  const state = getCartState();
  listeners.forEach((fn) => fn(state));
}

/* ---------- Public Cart API ---------- */

export function onCartChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function addToCart(service) {
  const key = service.serviceId || service.id;
  const existing = cartItems.get(key);
  if (existing) {
    existing.quantity += 1;
  } else {
    cartItems.set(key, { service, quantity: 1 });
  }
  notify();
}

export function removeFromCart(serviceId) {
  cartItems.delete(serviceId);
  notify();
}

export function updateQuantity(serviceId, delta) {
  const item = cartItems.get(serviceId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) cartItems.delete(serviceId);
  notify();
}

export function clearCart() {
  cartItems.clear();
  notify();
}

export function getCartState() {
  const items = Array.from(cartItems.entries()).map(([id, { service, quantity }]) => ({
    id,
    service,
    quantity,
    lineTotal: service.price * quantity,
  }));

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal   = items.reduce((sum, i) => sum + i.lineTotal, 0);

  let discountPercent = 0;
  let discountAmount  = 0;
  let couponCode      = null;
  let couponType      = null;

  if (appliedCoupon) {
    couponCode = appliedCoupon.code;
    couponType = appliedCoupon.type;
    if (appliedCoupon.type === 'percent') {
      discountPercent = appliedCoupon.value;
      discountAmount  = Math.round(subtotal * (discountPercent / 100));
    } else {
      discountAmount = Math.min(appliedCoupon.value, subtotal);
    }
  }

  const total = subtotal - discountAmount;

  return { items, totalItems, subtotal, discountPercent, discountAmount, total, couponCode, couponType };
}

export function getItemCount() {
  let count = 0;
  cartItems.forEach(({ quantity }) => { count += quantity; });
  return count;
}

export function isInCart(serviceId) {
  return cartItems.has(serviceId);
}

/* ---------- Coupon API ---------- */

export function getCouponState() {
  return appliedCoupon ? { ...appliedCoupon } : null;
}

export function clearCoupon() {
  appliedCoupon = null;
  notify();
}

export async function validateAndApplyCoupon(code) {
  if (!code || !code.trim()) return { success: false, message: 'Enter a coupon code.' };
  const upperCode = code.trim().toUpperCase();

  try {
    const snap = await getDocs(
      query(
        collection(db, 'coupons'),
        where('code', '==', upperCode),
        where('active', '==', true),
      )
    );

    if (snap.empty) return { success: false, message: 'Invalid or expired coupon code.' };

    const couponDoc = snap.docs[0];
    const coupon = { id: couponDoc.id, ...couponDoc.data() };

    if (coupon.expiresAt?.toDate && coupon.expiresAt.toDate() < new Date()) {
      return { success: false, message: 'This coupon has expired.' };
    }
    if (coupon.maxUses && (coupon.usedCount || 0) >= coupon.maxUses) {
      return { success: false, message: 'Coupon usage limit reached.' };
    }

    const state = getCartState();
    if (coupon.minOrderValue && state.subtotal < coupon.minOrderValue) {
      return { success: false, message: `Min order ₹${coupon.minOrderValue.toLocaleString('en-IN')} required.` };
    }

    appliedCoupon = coupon;
    notify();

    const label = coupon.type === 'percent' ? `${coupon.value}% off` : `₹${coupon.value} off`;
    return { success: true, message: `"${upperCode}" applied — ${label}!` };
  } catch (err) {
    console.error('Coupon validation error:', err);
    return { success: false, message: 'Could not validate coupon. Try again.' };
  }
}

/* ---------- Checkout ---------- */

export async function checkout(bookingDetails = {}) {
  const state = getCartState();
  if (state.items.length === 0) return null;

  const orderData = {
    items: state.items.map((item) => ({
      serviceId:       item.id,
      title:           item.service.title,
      category:        item.service.category || '',
      price:           item.service.price,
      quantity:        item.quantity,
      lineTotal:       item.lineTotal,
      durationMinutes: item.service.durationMinutes || 0,
    })),
    totalItems:      state.totalItems,
    subtotal:        state.subtotal,
    discountPercent: state.discountPercent,
    discountAmount:  state.discountAmount,
    couponCode:      state.couponCode || null,
    total:           state.total,
    customer:        bookingDetails.customer    || {},
    appointment:     bookingDetails.appointment || {},
    status:          'confirmed',
    createdAt:       serverTimestamp(),
    customerUid:     getAuth().currentUser?.uid || null,
  };

  const docRef = await addDoc(collection(db, 'orders'), orderData);

  if (appliedCoupon?.id) {
    try {
      await updateDoc(doc(db, 'coupons', appliedCoupon.id), { usedCount: increment(1) });
    } catch (e) {
      console.warn('Could not increment coupon usage:', e);
    }
  }

  clearCart();
  clearCoupon();

  return docRef.id;
}
