# Design: React Migration — Customer-Facing App

**Date:** 2026-07-22
**Project:** Bloom Salon — migrate customer app from vanilla JS to React 18 + TypeScript + KokonutUI
**Scope:** Customer app only (`index.html` side). Admin panel (`admin.js`) stays vanilla JS.

---

## Decision Log

- **Framework:** React 18 + Vite (keep Vite, add React plugin)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite`)
- **UI library:** KokonutUI (shadcn-based) + shadcn/ui base
- **State:** Zustand (replaces manual pub/sub in cart.js)
- **Routing:** None — single-page app, modals handle navigation
- **Migration strategy:** Full rewrite on main branch; admin stays vanilla

---

## Stack

### New dependencies
```
react@18
react-dom@18
@types/react
@types/react-dom
typescript
tailwindcss@4
@tailwindcss/vite
zustand
```

### KokonutUI components (installed via shadcn CLI)
```
@kokonutui/profile-dropdown     # Header profile menu
@kokonutui/action-search-bar    # Search input
@kokonutui/smooth-drawer        # Cart drawer + booking modals
@kokonutui/spotlight-cards      # Service cards grid
@kokonutui/gradient-button      # CTA buttons (Add to Cart, Confirm Booking)
@kokonutui/liquid-glass-card    # Loyalty + referral cards in profile
```

### Kept unchanged
- `firebase@11` (Firestore + Auth + Messaging)
- Vite@6
- All existing `lib/` logic (converted to TypeScript, logic untouched)

---

## Project Structure

```
src/
  components/
    layout/
      Header.tsx          # Logo, nav, NotificationBell, cart toggle
      Footer.tsx
    services/
      ServiceCard.tsx     # Wraps KokonutUI SpotlightCards
      ServiceGrid.tsx     # Grid + loading/empty states
      CategoryPills.tsx   # Custom — no KokonutUI match
      ServiceModal.tsx    # Ritual carousel, related services, add to cart
    cart/
      CartDrawer.tsx      # Wraps KokonutUI SmoothDrawer
      CartItem.tsx
      CouponRow.tsx
      LoyaltyToggleRow.tsx
    booking/
      BookingModal.tsx    # Wraps KokonutUI SmoothDrawer (bottom sheet)
      DatePicker.tsx
      SlotPicker.tsx
    auth/
      LoginModal.tsx
      ProfileModal.tsx    # Referral + loyalty sections inside
    notifications/
      NotificationBell.tsx
      NotificationPanel.tsx
      NotificationBanner.tsx
    search/
      SearchBar.tsx       # Wraps KokonutUI ActionSearchBar
    gender/
      GenderToggle.tsx
    ui/                   # shadcn + KokonutUI auto-generated — do not edit
  stores/
    cartStore.ts
    authStore.ts
    loyaltyStore.ts
    notificationsStore.ts
  hooks/
    useAuth.ts            # onAuthStateChanged → populates authStore, triggers side-effects
    useServices.ts        # onSnapshot → returns Service[]
    useCategories.ts      # one-time fetch → returns string[]
    useLoyaltyBalance.ts  # fetches transactions → populates loyaltyStore
  lib/                    # existing modules, TypeScript-converted, logic unchanged
    firebase.ts
    auth.ts
    booking.ts
    cart.ts               # pure checkout() logic only — state moved to cartStore
    loyalty.ts
    notifications.ts
    referral.ts
    search.ts
    services.ts
  types/
    index.ts              # Service, CartItem, Coupon, CustomerProfile, etc.
  App.tsx                 # Root — mounts hooks, renders layout
  main.tsx                # ReactDOM.createRoot
index.html                # Stripped — just <div id="root">, React takes over
```

---

## Zustand Stores

### cartStore.ts
```typescript
interface CartItem {
  service: Service
  quantity: number
}

interface CartStore {
  items: Record<string, CartItem>
  coupon: Coupon | null
  loyaltyPointsToRedeem: number
  addToCart(service: Service): void
  removeFromCart(id: string): void
  updateQuantity(id: string, delta: number): void
  applyCoupon(coupon: Coupon): void
  clearCoupon(): void
  applyLoyaltyPoints(points: number): void
  clearLoyaltyPoints(): void
  clearCart(): void
  checkout(details: BookingDetails): Promise<string>
}

