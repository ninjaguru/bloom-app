# Four Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Live Search, Referral System, Push Notifications, and Expiring Loyalty Points to Bloom Salon's Vite + vanilla JS + Firebase app.

**Architecture:** Four independent features sharing Firebase Firestore as backend. Features integrate at `cart.js` `checkout()` and `auth.js` sign-in flow. New modules (`search.js`, `referral.js`, `notifications.js`, `loyalty.js`) keep each feature isolated.

**Tech Stack:** Vite 6, vanilla ES modules, Firebase 11 (Firestore + Auth + Messaging)

**UI Style:** KokonutUI-inspired — glassmorphism cards, `backdrop-filter: blur()`, smooth CSS transitions, dark aesthetic. Implemented in vanilla HTML/CSS using the app's existing CSS variable system.

## Global Constraints

- No new npm packages beyond existing (`firebase`, `vite`)
- Vanilla JS only — no frameworks, no Tailwind
- All Firestore writes use `serverTimestamp()` for `createdAt`
- `serviceId || id` pattern for all service IDs (existing convention)
- Currency formatted as `₹${n.toLocaleString('en-IN')}`
- Points expiry: 30 days from earn date
- Points earn rate: 1 point per ₹10 spent (floor)
- Points redeem rate: 100 points = ₹50, max 500 points per order, min 100 to redeem
- Referral reward: ₹200 flat coupon

---

### Task 1: Live Search

**Files:**
- Create: `src/search.js`
- Modify: `index.html` — add search input between `#categories-section` and `#services-section`
- Modify: `src/styles/index.css` — KokonutUI Action Search Bar-inspired styles
- Modify: `src/main.js` — import search utils, wire input, filter on render

**Interfaces:**
- Produces: `filterServices(services: Array, query: string): Array`
- Produces: `debounce(fn: Function, delay: number): Function`

- [ ] **Step 1: Create `src/search.js`**

```javascript
export function filterServices(services, query) {
  if (!query || !query.trim()) return services;
  const q = query.trim().toLowerCase();
  return services.filter(
    (s) =>
      (s.title || '').toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q)
  );
}

export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
```

- [ ] **Step 2: Add search input to `index.html`**

Insert between closing `</section>` of `#categories-section` and opening `<section class="services-section"`:

```html
<!-- ============ SEARCH ============ -->
<section class="search-section" id="search-section">
  <div class="container">
    <div class="search-wrap">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        class="search-input"
        id="search-input"
        type="search"
        placeholder="Search services…"
        autocomplete="off"
        spellcheck="false"
      />
      <kbd class="search-kbd" id="search-kbd">⌘K</kbd>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Add search styles to `src/styles/index.css`**

Append at end of file:

```css
/* ===== SEARCH (KokonutUI Action Search Bar inspired) ===== */
.search-section {
  padding: 0 0 8px;
}
.search-wrap {
  position: relative;
  max-width: 520px;
  margin: 0 auto;
}
.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
  transition: color 0.2s;
}
.search-input {
  width: 100%;
  padding: 11px 52px 11px 44px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  font-size: 0.9rem;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
.search-input:focus {
  border-color: var(--color-border-hover);
  background: rgba(255, 255, 255, 0.07);
  box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.08);
}
.search-input:focus + .search-kbd { opacity: 0; }
.search-input::placeholder { color: var(--color-text-muted); }
.search-input::-webkit-search-cancel-button { cursor: pointer; }
.search-input:focus ~ .search-icon { color: var(--color-accent-primary); }
.search-kbd {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.68rem;
  color: var(--color-text-muted);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 5px;
  padding: 2px 6px;
  pointer-events: none;
  transition: opacity 0.15s;
}
@media (max-width: 480px) { .search-kbd { display: none; } }
```

- [ ] **Step 4: Wire search in `src/main.js`**

Add to top imports:
```javascript
import { filterServices, debounce } from './search.js';
```

Add `let searchQuery = '';` to app state (alongside `currentGender`, `currentCategory`, `cachedServices`).

Replace `renderServices(displayed)` call inside `subscribeToServices` callback with:
```javascript
    cachedServices = displayed;
    renderServices(filterServices(cachedServices, searchQuery));
