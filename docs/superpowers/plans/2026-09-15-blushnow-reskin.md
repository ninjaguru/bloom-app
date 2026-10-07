# Blushnow Reskin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin bloom-app to blushnow.in's design language (typography, pill shapes, minimal composition, smooth scroll) while keeping the current dark-rose color palette unchanged.

**Architecture:** The app is token-driven — components read `--color-*` / `--font-*` / `--radius-*` custom properties defined in `src/styles/index.css` `:root` (mirrored in `tokens.css`). The reskin changes font tokens, adds smooth-scroll CSS, and adjusts component shape/composition. No color tokens change; no logic, store, data, or Firestore change.

**Tech Stack:** React 18 + TypeScript, Vite 6, Tailwind v4 (`@tailwindcss/vite`), Firebase. No test framework present — verification is `npm run build` (must succeed) plus a Playwright screenshot of the running dev server.

## Global Constraints

- Colors unchanged: no edits to any `--color-*` token or introduction of new hardcoded colors. Migrate any hardcode found to an existing token.
- `src/styles/index.css` `:root` and `tokens.css` are mirrors — edit both in lockstep.
- No new runtime dependencies (smooth scroll is CSS-only).
- Logic, props, stores, data flow unchanged — visual pass only.
- Verification per task: `npm run build` succeeds AND a Playwright screenshot at `http://localhost:3000` shows the intended change with no console errors.
- Font weights: Instrument Sans on Google Fonts maxes at 700 — use 700 for headings (not 900). Plus Jakarta Sans body 400–800.

---

## File Structure

- `index.html` — font `<link>` tags (swap Geist/Sentient → Instrument Sans + Plus Jakarta Sans; keep Geist Mono).
- `src/styles/index.css` — `--font-*` tokens, `body` font-family, `scroll-behavior`, `scroll-margin` on anchor targets.
- `tokens.css` — mirror the `--font-*` token change.
- `src/components/ui/GradientButton.tsx` — pill radius for primary CTAs.
- `src/components/layout/Hero.tsx` — blushnow big-heading minimal composition, heading weight 700.
- `src/components/cart/CartDrawer.tsx`, `CartItem.tsx`, `CouponRow.tsx` — pill/rounded restyle.
- Final sweep across `src/components/**` for non-token hardcodes.

---

### Task 1: Swap fonts to Instrument Sans + Plus Jakarta Sans

**Files:**
- Modify: `index.html` (font `<link>` block, ~lines 24-27)
- Modify: `src/styles/index.css` (`:root` `--font-*`, and `body` font-family rule)
- Modify: `tokens.css` (`--font-*`)

**Interfaces:**
- Produces: `--font-display: 'Instrument Sans'`, `--font-body: 'Plus Jakarta Sans'`, `--font-mono: 'Geist Mono'` — consumed by every component that sets `fontFamily: var(--font-*)`.

- [ ] **Step 1: Replace the font links in `index.html`**

Replace the two Google/Fontshare `<link href=...>` stylesheet lines with:

```html
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=Plus+Jakarta+Sans:wght@400..800&family=Geist+Mono:wght@400..600&display=swap" rel="stylesheet" />
```

- [ ] **Step 2: Update font tokens in `src/styles/index.css` `:root`**

```css
--font-display: 'Instrument Sans', system-ui, sans-serif;
--font-body:    'Plus Jakarta Sans', system-ui, sans-serif;
--font-mono:    'Geist Mono', ui-monospace, monospace;
```

- [ ] **Step 3: Ensure body uses the body font**

Confirm `src/styles/index.css` has a `body { font-family: var(--font-body); }` rule; if absent, add it inside `@layer base`. This guarantees Plus Jakarta Sans applies app-wide (Tailwind `font-sans` on the root div otherwise wins).

- [ ] **Step 4: Mirror the token change in `tokens.css`** (same three `--font-*` lines).

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: build succeeds, no errors.

- [ ] **Step 6: Visual verify**

Run dev (`npm run dev`), Playwright-navigate to `http://localhost:3000`, screenshot. Expected: headings render in Instrument Sans, body text in Plus Jakarta Sans; no FOUT-broken fallbacks; no console errors.

- [ ] **Step 7: Commit**

```bash
git add index.html src/styles/index.css tokens.css
git commit -m "feat(reskin): swap to Instrument Sans + Plus Jakarta Sans fonts"
```

---

### Task 2: Add CSS-native smooth scroll

**Files:**
- Modify: `src/styles/index.css`

**Interfaces:**
- Produces: global smooth scrolling + a `scroll-mt` offset convention for anchor targets.

- [ ] **Step 1: Add smooth scroll + reduced-motion guard in `@layer base`**

```css
@layer base {
  html { scroll-behavior: smooth; }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
  }
  /* offset anchor targets so a sticky header doesn't overlap them */
  [id] { scroll-margin-top: 5rem; }
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Visual verify**

Dev + Playwright: click an in-page anchor (or evaluate `document.querySelector('#<some-section-id>').scrollIntoView()`); confirm smooth animated scroll and the target is not hidden under the header.

- [ ] **Step 4: Commit**

```bash
git add src/styles/index.css
git commit -m "feat(reskin): css-native smooth scroll with reduced-motion guard"
```

---

### Task 3: Pill-shape primary CTAs in GradientButton

**Files:**
- Modify: `src/components/ui/GradientButton.tsx:21-25`

**Interfaces:**
- Consumes: `--radius-pill` (already defined = `999px`).
- Produces: unchanged `GradientButton` API (`variant`, `size`, `fullWidth`); primary/secondary/outline/danger render as pills.

- [ ] **Step 1: Change size radii to pill**

Replace the `sizeClasses` map so every size uses the pill radius:

```tsx
const sizeClasses = {
  sm: 'px-4 py-1.5 text-xs font-semibold rounded-[var(--radius-pill)]',
  md: 'px-5 py-2.5 text-sm font-semibold rounded-[var(--radius-pill)]',
  lg: 'px-6 py-3 text-base font-semibold rounded-[var(--radius-pill)]',
};
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Visual verify**

