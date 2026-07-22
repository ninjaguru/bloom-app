import { db } from './firebase.js';
import {
  doc, getDoc, setDoc, updateDoc, addDoc,
  collection, getDocs, query, where,
  serverTimestamp, arrayUnion,
} from 'firebase/firestore';

export function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'BLOOM-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function ensureReferralCode(uid) {
  const ref = doc(db, 'customers', uid);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data().referralCode : null;
  if (existing) return existing;
  const code = generateReferralCode();
  await setDoc(ref, { referralCode: code }, { merge: true });
  return code;
}

export function captureRefParam() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    sessionStorage.setItem('pendingRef', ref.toUpperCase());
    const url = new URL(window.location.href);
    url.searchParams.delete('ref');
    history.replaceState({}, '', url.toString());
  }
}

export async function attributeReferral(uid) {
  const pending = sessionStorage.getItem('pendingRef');
  if (!pending) return;
  if (!/^BLOOM-[A-Z0-9]{6}$/.test(pending)) {
    sessionStorage.removeItem('pendingRef');
    return;
  }
  const ref = doc(db, 'customers', uid);
  const snap = await getDoc(ref);
  if (snap.exists() && snap.data().referredBy) return;
  await setDoc(ref, { referredBy: pending }, { merge: true });
  sessionStorage.removeItem('pendingRef');
}

export async function triggerReferralReward(customerUid) {
  if (!customerUid) return;
  try {
    const ref = doc(db, 'customers', customerUid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    if (!data.referredBy || data.firstOrderRewarded) return;

    const referrersSnap = await getDocs(
      query(collection(db, 'customers'), where('referralCode', '==', data.referredBy))
    );
    if (referrersSnap.empty) return;

    const referrerUid = referrersSnap.docs[0].id;
    const suffix = Date.now().toString(36).slice(-4).toUpperCase();
    const couponCode = `REF-${referrerUid.slice(0, 5).toUpperCase()}-${suffix}`;

    await addDoc(collection(db, 'coupons'), {
      code: couponCode,
      type: 'flat',
      value: 200,
      active: true,
      maxUses: 1,
      usedCount: 0,
      createdAt: serverTimestamp(),
    });
    await setDoc(ref, { firstOrderRewarded: true }, { merge: true });
    await updateDoc(doc(db, 'customers', referrerUid), {
      earnedReferralCoupons: arrayUnion(couponCode),
    });
  } catch (err) {
    console.warn('Referral reward failed (non-critical):', err);
  }
}

export function getReferralShareUrl(code) {
  return `${window.location.origin}/?ref=${code}`;
}
