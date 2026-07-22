import { db, getMessagingInstance } from './firebase.js';
import {
  collection, addDoc, getDocs, query, orderBy, limit,
  onSnapshot, writeBatch, serverTimestamp, doc, setDoc,
} from 'firebase/firestore';
import { getToken } from 'firebase/messaging';

const esc = (s) => (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Replace with key from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
const VAPID_KEY = 'YOUR_VAPID_KEY';

export async function requestNotificationPermission(uid) {
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

export async function writeBookingNotification(uid, title, body) {
  if (!uid) return;
  try {
    await addDoc(collection(db, 'customers', uid, 'notifications'), {
      title, body, read: false, createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('writeBookingNotification failed:', err);
  }
}

export function initNotificationBell(uid) {
  const bell  = document.getElementById('notification-bell');
  const badge = document.getElementById('notification-badge');
  const panel = document.getElementById('notification-panel');
  if (!bell || !uid) return () => {};

  const notifQuery = query(
    collection(db, 'customers', uid, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  const unsubscribe = onSnapshot(notifQuery, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const unread = items.filter((n) => !n.read).length;
    badge.textContent = unread > 9 ? '9+' : String(unread);
    badge.style.display = unread > 0 ? 'flex' : 'none';

    panel.innerHTML = items.length === 0
      ? '<p class="notif-empty">No notifications yet</p>'
      : items.map((n) => {
          const time = n.createdAt?.toDate?.()
            ? n.createdAt.toDate().toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short',
                hour: '2-digit', minute: '2-digit',
              })
            : '';
          return `
            <div class="notif-item${n.read ? '' : ' notif-unread'}">
              <div class="notif-title">${esc(n.title)}</div>
              <div class="notif-body">${esc(n.body)}</div>
              ${time ? `<div class="notif-time">${time}</div>` : ''}
            </div>`;
        }).join('');
  });

  bell.addEventListener('click', async (e) => {
    e.stopPropagation();
    const isOpen = panel.classList.toggle('open');
    if (isOpen) {
      const snap = await getDocs(notifQuery);
      const batch = writeBatch(db);
      snap.docs.forEach((d) => { if (!d.data().read) batch.update(d.ref, { read: true }); });
      await batch.commit().catch(() => {});
    }
  });

  const outsideClickHandler = (e) => {
    if (!bell.contains(e.target)) panel.classList.remove('open');
  };
  document.addEventListener('click', outsideClickHandler);

  return () => {
    unsubscribe();
    document.removeEventListener('click', outsideClickHandler);
  };
}

export function showNotificationBanner(uid) {
  if (!uid || !('Notification' in window) || Notification.permission !== 'default') return;
  if (document.getElementById('notif-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'notif-banner';
  banner.className = 'notif-banner';
  banner.innerHTML = `
    <span>Enable notifications for booking alerts</span>
    <button id="notif-allow-btn">Enable</button>
    <button id="notif-dismiss-btn" aria-label="Dismiss">✕</button>
  `;
  document.getElementById('app-header')?.insertAdjacentElement('afterend', banner);
  document.getElementById('notif-allow-btn').addEventListener('click', async () => {
    banner.remove();
    await requestNotificationPermission(uid);
  });
  document.getElementById('notif-dismiss-btn').addEventListener('click', () => banner.remove());
}
