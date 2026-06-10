import { db } from './firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Cart state — in-memory only (as per schema: cart_persistence: local_memory_only)
 * Structure: Map<serviceId, { service, quantity }>
 */
const cartItems = new Map();
const listeners = new Set();

/* ---------- Discount Tiers ---------- */
const DISCOUNT_TIERS = [
  { minItems: 5, percent: 20 },
  { minItems: 4, percent: 15 },
  { minItems: 3, percent: 10 },
  { minItems: 2, percent: 5 },
];

function getDiscountPercent(totalItems) {
  for (const tier of DISCOUNT_TIERS) {
    if (totalItems >= tier.minItems) return tier.percent;
  }
  return 0;
}

/* ---------- Notify Listeners ---------- */
function notify() {
  const state = getCartState();
  listeners.forEach((fn) => fn(state));
}

/* ---------- Public API ---------- */

export function onCartChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function addToCart(service) {
  const existing = cartItems.get(service.serviceId || service.id);
  const key = service.serviceId || service.id;
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
  if (item.quantity <= 0) {
    cartItems.delete(serviceId);
  }
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
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const discountPercent = getDiscountPercent(totalItems);
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const total = subtotal - discountAmount;

  return {
    items,
    totalItems,
    subtotal,
    discountPercent,
    discountAmount,
    total,
  };
}

export function getItemCount() {
  let count = 0;
  cartItems.forEach(({ quantity }) => { count += quantity; });
  return count;
}

export function isInCart(serviceId) {
  return cartItems.has(serviceId);
}

/**
 * Checkout — writes order to Firestore (firestore_write_trigger: on_checkout_confirmation)
 */
export async function checkout(bookingDetails = {}) {
  const state = getCartState();
  if (state.items.length === 0) return null;

  const orderData = {
    items: state.items.map((item) => ({
      serviceId: item.id,
      title: item.service.title,
      price: item.service.price,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    totalItems: state.totalItems,
    subtotal: state.subtotal,
    discountPercent: state.discountPercent,
    discountAmount: state.discountAmount,
    total: state.total,
    customer: bookingDetails.customer || {},
    appointment: bookingDetails.appointment || {},
    status: 'confirmed',
    createdAt: serverTimestamp(),
  };

  const ordersRef = collection(db, 'orders');
  const docRef = await addDoc(ordersRef, orderData);

  clearCart();

  return docRef.id;
}