```

Add `setupSearch()` function and call it inside `init()`:
```javascript
function setupSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;
  const handleSearch = debounce((query) => {
    searchQuery = query;
    renderServices(filterServices(cachedServices, searchQuery));
  }, 200);
  input.addEventListener('input', (e) => handleSearch(e.target.value));

  // ⌘K / Ctrl+K focus shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });
}
```

In `switchGender()` (inside `setupGenderToggle`), add after `currentCategory = 'All'`:
```javascript
    searchQuery = '';
    const si = document.getElementById('search-input');
    if (si) si.value = '';
```

In `handleCategorySelect()` (inside `loadCategories`), add at top of function:
```javascript
    searchQuery = '';
    const si = document.getElementById('search-input');
    if (si) si.value = '';
```

- [ ] **Step 5: Manual test**

Run `npm run dev`. Type "wax" — only waxing services show. Clear — all services restored. Press ⌘K — input focuses. Switch gender — search clears. Select category — search clears.

- [ ] **Step 6: Commit**

```bash
git add src/search.js index.html src/styles/index.css src/main.js
git commit -m "feat: add live client-side service search with ⌘K shortcut"
```

---

### Task 2: Referral System

**Files:**
- Create: `src/referral.js`
- Modify: `src/auth.js` — `onSignIn(uid)` helper
- Modify: `src/cart.js` — `triggerReferralReward` in `checkout()`
- Modify: `src/ui.js` — referral section in profile modal + import `onSignIn`
- Modify: `src/main.js` — `captureRefParam()` on init

**Interfaces:**
- Produces: `captureRefParam(): void`
- Produces: `ensureReferralCode(uid: string): Promise<string>`
- Produces: `attributeReferral(uid: string): Promise<void>`
- Produces: `triggerReferralReward(customerUid: string): Promise<void>`
- Produces: `getReferralShareUrl(code: string): string`
- Produces: `onSignIn(uid: string): Promise<void>` (in `auth.js`)

- [ ] **Step 1: Create `src/referral.js`**

```javascript
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
```

- [ ] **Step 2: Update `src/auth.js`**

Add import at top:
```javascript
import { ensureReferralCode, attributeReferral } from './referral.js';
```

Add new export at bottom:
```javascript
export async function onSignIn(uid) {
  await ensureReferralCode(uid);
  await attributeReferral(uid);
}
```

- [ ] **Step 3: Update `src/main.js`**

Add import:
```javascript
import { captureRefParam } from './referral.js';
```

Add `captureRefParam();` as the first line inside `init()`.

- [ ] **Step 4: Update `src/cart.js` — trigger referral reward in `checkout()`**

Add import at top:
```javascript
import { triggerReferralReward } from './referral.js';
```

In `checkout()`, after `clearCart();` and before `return docRef.id;`, add:
```javascript
  triggerReferralReward(orderData.customerUid).catch(() => {});
