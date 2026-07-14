import { db } from './firebase.js';
import {
  collection, addDoc, query, where, getDocs,
  updateDoc, doc, serverTimestamp, Timestamp, orderBy, limit,
} from 'firebase/firestore';

const SESSION_KEY       = 'bloom_customer_v1';
const OTP_EXPIRY_MIN    = 15;
const WHATSAPP_BUSINESS = '919916953366';

/* ---------- OTP helpers ---------- */

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function requestOTP(phone) {
  const otp       = generateOTP();
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000));

  await addDoc(collection(db, 'otps'), {
    phone,
    otp,
    used:      false,
    createdAt: serverTimestamp(),
    expiresAt,
  });

  const msg = `Hi Bloom Salon! Please send my OTP for login. My number: ${phone}`;
  window.open(`https://wa.me/${WHATSAPP_BUSINESS}?text=${encodeURIComponent(msg)}`, '_blank');

  return true;
}

export async function verifyOTP(phone, inputOTP) {
  const snap = await getDocs(
    query(
      collection(db, 'otps'),
      where('phone',  '==', phone),
      where('otp',    '==', inputOTP.trim()),
      where('used',   '==', false),
    )
  );

  if (snap.empty) return { success: false, message: 'Invalid OTP.' };

  const otpDoc = snap.docs[0];
  const data   = otpDoc.data();

  if (data.expiresAt?.toDate() < new Date()) {
    return { success: false, message: `OTP expired. Request a new one.` };
  }

  await updateDoc(doc(db, 'otps', otpDoc.id), { used: true });

  const session = { phone, loggedIn: true, loginAt: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  return { success: true, session };
}

/* ---------- Session ---------- */

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    // Expire session after 30 days
    if (Date.now() - s.loginAt > 30 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch { return null; }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

/* ---------- Save customer name ---------- */

export function saveCustomerName(name) {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    s.name = name;
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}