Dev + Playwright screenshot of a screen with buttons (e.g. cart drawer / service modal). Expected: buttons are fully pill-rounded, colors unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/GradientButton.tsx
git commit -m "feat(reskin): pill-shaped buttons"
```

---

### Task 4: Blushnow-minimal Hero composition

**Files:**
- Modify: `src/components/layout/Hero.tsx`

**Interfaces:**
- Consumes: `--font-display`, `--color-*` tokens, `GenderToggle`. API (`gender`, `onGenderChange`) unchanged.

- [ ] **Step 1: Increase heading weight and scale to blushnow feel**

In the `<h1>` (`Hero.tsx:34-37`), change `font-medium` → `font-bold` and bump size, so the style block reads:

```tsx
<h1
  className="max-w-md text-[3rem] leading-[1.02] font-bold tracking-tight sm:text-[3.75rem]"
  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
>
```

- [ ] **Step 2: Tighten the eyebrow + subline spacing for the minimal look**

Keep the eyebrow `<p>` (`Hero.tsx:27-32`) and subline; ensure whitespace is generous — set the subline wrapper margin to `mt-6` and max width `max-w-sm`. (No copy change.)

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Visual verify**

Dev + Playwright screenshot at widths 375 and 1280. Expected: large bold Instrument Sans headline, airy spacing, single accent underline preserved, colors unchanged, no layout overflow.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Hero.tsx
git commit -m "feat(reskin): blushnow-minimal hero composition"
```

---

### Task 5: Restyle cart to blushnow shapes

**Files:**
- Modify: `src/components/cart/CartDrawer.tsx`
- Modify: `src/components/cart/CartItem.tsx`
- Modify: `src/components/cart/CouponRow.tsx`

**Interfaces:**
- Consumes: `cartStore` (unchanged), `--radius-card`, `--radius-pill`, `--color-*`. No prop or handler changes.

- [ ] **Step 1: Round cart item containers and controls**

In `CartItem.tsx`, give each item container `rounded-[var(--radius-card)]` and make the qty +/- controls pill (`rounded-[var(--radius-pill)]`). Add the missing accessibility labels while here: `aria-label="Increase quantity"` / `aria-label="Decrease quantity"` on the two icon buttons (flagged in audit).

- [ ] **Step 2: Round the coupon input row**

In `CouponRow.tsx`, set the text input and apply button to pill radius (`rounded-[var(--radius-pill)]`), matching blushnow input-card treatment. No logic change to `validateAndApply`.

- [ ] **Step 3: Round the drawer panel + summary block**

In `CartDrawer.tsx`, apply `rounded-t-[var(--radius-card)]` (or panel corners as appropriate) and ensure the primary checkout CTA uses `GradientButton` (now pill). Colors unchanged.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 5: Visual verify**

Dev + Playwright: open the cart drawer (add an item, click cart), screenshot. Expected: rounded item cards, pill qty controls + coupon input, pill checkout button; add/remove/coupon behavior still works; colors unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/components/cart/CartDrawer.tsx src/components/cart/CartItem.tsx src/components/cart/CouponRow.tsx
git commit -m "feat(reskin): blushnow-shaped cart drawer, items, coupon row"
```

---

### Task 6: Non-token hardcode sweep + full-app visual pass

**Files:**
- Modify: any `src/components/**` file found using a non-token hardcoded theme color (excluding the Google-logo SVG in `LoginModal.tsx`, which is a brand asset and must stay).

**Interfaces:**
- Produces: no functional change; consistency only.

- [ ] **Step 1: Grep for non-token hardcodes**

Run: `grep -rn "#[0-9a-fA-F]\{3,6\}\|bg-\[#\|text-\[#\|border-\[#" src/components src/App.tsx`
For each hit that is a theme color (not the Google `<svg>` logo fills in `LoginModal.tsx`), replace with the closest existing `--color-*` token. Expected: only the 4 Google-logo SVG fills remain.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Full-app visual pass**

Dev + Playwright screenshots at 375, 768, 1280 of: home (Hero + service grid), a service modal, cart drawer. Expected: consistent Instrument Sans / Plus Jakarta typography, pill CTAs, rounded cards, smooth scroll, original colors, zero console errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(reskin): token-migrate stray hardcodes; final visual pass"
```

---

## Self-Review

- **Spec coverage:** Fonts (Task 1) ✓, shapes/pill (Tasks 3, 5) ✓, layout composition (Task 4) ✓, smooth scroll (Task 2) ✓, cart restyle (Task 5) ✓, colors-unchanged constraint (Global + Task 6 sweep) ✓, out-of-scope items (security/onboarding/admin) not touched ✓.
- **Placeholders:** none — each step has concrete file, code, and verify command.
- **Type consistency:** `GradientButton` API unchanged across tasks; token names (`--font-display`, `--font-body`, `--font-mono`, `--radius-pill`, `--radius-card`) consistent throughout.
- **Known deviation from spec:** spec referenced Instrument Sans weight 900; Google Fonts caps it at 700, so headings use 700 (documented in Global Constraints and Task 1/4).