```

- [ ] **Step 5: Update `src/ui.js` — referral section in profile modal**

Add to existing `auth.js` import line — add `onSignIn` to the destructured list:
```javascript
import { signInWithGoogle, logout, onAuthChange, getCurrentUser, saveProfile, loadProfile, onSignIn } from './auth.js';
```

Add import at top of file:
```javascript
import { ensureReferralCode, getReferralShareUrl } from './referral.js';
```

Inside `openProfileModal()`, after the closing `} catch (err) { console.error(err); }` block that loads the profile, add:

```javascript
    // Referral section
    const referralSection = document.getElementById('profile-referral-section');
    if (referralSection) {
      try {
        const code = await ensureReferralCode(user.uid);
        const shareUrl = getReferralShareUrl(code);
        const waMsg = encodeURIComponent(
          `Use my code ${code} to get ₹200 off your first Bloom Salon booking! ${shareUrl}`
        );
        referralSection.innerHTML = `
          <h3 class="booking-section-title">Refer a Friend</h3>
          <p class="referral-desc">Share your code — when a friend books their first appointment, you get <strong>₹200 off</strong> yours.</p>
          <div class="referral-code-box">
            <span class="referral-code">${code}</span>
            <button class="referral-copy-btn" id="referral-copy-btn">Copy link</button>
          </div>
          <a class="referral-wa-btn" href="https://wa.me/?text=${waMsg}" target="_blank" rel="noopener">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.553 4.103 1.518 5.82L0 24l6.337-1.493A11.954 11.954 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.365l-.359-.213-3.728.879.892-3.636-.234-.374A9.818 9.818 0 1 1 12 21.818z"/></svg>
            Share on WhatsApp
          </a>`;
        document.getElementById('referral-copy-btn')?.addEventListener('click', async () => {
          const btn = document.getElementById('referral-copy-btn');
          try {
            await navigator.clipboard.writeText(shareUrl);
            btn.textContent = 'Copied!';
          } catch {
            const inp = Object.assign(document.createElement('input'), { value: shareUrl });
            document.body.appendChild(inp);
            inp.select();
            document.execCommand('copy');
            document.body.removeChild(inp);
            btn.textContent = 'Copied!';
          }
          setTimeout(() => { if (btn) btn.textContent = 'Copy link'; }, 2000);
        });
      } catch (err) {
        console.warn('Referral section error:', err);
      }
    }
```

In `setupLoginModal()`, in the Google sign-in button click handler, after `await signInWithGoogle();` and before `closeLogin();`, add:
```javascript
      const signedInUser = getCurrentUser();
      if (signedInUser) onSignIn(signedInUser.uid).catch(() => {});
```

- [ ] **Step 6: Add referral section div to `index.html` profile modal**

In the profile modal `<div class="booking-body">`, after the closing `</div>` of the Default Address `.booking-section` and before `<p class="booking-error" id="profile-error">`, add:
```html
<div class="booking-section" id="profile-referral-section">
  <!-- Populated by JS -->
</div>
```

- [ ] **Step 7: Add referral CSS to `src/styles/index.css`**

Append:
```css
/* ===== REFERRAL (KokonutUI glass card aesthetic) ===== */
.referral-desc {
  font-size: 0.82rem;
  color: var(--color-text-secondary);
  margin: 0 0 14px;
  line-height: 1.55;
}
.referral-desc strong { color: var(--color-gold); }
.referral-code-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  margin-bottom: 12px;
}
.referral-code {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--color-accent-primary);
  letter-spacing: 2px;
  flex: 1;
}
.referral-copy-btn {
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 0.78rem;
  padding: 5px 12px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
  white-space: nowrap;
}
.referral-copy-btn:hover {
  border-color: var(--color-accent-primary);
  color: var(--color-accent-primary);
}
.referral-wa-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 16px;
  background: rgba(37, 211, 102, 0.08);
  border: 1px solid rgba(37, 211, 102, 0.25);
  border-radius: var(--radius-md);
  color: #25d366;
  font-size: 0.84rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s;
}
.referral-wa-btn:hover {
  background: rgba(37, 211, 102, 0.14);
  color: #25d366;
}
```

- [ ] **Step 8: Manual test**

Run `npm run dev`. Visit `http://localhost:5173?ref=BLOOM-TEST123`. Check `sessionStorage.getItem('pendingRef')` in console — should be `"BLOOM-TEST123"`. URL should be clean. Sign in → profile modal → referral section shows code + share buttons. Copy button copies URL to clipboard.

- [ ] **Step 9: Commit**

```bash
git add src/referral.js src/auth.js src/cart.js src/ui.js src/main.js index.html src/styles/index.css
git commit -m "feat: add referral system with ₹200 coupon reward on first booking"
```

---

### Task 3: Push Notifications

