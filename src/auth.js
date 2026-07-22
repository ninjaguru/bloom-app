import { auth, db } from './firebase.js';
import { ensureReferralCode, attributeReferral } from './referral.js';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const provider = new GoogleAuthProvider();

export function signInWithGoogle() {
  return signInWithPopup(auth, provider);
}

export function logout() {
  return signOut(auth);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function saveProfile(uid, data) {
  await setDoc(doc(db, 'customers', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function loadProfile(uid) {
  const snap = await getDoc(doc(db, 'customers', uid));
  return snap.exists() ? snap.data() : null;
}

export async function onSignIn(uid) {
  await ensureReferralCode(uid);
  await attributeReferral(uid);
}
