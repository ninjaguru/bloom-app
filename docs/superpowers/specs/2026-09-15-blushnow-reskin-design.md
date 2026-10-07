# Blushnow-style Reskin — Design Spec

**Date:** 2026-09-15
**Scope:** Reskin bloom-app's UI to adopt blushnow.in's design language (typography, shapes, layout, motion) **while keeping the current color palette**. No business-logic, data, or Firestore changes.

## Goal

Make bloom-app look and feel like blushnow.in — clean, minimal, big-bold-heading, whitespace-forward, pill-shaped, smooth-scrolling — but on the app's **existing dark-rose color tokens**, not blushnow's light theme.

## Reference: blushnow.in design language (captured 2026-09-15)

Auth-gated app; login/onboarding screens captured via Playwright.

- **Type:** headings **Instrument Sans**, weight 900, tight tracking, large (≈36px h1). Body **Plus Jakarta Sans**. OTP/numeric monospace.
- **Shapes:** full pill buttons (`border-radius: 9999px`); rounded input cards with accent border; soft rounded panels.
- **Composition:** one big bold heading + short subline + a single primary pill CTA per screen; generous vertical whitespace; minimal chrome.
- **Motion:** smooth, unhurried.
- (Blushnow's own palette — hot pink `#F70F79`, white surfaces, `#303030` ink — is captured for reference but **intentionally NOT adopted**; we keep bloom's colors.)

## In scope

1. **Fonts** — swap to Instrument Sans (display) + Plus Jakarta Sans (body).
   - Update the font `<link>`s in `index.html` (Google Fonts), remove Sentient/Geist links.
   - Update `--font-display` and `--font-body` in `src/styles/index.css` `:root` (and the `tokens.css` mirror). Keep a mono for prices/OTP.
2. **Shapes** — apply pill buttons and rounded-card treatments per blushnow.
   - `GradientButton` → solid/pill primary using existing accent token.
   - Card radii align to `--radius-card`; primary CTAs use `--radius-pill`.
3. **Layout / composition** — apply blushnow's minimal, big-heading, single-CTA, whitespace-forward structure to `Hero` and key screens. No new pages.
4. **Smooth scroll** — CSS-native: `html { scroll-behavior: smooth }` plus `scroll-margin` on anchor targets. Zero dependencies. (Lenis explicitly rejected for this pass.)
5. **Cart restyle** — `CartDrawer`, `CartItem`, `CouponRow` restyled to blushnow shapes on current colors. No `cartStore`/checkout logic change.

## Explicitly OUT of scope

- **Colors** — palette stays exactly as-is (dark-rose OKLCH tokens, hue 350). No surface/accent edits.
- **Security/audit fixes** — Firestore rules, client-trusted money at checkout, non-atomic loyalty/coupon/subscription/referral races, unbounded reads. These are a **separate track** and are neither touched nor fixed here.
- **Onboarding rebuild** — no OTP-first funnel; existing `LoginModal` flow stays.
- **`admin.html` / `staff.html`** — untouched.
- Any change to Firestore data model, Cloud Functions, or `firestore.rules`.

## Constraints / non-negotiables

- Token-driven: components must keep reading `--color-*` / `--font-*` / `--radius-*`; no new hardcoded colors introduced. Where components hardcode dark colors or Tailwind arbitrary `bg-[...]` values, migrate them to tokens rather than swapping one hardcode for another.
- `index.css` `:root` and `tokens.css` must stay in lockstep (they are mirrors).
- No new runtime dependencies.
- Logic, props, stores, and data flow unchanged — this is a visual pass only.

## Success criteria

- App renders with Instrument Sans headings + Plus Jakarta body throughout.
- Primary CTAs are pill-shaped; cards and cart use blushnow rounding.
- Hero + key screens read as blushnow-minimal (big heading, single CTA, whitespace).
- Anchor navigation scrolls smoothly with correct offset (no header overlap).
- Cart drawer restyled; add/remove/coupon/checkout behavior identical to before.
- Colors visually unchanged from current build.
- No console errors; no logic regressions.

## Risks

- Some components may hardcode dark-mode colors or arbitrary Tailwind values — these need discovery during implementation (grep pass) and token migration, which can surface contrast issues.
- Font-weight 900 Instrument Sans must be loaded or headings fall back — verify the `<link>` includes the heavy weight.
- `index.css` has some malformed/duplicated brace structure near `:root` (observed) — reskin work should not deepen that; clean the touched region if trivial.