**Files:**
- Create: `src/notifications.js`
- Create: `public/firebase-messaging-sw.js`
- Modify: `src/firebase.js` — add `getMessagingInstance()`
- Modify: `src/cart.js` — write notification doc on checkout
- Modify: `src/ui.js` — init bell + notification permission banner
- Modify: `index.html` — add bell icon to header nav
- Modify: `src/styles/index.css` — bell + panel styles

**Prerequisite (manual step):** Generate VAPID key: Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Generate key pair. Copy the key string and paste it into `src/notifications.js` replacing `'YOUR_VAPID_KEY'`.

**Interfaces:**
- Produces: `getMessagingInstance(): Promise<Messaging|null>` (in `firebase.js`)
- Produces: `writeBookingNotification(uid: string, title: string, body: string): Promise<void>`
- Produces: `initNotificationBell(uid: string): () => void` (returns unsubscribe)
- Produces: `showNotificationBanner(uid: string): void`
- Produces: `requestNotificationPermission(uid: string): Promise<void>`

- [ ] **Step 1: Update `src/firebase.js`**

Replace entire file:
```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getMessaging, isSupported } from 'firebase/messaging';

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

export async function getMessagingInstance() {
  try {
    const supported = await isSupported();
    if (!supported) return null;
    return getMessaging(app);
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Create `public/` directory and `public/firebase-messaging-sw.js`**

```javascript
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
```

- [ ] **Step 3: Create `src/notifications.js`**

```javascript
import { db, getMessagingInstance } from './firebase.js';
import {
  collection, addDoc, getDocs, query, orderBy, limit,
  onSnapshot, writeBatch, serverTimestamp, doc, setDoc,
} from 'firebase/firestore';
import { getToken } from 'firebase/messaging';

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
              <div class="notif-title">${n.title}</div>
              <div class="notif-body">${n.body}</div>
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

  document.addEventListener('click', (e) => {
    if (!bell.contains(e.target)) panel.classList.remove('open');
  });

  return unsubscribe;
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
```

- [ ] **Step 4: Add bell HTML to `index.html` header**

In `<nav class="header-nav">`, after the closing `</div>` of `#profile-dropdown-wrap` and before `<button class="cart-toggle"`:

```html
<!-- Notification Bell -->
<div class="notif-bell-wrap" id="notif-bell-wrap" style="display:none;">
  <button class="notif-bell" id="notification-bell" aria-label="Notifications">
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
    <span class="notif-badge" id="notification-badge" style="display:none;"></span>
  </button>
  <div class="notif-panel" id="notification-panel"></div>
</div>
```

- [ ] **Step 5: Update `src/ui.js`**

Add imports at top:
```javascript
import { initNotificationBell, showNotificationBanner } from './notifications.js';
```

In `setupLoginModal()`, declare unsubscribe holder before `onAuthChange`:
```javascript
  let _notifUnsubscribe = null;
```

Replace the existing `onAuthChange((user) => updateLoginHeader(user));` line with:
```javascript
  onAuthChange((user) => {
    updateLoginHeader(user);
    const bellWrap = document.getElementById('notif-bell-wrap');
    if (user) {
      if (bellWrap) bellWrap.style.display = 'block';
      if (_notifUnsubscribe) _notifUnsubscribe();
      _notifUnsubscribe = initNotificationBell(user.uid);
    } else {
      if (bellWrap) bellWrap.style.display = 'none';
      if (_notifUnsubscribe) { _notifUnsubscribe(); _notifUnsubscribe = null; }
    }
  });
```

In the Google sign-in button click handler, after `showToast('Signed in with Google!')`:
```javascript
      const signedInUser = getCurrentUser();
      if (signedInUser) showNotificationBanner(signedInUser.uid);
```

- [ ] **Step 6: Update `src/cart.js` — write notification on checkout**

Add import:
```javascript
import { writeBookingNotification } from './notifications.js';
```

