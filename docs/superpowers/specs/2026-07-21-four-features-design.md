# Design: Live Search, Referral System, Push Notifications, Expiring Loyalty Points

**Date:** 2026-07-21  
**Project:** Bloom Salon — Vite + Vanilla JS + Firebase (Firestore + Auth)  
**Scope:** Four independent features added to the existing client-side app.

---

## Feature 1: Live Search

### Goal
Let users search services by name or category without leaving the current view.

### Approach
Client-side filter on `cachedServices` (already in memory in `main.js`). No extra Firestore reads.

### UI
- Search input placed between category pills and services grid (below `#categories-section`, above `#services-section`)
- Placeholder: "Search services…"
- Debounced 200ms on `input` event
- Clears on gender switch or category change
- "No results" state reuses existing `#services-empty` element

### Logic
- Filter `cachedServices` where `title.toLowerCase().includes(query)` OR `category.toLowerCase().includes(query)`
- Empty query restores full list without re-fetching Firestore
- Search input lives in `main.js`; filter function exported from a new `src/search.js` module

### New files
- `src/search.js` — pure filter function + debounce utility

### Touched files
- `main.js` — wire search input to filter + re-render
- `index.html` — add search input element
- `src/styles/index.css` — search input styles

---

## Feature 2: Referral System

### Goal
Existing users share a unique referral code. When a referred user completes their first order, the referrer gets ₹200 off their next booking.

### Referral Code Generation
- On first Google sign-in, if `customers/{uid}.referralCode` is absent, generate `BLOOM-` + 6 random uppercase alphanumeric chars and save to Firestore.
- Code is deterministic per user — generated once and stored, never regenerated. Character set: `[A-Z0-9]`.

### Share Mechanism
- "Refer a Friend" button in profile modal
- Copies `https://<host>/?ref=<CODE>` to clipboard + shows WhatsApp share link
- URL param `?ref=CODE` is read on app load and stored in `sessionStorage` key `pendingRef`

### Referral Attribution
- On sign-in: if `pendingRef` exists in sessionStorage and user has no `referredBy` set, write `customers/{uid}.referredBy = referrerCode` and clear sessionStorage.

### Reward Trigger
- In `cart.js` `checkout()`: after writing order, check if `customerUid` has `referredBy` set and `customers/{uid}.firstOrderRewarded !== true`.
- If so: write a new doc to `coupons` collection — `{ code: 'REF-<referrerUID_short>', type: 'flat', value: 200, active: true, maxUses: 1, usedCount: 0, createdAt }`.
- Set `customers/{uid}.firstOrderRewarded = true` to prevent double reward.
- Also write `customers/{referrerUID}.earnedReferralCoupons` array (append coupon code) so referrer can see it in their profile.

### Firestore fields added to `customers` doc
```
referralCode: string
referredBy: string | null
firstOrderRewarded: boolean
earnedReferralCoupons: string[]
```

### New files
- `src/referral.js` — code generation, URL param reading, reward logic

### Touched files
- `src/auth.js` — generate referral code on first sign-in
- `src/cart.js` — call reward trigger in `checkout()`
- `src/ui.js` — "Refer a Friend" UI in profile modal
- `main.js` — read `?ref=` param on load

---

## Feature 3: Push Notifications

### Goal
Users receive booking confirmation notifications. When app is open: in-app notification bell. When app is closed (or in background): FCM push notification via browser.

### Scope
Client-side only. No Cloud Functions. Sending push to specific tokens must be done via Firebase Console (or wired to Cloud Functions later). The client stores FCM tokens and shows in-app notifications from Firestore.

### Permission Flow
- After booking confirmation toast appears, prompt user to enable notifications (non-blocking — shown as a dismissible banner below header).
- On accept: call `Notification.requestPermission()`, get FCM token via `getToken(messaging, { vapidKey })`, save to `customers/{uid}.fcmToken`.

