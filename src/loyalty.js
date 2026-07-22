import { db } from './firebase.js';
import {
  collection, addDoc, getDocs, query, orderBy,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';

const EARN_RATE        = 10;   // ₹10 = 1 point
const REDEEM_RATE      = 100;  // 100 points = ₹50
const REDEEM_VALUE     = 50;   // ₹ per 100 points
const MAX_REDEEM_POINTS = 500; // cap per order
const MIN_REDEEM_POINTS = 100; // minimum to redeem
const EXPIRY_DAYS      = 30;

export async function getLoyaltyBalance(uid) {
  if (!uid) return { available: 0, nextExpiry: null };
  try {
    const snap = await getDocs(
      query(collection(db, 'customers', uid, 'loyaltyTransactions'), orderBy('createdAt', 'asc'))
    );
    const now = new Date();
    let earned = 0;
    let spent  = 0;
    let nextExpiry = null;

    snap.docs.forEach((d) => {
      const t = d.data();
      if (t.type === 'earn') {
        const expiry = t.expiresAt?.toDate?.() ?? null;
        if (expiry && expiry > now) {
          earned += t.points;
          if (!nextExpiry || expiry < nextExpiry) nextExpiry = expiry;
        }
      } else if (t.type === 'spend') {
        spent += t.points;
      }
    });

    return { available: Math.max(0, earned - spent), nextExpiry };
  } catch (err) {
    console.warn('getLoyaltyBalance failed:', err);
    return { available: 0, nextExpiry: null };
  }
}

export async function earnPoints(uid, orderId, totalPaid) {
  if (!uid || !totalPaid) return;
  const points = Math.floor(totalPaid / EARN_RATE);
  if (points <= 0) return;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS);
  try {
    await addDoc(collection(db, 'customers', uid, 'loyaltyTransactions'), {
      type: 'earn',
      points,
      orderId,
      expiresAt: Timestamp.fromDate(expiresAt),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('earnPoints failed:', err);
  }
}

export async function spendPoints(uid, orderId, points) {
  if (!uid || points <= 0) return;
  try {
    await addDoc(collection(db, 'customers', uid, 'loyaltyTransactions'), {
      type: 'spend',
      points,
      orderId,
      expiresAt: null,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('spendPoints failed:', err);
  }
}

export function pointsToRupees(points) {
  return Math.floor(points / REDEEM_RATE) * REDEEM_VALUE;
}

export function clampRedeemPoints(points) {
  const floored = Math.floor(points / REDEEM_RATE) * REDEEM_RATE;
  return Math.min(floored, MAX_REDEEM_POINTS);
}

export function canRedeem(available) {
  return available >= MIN_REDEEM_POINTS;
}

export function getExpiryWarningText(nextExpiry) {
  if (!nextExpiry) return null;
  const daysLeft = Math.ceil((nextExpiry - new Date()) / (1000 * 60 * 60 * 24));
  return daysLeft <= 7 ? `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}` : null;
}