In `checkout()`, after `clearCart();` and before `return docRef.id;`:
```javascript
  if (orderData.customerUid) {
    const serviceList = orderData.items.map((i) => i.title).join(', ');
    const appt = orderData.appointment || {};
    writeBookingNotification(
      orderData.customerUid,
      'Booking Confirmed ✓',
      `${serviceList} · ${appt.date || ''} ${appt.timeSlot || ''}`.trim()
    ).catch(() => {});
  }
```

- [ ] **Step 7: Add notification CSS to `src/styles/index.css`**

Append:
```css
/* ===== NOTIFICATIONS (KokonutUI Smooth Drawer / Profile Dropdown inspired) ===== */
.notif-bell-wrap {
  position: relative;
}
.notif-bell {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, background 0.2s;
  position: relative;
}
.notif-bell:hover {
  color: var(--color-text-primary);
  background: var(--color-surface-hover);
}
.notif-badge {
  position: absolute;
  top: 3px;
  right: 3px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: var(--color-pink);
  color: #fff;
  border-radius: 999px;
  font-size: 0.62rem;
  font-weight: 700;
  align-items: center;
  justify-content: center;
  line-height: 16px;
  box-sizing: border-box;
}
.notif-panel {
  display: none;
  position: absolute;
  top: calc(100% + 10px);
  right: -8px;
  width: 310px;
  max-height: 380px;
  overflow-y: auto;
  background: rgba(9, 26, 17, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(74, 222, 128, 0.06);
  z-index: 300;
  padding: 6px 0;
  animation: notifSlideIn 0.18s ease;
}
.notif-panel.open { display: block; }
@keyframes notifSlideIn {
  from { opacity: 0; transform: translateY(-6px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.notif-item {
  padding: 11px 16px;
  border-bottom: 1px solid rgba(74, 222, 128, 0.07);
  transition: background 0.15s;
}
.notif-item:last-child { border-bottom: none; }
.notif-item:hover { background: var(--color-surface); }
.notif-unread { background: rgba(74, 222, 128, 0.04); }
.notif-title {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 3px;
}
.notif-body {
  font-size: 0.77rem;
  color: var(--color-text-secondary);
  line-height: 1.45;
}
.notif-time {
  font-size: 0.68rem;
  color: var(--color-text-muted);
  margin-top: 5px;
}
.notif-empty {
  padding: 28px 16px;
  text-align: center;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}
.notif-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  background: rgba(74, 222, 128, 0.06);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(74, 222, 128, 0.12);
  font-size: 0.82rem;
  color: var(--color-text-secondary);
  animation: bannerSlide 0.25s ease;
}
@keyframes bannerSlide {
  from { opacity: 0; transform: translateY(-100%); }
  to   { opacity: 1; transform: translateY(0); }
}
.notif-banner span { flex: 1; }
.notif-banner button {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 4px 11px;
  font-size: 0.78rem;
  transition: all 0.15s;
}
#notif-allow-btn {
  border-color: var(--color-accent-primary);
  color: var(--color-accent-primary);
}
#notif-allow-btn:hover { background: rgba(74, 222, 128, 0.1); }
```

- [ ] **Step 8: Manual test**

Run `npm run dev`. Sign in — bell icon appears in header. Complete a booking — bell badge shows 1. Click bell — notification panel slides open with booking details. Dismiss button on notification banner works. Sign out — bell hidden.

Note: FCM push delivery to background tabs requires HTTPS + valid VAPID key. In-app notifications work on localhost without it.

- [ ] **Step 9: Commit**

```bash
git add public/firebase-messaging-sw.js src/notifications.js src/firebase.js src/cart.js src/ui.js index.html src/styles/index.css
git commit -m "feat: add in-app notification bell and FCM push notification support"
```

---

### Task 4: Expiring Loyalty Points

**Files:**
- Create: `src/loyalty.js`
- Modify: `src/cart.js` — loyalty discount in cart state + earn/spend in checkout
- Modify: `src/ui.js` — loyalty toggle in cart drawer + balance in profile modal
- Modify: `index.html` — loyalty rows in cart footer + loyalty section in profile modal
- Modify: `src/styles/index.css` — loyalty UI styles

