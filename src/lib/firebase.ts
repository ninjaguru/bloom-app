import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getMessaging, isSupported, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDdgn9XnjtJp9i7GlWmCUmuze8vHXATb2k",
  authDomain: "maison-salon-at-home.firebaseapp.com",
  projectId: "maison-salon-at-home",
  storageBucket: "maison-salon-at-home.firebasestorage.app",
  messagingSenderId: "18321783031",
  appId: "1:18321783031:web:498e0265f46e5ff1467bf2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export async function getMessagingInstance(): Promise<Messaging | null> {
  try {
    const supported = await isSupported();
    if (!supported) return null;
    return getMessaging(app);
  } catch {
    return null;
  }
}
