importScripts('https://www.gstatic.com/firebasejs/11.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDdgn9XnjtJp9i7GlWmCUmuze8vHXATb2k",
  authDomain: "maison-salon-at-home.firebaseapp.com",
  projectId: "maison-salon-at-home",
  storageBucket: "maison-salon-at-home.firebasestorage.app",
  messagingSenderId: "18321783031",
  appId: "1:18321783031:web:498e0265f46e5ff1467bf2"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'Bloom Salon', {
    body: body || '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
  });
});
