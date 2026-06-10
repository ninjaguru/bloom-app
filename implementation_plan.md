# Maison Salon at Home — At-Home Beauty Services Web App

Build a premium at-home salon services web application using the schema and skill definitions from the project folders, connected to Firebase Firestore.

## Key Design Decisions

> [!IMPORTANT]
> **Stack Choice**: Vite + vanilla JS/CSS (no framework). Firebase Web SDK v9+ (modular, tree-shakeable). This keeps things lightweight and fast.

> [!IMPORTANT]
> **Data Seeding**: Since the Firestore `services` collection likely doesn't exist yet, I'll create a seed script to populate it with realistic salon service data matching the schema (Korean waxing, facials, massages, grooming, etc.) for both `women` and `men` categories.

## Open Questions

> [!NOTE]
> 1. **Currency**: The schema says "local currency" — I'll default to **₹ (INR)** based on context. Let me know if you prefer another currency.
> 2. **Authentication**: The skill mentions no auth requirement for browsing. Should I add Firebase Auth for checkout, or keep it anonymous for now?
> 3. **Video Banners**: The skill mentions auto-playing promo video banners. I'll use placeholder video URLs since there's no Cloud Storage content yet. OK?

## Proposed Changes

### Project Setup

#### [NEW] `package.json`
- Vite dev dependencies, Firebase SDK dependency
- Dev server and build scripts

#### [NEW] `vite.config.js`
- Basic Vite configuration

---

### Firebase Integration

#### [NEW] `src/firebase.js`
- Firebase app initialization with the provided config
- Firestore instance export

#### [NEW] `seed.js`
- Node script to populate Firestore `services` collection with ~12-15 realistic services
- Women's services: Korean Waxing bundles, Facials, Manicure/Pedicure, Threading, Hair treatments
- Men's services: Beard grooming, Haircut, Oil Massage, Face cleanup
- Each service includes: title, gender, category, price, originalPrice, durationMinutes, rating, reviewCount, ritualSteps, procedureSteps

---

### Core UI

#### [NEW] `index.html`
- App shell with semantic HTML5 structure
- Meta tags for SEO
- Google Fonts (Inter/Outfit)
- Hero section, gender toggle, services grid, cart drawer, service detail modal

#### [NEW] `src/styles/index.css`
- Premium design system with CSS custom properties
- Dark/warm color palette (deep purples, warm golds, soft pinks — salon aesthetic)
- Glassmorphism cards, smooth gradients
- Micro-animations (hover effects, transitions, cart pulse)
- Responsive grid layout
- Cart drawer slide-in animation
- Modal overlay with backdrop blur

#### [NEW] `src/main.js`
- App entry point, imports and initializes all modules

#### [NEW] `src/services.js`
- Firestore queries: fetch services by gender, by category
- Composite query using `where("gender", "==", selectedGender)`
- Real-time listener with `onSnapshot` for live updates

#### [NEW] `src/cart.js`
- Client-side cart state (in-memory as per schema `cart_persistence: local_memory_only`)
- Add/remove/update quantity
- Bundle tier discount calculator (up to 20% max for custom bundles)
- Cart total with discount display
- On checkout confirmation → write order to Firestore (`firestore_write_trigger: on_checkout_confirmation`)

#### [NEW] `src/ui.js`
- DOM rendering: service cards, gender toggle, category filters
- Service detail modal with ritual steps and procedure steps
- Cart drawer toggle
- Promo video auto-play banners (muted, looping)
- Star rating display
- Price display with strikethrough original price

---

### App Features

| Feature | Description |
|---------|-------------|
| **Gender Toggle** | Women / Men toggle at top, filters all services |
| **Category Filter** | Horizontal scrollable pills (Waxing, Facial, Hair, Massage, etc.) |
| **Service Cards** | Image, title, rating, review count, price/original price, duration, "Add to Cart" |
| **Service Detail Modal** | Expanded view with ritual steps timeline, procedure steps gallery, promo video |
| **Cart Drawer** | Slide-in from right, line items with qty controls, discount tier display, total, checkout button |
| **Bundle Discounts** | 2 items: 5%, 3 items: 10%, 4 items: 15%, 5+ items: 20% |
| **Checkout** | Writes cart to Firestore `orders` collection with timestamp |
| **Responsive** | Mobile-first, works on all screen sizes |

---

## Verification Plan

### Automated Tests
- `npm run dev` — verify dev server starts without errors
- `node seed.js` — verify Firestore seeding works

### Manual Verification
- Toggle between Women/Men and verify service filtering
- Browse service categories
- Open service detail modal
- Add items to cart, verify discount tiers
- Complete checkout and verify Firestore write
- Test responsive layout on mobile viewport