**Interfaces:**
- Produces: `getLoyaltyBalance(uid: string): Promise<{ available: number, nextExpiry: Date|null }>`
- Produces: `earnPoints(uid: string, orderId: string, totalPaid: number): Promise<void>`
- Produces: `spendPoints(uid: string, orderId: string, points: number): Promise<void>`
- Produces: `pointsToRupees(points: number): number`
- Produces: `clampRedeemPoints(points: number): number`
- Produces: `canRedeem(available: number): boolean`
- Produces: `getExpiryWarningText(nextExpiry: Date|null): string|null`
- Produces: `applyLoyaltyPoints(points: number): void` (in `cart.js`)
- Produces: `clearLoyaltyPoints(): void` (in `cart.js`)
- Produces: `getLoyaltyPointsApplied(): number` (in `cart.js`)
- Produces: `setupLoyaltyRow(uid: string): Promise<void>` (in `ui.js`)

- [ ] **Step 1: Create `src/loyalty.js`**

```javascript
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
```

- [ ] **Step 2: Update `src/cart.js` — loyalty discount in cart state**

Add import at top:
```javascript
import { earnPoints, spendPoints, pointsToRupees } from './loyalty.js';
```

Add loyalty state at module level near `let appliedCoupon = null;`:
```javascript
let loyaltyPointsToRedeem = 0;
```

Add three new exports after `clearCoupon`:
```javascript
export function applyLoyaltyPoints(points) {
  loyaltyPointsToRedeem = points;
  notify();
}

export function clearLoyaltyPoints() {
  loyaltyPointsToRedeem = 0;
  notify();
}

export function getLoyaltyPointsApplied() {
  return loyaltyPointsToRedeem;
}
```

In `getCartState()`, replace the final `return` statement with:
```javascript
  const loyaltyDiscount = loyaltyPointsToRedeem > 0 ? pointsToRupees(loyaltyPointsToRedeem) : 0;
  const total = subtotal - discountAmount - loyaltyDiscount;

  return {
    items, totalItems, subtotal,
    discountPercent, discountAmount, total,
    couponCode, couponType,
    loyaltyDiscount,
    loyaltyPointsToRedeem,
  };
```

In `clearCart()`, add `loyaltyPointsToRedeem = 0;` before `notify();`.

In `checkout()`, before `clearCart();`, capture the redeemed amount:
```javascript
  const redeemedPoints = loyaltyPointsToRedeem;
```

After `clearCart();` and after the existing referral/notification fire-and-forget calls, add:
```javascript
  if (orderData.customerUid) {
    earnPoints(orderData.customerUid, docRef.id, orderData.total).catch(() => {});
    if (redeemedPoints > 0) {
      spendPoints(orderData.customerUid, docRef.id, redeemedPoints).catch(() => {});
    }
  }
```

Also update `orderData` object (inside `checkout()`) to include loyalty fields:
```javascript
    loyaltyPointsRedeemed: loyaltyPointsToRedeem,
    loyaltyDiscount:       pointsToRupees(loyaltyPointsToRedeem),
```

- [ ] **Step 3: Add loyalty HTML rows to `index.html`**

In the cart footer (`<div class="cart-footer">`), after `<p class="coupon-status" id="coupon-status"></p>` and before `<div class="cart-discount-info"`:
```html
<!-- Loyalty Points Toggle -->
<div class="loyalty-toggle-row" id="loyalty-toggle-row" style="display:none;">
  <div class="loyalty-toggle-info" id="loyalty-toggle-info"></div>
  <button class="loyalty-use-btn" id="loyalty-use-btn">Use Points</button>
</div>
```

In the cart summary section, after `<div class="cart-row discount-row" id="discount-row"`:
```html
<div class="cart-row discount-row" id="loyalty-discount-row" style="display:none;">
  <span>Points Discount</span>
  <span class="discount-value" id="cart-loyalty-discount">-₹0</span>
</div>
```

