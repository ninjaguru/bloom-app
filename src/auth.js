import { auth } from './firebase.js';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

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
