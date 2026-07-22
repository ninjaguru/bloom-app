import { db, getMessagingInstance } from './firebase';
import {
  collection, addDoc, getDocs, query, orderBy, limit,
  writeBatch, serverTimestamp, doc, setDoc,
} from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { AppNotification } from '../types';

const VAPID_KEY = 'BCkA99p12XHsrAwH817M6fZl3Vln2aJlvpt-CpAc9ok1G4Z0oQe1c6F_yw2MfezDM2dNmX2Uedseyvc2ZZ8MqZc';

export async function requestNotificationPermission(uid: string): Promise<void> {
  if (!('Notification' in window)) return;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return;
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
    if (token) {
      await setDoc(doc(db, 'customers', uid), { fcmToken: token }, { merge: true });
    }
  } catch (err) {
    console.warn('FCM token save failed:', err);
  }
}

export async function writeBookingNotification(uid: string, title: string, body: string): Promise<void> {
  if (!uid) return;
  try {
    await addDoc(collection(db, 'customers', uid, 'notifications'), {
      title, body, read: false, createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('writeBookingNotification failed:', err);
  }
}

export async function markNotificationsAsRead(uid: string): Promise<void> {
  if (!uid) return;
  try {
    const notifQuery = query(
      collection(db, 'customers', uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const snap = await getDocs(notifQuery);
    const batch = writeBatch(db);
    let count = 0;
    snap.docs.forEach((d) => {
      if (!d.data().read) {
        batch.update(d.ref, { read: true });
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
    }
  } catch (err) {
    console.warn('markNotificationsAsRead failed:', err);
  }
}