In the profile modal `<div class="booking-body">`, after `#profile-referral-section` div and before `<p class="booking-error"`:
```html
<div class="booking-section" id="profile-loyalty-section">
  <!-- Populated by JS -->
</div>
```

- [ ] **Step 4: Update `src/ui.js` — loyalty toggle + profile balance**

Add imports at top:
```javascript
import {
  getLoyaltyBalance, canRedeem, pointsToRupees,
  clampRedeemPoints, getExpiryWarningText,
} from './loyalty.js';
import { applyLoyaltyPoints, clearLoyaltyPoints, getLoyaltyPointsApplied } from './cart.js';
```

In `renderCart(state)`, in the summary section after the existing discount row logic, add:
```javascript
  // Loyalty discount summary row
  const loyaltyDiscRow = document.getElementById('loyalty-discount-row');
  if (loyaltyDiscRow) {
    if (state.loyaltyDiscount > 0) {
      loyaltyDiscRow.style.display = 'flex';
      document.getElementById('cart-loyalty-discount').textContent = `-${formatPrice(state.loyaltyDiscount)}`;
    } else {
      loyaltyDiscRow.style.display = 'none';
    }
  }
  // Update loyalty toggle button state
  const loyaltyUseBtn = document.getElementById('loyalty-use-btn');
  if (loyaltyUseBtn) {
    const applied = state.loyaltyPointsToRedeem > 0;
    loyaltyUseBtn.textContent = applied ? 'Remove' : 'Use Points';
    loyaltyUseBtn.classList.toggle('active', applied);
  }
```

Add new export function `setupLoyaltyRow`:
```javascript
export async function setupLoyaltyRow(uid) {
  const row  = document.getElementById('loyalty-toggle-row');
  const info = document.getElementById('loyalty-toggle-info');
  const btn  = document.getElementById('loyalty-use-btn');
  if (!row || !uid) return;

  try {
    const { available, nextExpiry } = await getLoyaltyBalance(uid);
    if (!canRedeem(available)) {
      row.style.display = 'none';
      return;
    }
    const redeemable = clampRedeemPoints(available);
    const rupees     = pointsToRupees(redeemable);
    const warning    = getExpiryWarningText(nextExpiry);

    info.innerHTML = `
      <span class="loyalty-pts-label">${available} pts</span>
      <span class="loyalty-val-label">≈ ₹${rupees} off</span>
      ${warning ? `<span class="loyalty-expiry-badge">${warning}</span>` : ''}
    `;
    row.style.display = 'flex';

    btn.onclick = () => {
      if (getLoyaltyPointsApplied() > 0) {
        clearLoyaltyPoints();
      } else {
        applyLoyaltyPoints(redeemable);
      }
    };
  } catch (err) {
    console.warn('setupLoyaltyRow failed:', err);
  }
}
```

In `openProfileModal()`, after the referral section try/catch block, add:
```javascript
    // Loyalty balance in profile
    const loyaltySection = document.getElementById('profile-loyalty-section');
    if (loyaltySection) {
      try {
        const { available, nextExpiry } = await getLoyaltyBalance(user.uid);
        const expStr = nextExpiry
          ? nextExpiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : null;
        loyaltySection.innerHTML = `
          <h3 class="booking-section-title">Loyalty Points</h3>
          <div class="loyalty-profile-card">
            <div class="loyalty-profile-left">
              <div class="loyalty-profile-pts">${available}</div>
              <div class="loyalty-profile-label">points available</div>
              ${expStr ? `<div class="loyalty-profile-expiry">Expires ${expStr}</div>` : ''}
            </div>
            <div class="loyalty-profile-right">
              <div class="loyalty-profile-value">≈ ₹${pointsToRupees(available)}</div>
              <div class="loyalty-profile-sublabel">redeemable</div>
            </div>
          </div>
          <p class="loyalty-profile-note">Earn 1 pt per ₹10 · 100 pts = ₹50 off · Expire in 30 days</p>
        `;
      } catch { /* silent */ }
    }
```

