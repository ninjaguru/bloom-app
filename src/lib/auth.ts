import { auth, db } from './firebase';
import { ensureReferralCode, attributeReferral } from './referral';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  NextOrObserver,
  Unsubscribe,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { CustomerProfile } from '../types';

const provider = new GoogleAuthProvider();

export function signInWithGoogle() {
  return signInWithPopup(auth, provider);
}

export function logout() {
  return signOut(auth);
}

export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

export function onAuthChange(callback: NextOrObserver<FirebaseUser>): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export async function saveProfile(uid: string, data: Partial<CustomerProfile>): Promise<void> {
  await setDoc(doc(db, 'customers', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function loadProfile(uid: string): Promise<CustomerProfile | null> {
  const snap = await getDoc(doc(db, 'customers', uid));
  return snap.exists() ? (snap.data() as CustomerProfile) : null;
}

export async function onSignIn(uid: string): Promise<void> {
  await ensureReferralCode(uid);
  await attributeReferral(uid);
}