### In-App Notification Bell
- Bell icon added to header (between login button and cart).
- Badge count = unread notifications count.
- Clicking opens a dropdown panel listing recent notifications.
- Notifications sourced from `customers/{uid}/notifications` sub-collection (each doc: `{ title, body, read: false, createdAt }`).
- New booking confirmation writes a notification doc from `checkout()` in `cart.js`.
- Marking bell open marks all unread docs as `read: true` via a Firestore batch write.

### Firebase Messaging Service Worker
- `firebase-messaging-sw.js` at project root handles background push.
- Uses `onBackgroundMessage` to display notification when app is not focused.
- VAPID key stored as a constant in `src/notifications.js`. Must be generated from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates before implementation.

### Firestore sub-collection: `customers/{uid}/notifications`
```
title: string
body: string
read: boolean
createdAt: Timestamp
```

### New files
- `src/notifications.js` — FCM init, token save, notification listener, bell UI logic
- `firebase-messaging-sw.js` — service worker for background push

### Touched files
- `src/cart.js` — write notification doc on checkout
- `src/firebase.js` — export `messaging` instance
- `src/auth.js` — subscribe to notification listener on sign-in
- `index.html` — add bell icon to header
- `src/styles/index.css` — bell + notification panel styles

---

## Feature 4: Expiring Loyalty Points

### Goal
Users earn points on every booking. Points expire 30 days after earning. Points can be redeemed at checkout for a discount.

### Earn Rate
- 1 point per ₹10 spent (floor). Example: ₹450 order = 45 points.

### Redeem Rate
- 100 points = ₹50 discount (minimum 100 points to redeem).
- Max redemption per order: up to 500 points (₹250 off). Prevents full-order abuse.

### Expiry
- Points expire **30 days** from earn date.
- Expired points are not deleted — they remain with `expired: true` for audit — but are excluded from balance calculation.

### Storage
Sub-collection `customers/{uid}/loyaltyTransactions`:
```
type: 'earn' | 'spend'
points: number           // positive for earn, positive for spend (subtracted in balance calc)
orderId: string
expiresAt: Timestamp | null  // earn: createdAt + 30 days; spend: null (expiry only applies to earn)
createdAt: Timestamp
```

### Balance Calculation (client-side)
1. Fetch all `loyaltyTransactions` for user.
2. Sum `points` where `type === 'earn'` and `expiresAt > now`.
3. Subtract sum of `points` where `type === 'spend'`.
4. Result = available points.

### Checkout Integration
- Below coupon row in cart drawer: show "Use loyalty points — X pts available (≈ ₹Y off)".
- Toggle button to apply/remove points redemption.
- If applied: add loyalty discount line to cart summary.
- On `checkout()`: write `spend` transaction doc, apply discount to order total.

### Expiry Warning
- If user has points expiring within 7 days: show warning badge on cart icon or notification.

### Points Display
- Balance + nearest expiry date shown in profile modal.

### New files
- `src/loyalty.js` — balance calc, earn on checkout, spend on checkout, expiry warning

### Touched files
- `src/cart.js` — integrate loyalty discount into cart state + checkout
- `src/ui.js` — loyalty toggle in cart drawer, balance in profile modal
- `src/styles/index.css` — loyalty UI styles

---

## Summary of New Files
| File | Purpose |
|---|---|
| `src/search.js` | Client-side filter + debounce |
| `src/referral.js` | Referral code gen, URL param, reward |
| `src/notifications.js` | FCM, notification bell |
| `firebase-messaging-sw.js` | Background push service worker |
| `src/loyalty.js` | Points earn/spend/expiry |

## Summary of Firestore Changes
| Collection/Path | New Fields / Docs |
|---|---|
| `customers/{uid}` | `referralCode`, `referredBy`, `firstOrderRewarded`, `earnedReferralCoupons[]`, `fcmToken` |
| `customers/{uid}/notifications` | Sub-collection: `{ title, body, read, createdAt }` |
| `customers/{uid}/loyaltyTransactions` | Sub-collection: `{ type, points, orderId, expiresAt, createdAt }` |
| `coupons` | Auto-generated referral coupon docs |