In `setupLoginModal()`, update the `onAuthChange` callback to include loyalty setup. Replace the callback added in Task 3 with this final version that handles all three: header, bell, and loyalty:
```javascript
  onAuthChange((user) => {
    updateLoginHeader(user);
    const bellWrap = document.getElementById('notif-bell-wrap');
    const loyaltyRow = document.getElementById('loyalty-toggle-row');
    if (user) {
      if (bellWrap) bellWrap.style.display = 'block';
      if (_notifUnsubscribe) _notifUnsubscribe();
      _notifUnsubscribe = initNotificationBell(user.uid);
      setupLoyaltyRow(user.uid).catch(() => {});
    } else {
      if (bellWrap) bellWrap.style.display = 'none';
      if (loyaltyRow) loyaltyRow.style.display = 'none';
      if (_notifUnsubscribe) { _notifUnsubscribe(); _notifUnsubscribe = null; }
      clearLoyaltyPoints();
    }
  });
```

- [ ] **Step 5: Add loyalty CSS to `src/styles/index.css`**

Append:
```css
/* ===== LOYALTY POINTS (KokonutUI glass card aesthetic) ===== */
.loyalty-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 6px;
}
.loyalty-toggle-info {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
  min-width: 0;
}
.loyalty-pts-label {
  font-weight: 700;
  color: var(--color-accent-primary);
  font-size: 0.87rem;
}
.loyalty-val-label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}
.loyalty-expiry-badge {
  font-size: 0.7rem;
  color: var(--color-red);
  background: rgba(251, 113, 133, 0.1);
  border: 1px solid rgba(251, 113, 133, 0.22);
  border-radius: var(--radius-sm);
  padding: 1px 7px;
  white-space: nowrap;
}
.loyalty-use-btn {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 0.78rem;
  padding: 5px 13px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s;
}
.loyalty-use-btn:hover,
.loyalty-use-btn.active {
  border-color: var(--color-accent-primary);
  color: var(--color-accent-primary);
  background: rgba(74, 222, 128, 0.07);
}
/* Profile loyalty card — KokonutUI glassmorphism */
.loyalty-profile-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: rgba(255, 255, 255, 0.035);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(74, 222, 128, 0.18);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  margin-bottom: 10px;
}
.loyalty-profile-left { display: flex; flex-direction: column; gap: 3px; }
.loyalty-profile-pts {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 900;
  color: var(--color-accent-primary);
  line-height: 1;
}
.loyalty-profile-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.loyalty-profile-expiry {
  font-size: 0.72rem;
  color: var(--color-red);
  margin-top: 2px;
}
.loyalty-profile-right { text-align: right; }
.loyalty-profile-value {
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--color-gold);
}
.loyalty-profile-sublabel {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}
.loyalty-profile-note {
  font-size: 0.73rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}
```

- [ ] **Step 6: Manual test**

Run `npm run dev`. Sign in. To test without spending ₹1000, manually add a Firestore doc at `customers/{uid}/loyaltyTransactions`:
```
{ type: "earn", points: 150, orderId: "test", expiresAt: <Timestamp 30 days from now>, createdAt: <Timestamp now> }
```
Open cart with items — loyalty row appears showing "150 pts ≈ ₹50 off". Click "Use Points" — button turns green, cart total decreases. Confirm booking — loyalty discount reflected in order. Open Profile → loyalty card shows 150 pts.

Test expiry badge: set `expiresAt` to 3 days from now — red badge appears on loyalty row.

- [ ] **Step 7: Commit**

```bash
git add src/loyalty.js src/cart.js src/ui.js index.html src/styles/index.css
git commit -m "feat: add expiring loyalty points — earn 1pt/₹10, redeem 100pts=₹50, expire 30 days"
```

---

## Implementation Order

Tasks are independent but all modify `src/cart.js` and `src/ui.js`. Implement in order (1→2→3→4) to apply cart.js and ui.js changes additively. Task 4's `onAuthChange` callback replaces Task 3's — Step 4 of Task 4 shows the final merged version.