// Selector — replaces getCartState()
export const selectCartTotals = (state: CartStore): CartTotals
```

`selectCartTotals` computes: `subtotal`, `discountAmount`, `loyaltyDiscount`, `total` (floored at 0), `totalItems`, `couponCode`, `couponType`, `loyaltyPointsToRedeem`. Pure function, no side effects.

### authStore.ts
```typescript
interface AuthStore {
  user: FirebaseUser | null
  profile: CustomerProfile | null
  setUser(user: FirebaseUser | null): void
  setProfile(profile: CustomerProfile | null): void
}
```

### notificationsStore.ts
```typescript
interface NotificationsStore {
  notifications: AppNotification[]
  unreadCount: number
  panelOpen: boolean
  setNotifications(items: AppNotification[]): void
  setPanelOpen(open: boolean): void
  markAllRead(): Promise<void>
}
```

`markAllRead` batch-writes `read: true` to Firestore (same logic as current notifications.js).

### loyaltyStore.ts
```typescript
interface LoyaltyStore {
  available: number
  nextExpiry: Date | null
  loading: boolean
  setBalance(available: number, nextExpiry: Date | null): void
  setLoading(loading: boolean): void
}
```

---

## Firebase Hooks

### useAuth.ts
Runs once at `App.tsx` root. Wraps `onAuthStateChanged`.

On sign-in:
1. `authStore.setUser(user)`
2. `loadProfile(uid)` → `authStore.setProfile(profile)`
3. `ensureReferralCode(uid)` (lib/referral.ts)
4. `attributeReferral(uid)`
5. Subscribes `customers/{uid}/notifications` onSnapshot → `notificationsStore.setNotifications`
6. `getLoyaltyBalance(uid)` → `loyaltyStore.setBalance`

On sign-out:
1. `authStore.setUser(null)`
2. `authStore.setProfile(null)`
3. Unsubscribes notification listener
4. `cartStore.clearLoyaltyPoints()`
5. `notificationsStore.setNotifications([])`

### useServices.ts
```typescript
function useServices(gender: string, category: string): Service[]
```
Wraps `subscribeToServices` + `getBundles` (prepended when category === 'All'). Returns merged array. Re-subscribes on gender/category change.

### useCategories.ts
```typescript
function useCategories(gender: string): string[]
```
One-time `getCategories(gender)` fetch. Re-fetches on gender change.

### useLoyaltyBalance (internal to useAuth)
Not a standalone exported hook. `getLoyaltyBalance(uid)` is called directly inside `useAuth`'s sign-in effect, result passed to `loyaltyStore.setBalance`.

---

## KokonutUI Component Mapping

| Screen element | KokonutUI component | Custom wrapper |
|---|---|---|
| Header profile menu | `ProfileDropdown` | `Header.tsx` |
| Search input | `ActionSearchBar` | `SearchBar.tsx` |
| Cart slide-in | `SmoothDrawer` | `CartDrawer.tsx` |
| Booking modal | `SmoothDrawer` (bottom sheet) | `BookingModal.tsx` |
| Service cards | `SpotlightCards` | `ServiceCard.tsx` |
| Add to Cart / Confirm | `GradientButton` | inline |
| Loyalty card in profile | `LiquidGlassCard` | inside `ProfileModal.tsx` |
| Referral card in profile | `LiquidGlassCard` | inside `ProfileModal.tsx` |
| Category pills | custom Tailwind | `CategoryPills.tsx` |
| Notification bell + panel | custom (keep glassmorphism) | `NotificationBell.tsx` |
| Gender toggle | custom Tailwind | `GenderToggle.tsx` |
| Login modal | custom | `LoginModal.tsx` |
| Service detail modal | custom (ritual carousel) | `ServiceModal.tsx` |

---

## Types

All shared types in `src/types/index.ts`:

```typescript
interface Service {
  id: string
  serviceId?: string
  title: string
  category: string
  gender: 'women' | 'men' | 'both'
  price: number
  originalPrice?: number
  durationMinutes: number
  rating: number
  reviewCount: number
  imageUrl?: string
  ritualSteps?: RitualStep[]
  isBundle?: boolean
}

interface CartItem {
  service: Service
  quantity: number
}

interface Coupon {
  id: string
  code: string
  type: 'percent' | 'flat'
  value: number
  active: boolean
  maxUses?: number
  usedCount: number
  expiresAt?: Timestamp
  minOrderValue?: number
}

interface CartTotals {
  items: Array<CartItem & { id: string; lineTotal: number }>
  totalItems: number
  subtotal: number
  discountPercent: number
  discountAmount: number
  loyaltyDiscount: number
  loyaltyPointsToRedeem: number
  total: number
  couponCode: string | null
  couponType: 'percent' | 'flat' | null
}

interface CustomerProfile {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  apartment?: string
  flat?: string
  referralCode?: string
  referredBy?: string
  firstOrderRewarded?: boolean
  earnedReferralCoupons?: string[]
  fcmToken?: string
}

interface BookingDetails {
  customer: { name: string; phone: string; address: string; apartment: string; flat: string }
  appointment: { date: string; timeSlot: string }
}

interface AppNotification {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: Timestamp
}
```

---

## App.tsx Sketch

```tsx
export default function App() {
  const [gender, setGender] = useState<'women' | 'men'>('women')
  const [category, setCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  useAuth()                              // populates authStore, notifications, loyalty
  const allServices = useServices(gender, category)
  const categories = useCategories(gender)
  const services = filterServices(allServices, searchQuery)

  return (
    <>
      <Header />
      <NotificationBanner />
      <Hero onGenderChange={(g) => { setGender(g); setCategory('All'); setSearchQuery('') }} />
      <CategoryPills
        categories={categories}
        active={category}
        onSelect={(c) => { setCategory(c); setSearchQuery('') }}
      />
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <ServiceGrid services={services} />
      <CartDrawer />
      <BookingModal />
      <LoginModal />
      <ProfileModal />
      <Footer />
    </>
  )
}
```

---

## Migration Notes

- `index.html` stripped to bare `<div id="root">` — all HTML markup moves to JSX
- `admin.html` + `src/admin.js` untouched — Vite still builds them as a separate entry
- Existing `lib/` files keep their logic exactly, just gain TypeScript types
- `src/styles/index.css` replaced by Tailwind's `@import "tailwindcss"` + CSS variable block (kept for brand colors)
- No React Router — modals driven by local `useState` in the component that owns the trigger (e.g. cart open state in `Header`, booking open state passed from `CartDrawer`). Zustand is NOT used for ephemeral modal open/close state.
- `notificationsStore.markAllRead(uid: string)` takes uid param — store does not hold uid
- `firebase-messaging-sw.js` in `public/` unchanged
