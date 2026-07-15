/**
 * Firestore Seed Script — Urban Company Salon Luxe services (Bangalore)
 * Source: urbancompany.com/bangalore-salon-luxe
 * Run with: node seed.js
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDdgn9XnjtJp9i7GlWmCUmuze8vHXATb2k",
  authDomain: "maison-salon-at-home.firebaseapp.com",
  projectId: "maison-salon-at-home",
  storageBucket: "maison-salon-at-home.firebasestorage.app",
  messagingSenderId: "18321783031",
  appId: "1:18321783031:web:498e0265f46e5ff1467bf2"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

const _px = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop`;
const _ux = (id) => `https://images.unsplash.com/photo-${id}?w=800&h=500&fit=crop&auto=format`;

const services = [

  // ============================================================
  // WAXING
  // ============================================================
  {
    serviceId: 'w-spatula-full-arms-legs',
    title: 'Spatula Waxing – Full Arms & Legs + Underarms',
    gender: 'women', category: 'Waxing',
    price: 1239, originalPrice: 1399, durationMinutes: 90,
    rating: 4.89, reviewCount: 35000,
    imageUrl: _px('6763618'),
    ritualSteps: [
      { step: 1, title: 'Skin Prep', desc: 'Pre-wax powder applied to remove moisture and ensure clean adhesion.' },
      { step: 2, title: 'Spatula Wax Application', desc: 'Warm spatula wax spread evenly on full arms, legs, and underarms.' },
      { step: 3, title: 'Strip Removal', desc: 'Muslin strips pulled swiftly against hair growth for root-level removal.' },
      { step: 4, title: 'Post-Wax Soothe', desc: 'Cooling lotion applied to calm redness and close pores.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Prep' }, { step: 2, title: 'Apply Wax' },
      { step: 3, title: 'Remove Strips' }, { step: 4, title: 'Soothe' },
    ],
  },
  {
    serviceId: 'w-rollon-full-arms-legs',
    title: 'Roll-on Waxing – Full Arms & Legs + Underarms',
    gender: 'women', category: 'Waxing',
    price: 1899, originalPrice: 2199, durationMinutes: 90,
    rating: 4.91, reviewCount: 30000,
    imageUrl: _px('6763120'),
    ritualSteps: [
      { step: 1, title: 'Consultation', desc: 'Roll-on wax variant selected based on skin type and sensitivity.' },
      { step: 2, title: 'Roll-on Application', desc: 'Heated roll-on cartridge glides over skin ensuring even, thin wax layer.' },
      { step: 3, title: 'Strip Peel', desc: 'Muslin strip pressed and removed swiftly for clean results.' },
      { step: 4, title: 'Post-Wax Care', desc: 'Cirepil intimate peel-off wax for underarms, cooling lotion on all treated areas.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Select Wax' }, { step: 2, title: 'Roll-on Apply' },
      { step: 3, title: 'Strip Peel' }, { step: 4, title: 'Post Care' },
    ],
  },
  {
    serviceId: 'w-full-arms-underarms-wax',
    title: 'Full Arms & Underarms Waxing',
    gender: 'women', category: 'Waxing',
    price: 699, originalPrice: 849, durationMinutes: 40,
    rating: 4.90, reviewCount: 140000,
    imageUrl: _px('5240782'),
    ritualSteps: [
      { step: 1, title: 'Skin Prep', desc: 'Pre-wax powder absorbs moisture for better wax grip.' },
      { step: 2, title: 'Wax Application', desc: 'Warm wax spread on full arms and underarms.' },
      { step: 3, title: 'Strip Removal', desc: 'Precise strip pull removes hair cleanly from roots.' },
      { step: 4, title: 'Cool Down', desc: 'Aloe cooling gel soothes post-wax skin.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Prep' }, { step: 2, title: 'Apply' },
      { step: 3, title: 'Remove' }, { step: 4, title: 'Soothe' },
    ],
  },
  {
    serviceId: 'w-full-legs-wax',
    title: 'Full Legs Waxing',
    gender: 'women', category: 'Waxing',
    price: 639, originalPrice: 799, durationMinutes: 60,
    rating: 4.91, reviewCount: 81000,
    imageUrl: _px('6763618'),
    ritualSteps: [
      { step: 1, title: 'Prep', desc: 'Skin cleansed, powder applied on both legs.' },
      { step: 2, title: 'Wax Applied', desc: 'Warm wax spread section by section from ankle to thigh.' },
      { step: 3, title: 'Strip Pull', desc: 'Quick strip removal ensures hair-free, smooth legs.' },
      { step: 4, title: 'After Care', desc: 'Cooling post-wax lotion applied on full legs.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Prep' }, { step: 2, title: 'Wax' },
      { step: 3, title: 'Remove' }, { step: 4, title: 'After Care' },
    ],
  },
  {
    serviceId: 'w-half-legs-wax',
    title: 'Half Legs Waxing',
    gender: 'women', category: 'Waxing',
    price: 449, originalPrice: 549, durationMinutes: 25,
    rating: 4.90, reviewCount: 44000,
    imageUrl: _px('5240782'),
    ritualSteps: [
      { step: 1, title: 'Prep', desc: 'Skin prepped with pre-wax powder below the knee.' },
      { step: 2, title: 'Apply Wax', desc: 'Warm wax applied from ankle to knee evenly.' },
      { step: 3, title: 'Remove', desc: 'Strips removed swiftly for clean finish.' },
      { step: 4, title: 'Soothe', desc: 'Cooling lotion applied on treated area.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Prep' }, { step: 2, title: 'Apply' },
      { step: 3, title: 'Remove' }, { step: 4, title: 'Soothe' },
    ],
  },
  {
    serviceId: 'w-full-body-wax',
    title: 'Full Body Waxing – Arms, Legs, Underarms, Stomach & Back',
    gender: 'women', category: 'Waxing',
    price: 1899, originalPrice: 2299, durationMinutes: 120,
    rating: 4.89, reviewCount: 14000,
    imageUrl: _px('6763120'),
    ritualSteps: [
      { step: 1, title: 'Consultation', desc: 'Skin type assessed, wax variant selected for each body zone.' },
      { step: 2, title: 'Zone-Wise Application', desc: 'Wax applied systematically — arms, stomach, back, then legs.' },
      { step: 3, title: 'Strip Removal', desc: 'Precise strip technique used per zone for thorough removal.' },
      { step: 4, title: 'Full-Body Soothe', desc: 'Aloe vera post-wax lotion applied across all treated areas.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Consult' }, { step: 2, title: 'Apply' },
      { step: 3, title: 'Remove' }, { step: 4, title: 'Soothe' },
    ],
  },

  // ============================================================
  // KOREAN FACIAL
  // ============================================================
  {
    serviceId: 'w-korean-glass-skin',
    title: 'Korean Glass Skin Facial',
    gender: 'women', category: 'Korean Facial',
    price: 2149, originalPrice: 2149, durationMinutes: 80,
    rating: 4.88, reviewCount: 43000,
    imageUrl: _ux('1570172619644-dfd03ed5d881'),
    ritualSteps: [
      { step: 1, title: 'Double Cleanse', desc: 'Oil cleanser followed by foam wash removes all impurities from the skin.' },
      { step: 2, title: 'Exfoliation', desc: 'Gentle enzyme scrub buffs away dead cells for a smooth base.' },
      { step: 3, title: 'Essence Layering', desc: 'Multiple lightweight essence layers flood skin with intense hydration.' },
      { step: 4, title: 'Glass Skin Mask', desc: 'Sheet mask with hyaluronic acid and niacinamide plumps and brightens.' },
      { step: 5, title: 'Seal & Protect', desc: 'Moisturizer + SPF applied to lock in the dewy glass-skin finish.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Cleanse' }, { step: 2, title: 'Exfoliate' },
      { step: 3, title: 'Essence' }, { step: 4, title: 'Mask' }, { step: 5, title: 'Seal' },
    ],
  },
  {
    serviceId: 'w-kglow-age-rewind',
    title: 'KGlow Age-Rewind Facial',
    gender: 'women', category: 'Korean Facial',
    price: 1899, originalPrice: 1899, durationMinutes: 80,
    rating: 4.86, reviewCount: 19000,
    imageUrl: _ux('1570172619644-dfd03ed5d881'),
    ritualSteps: [
      { step: 1, title: 'Cleanse', desc: 'Deep cleansing to remove makeup, sunscreen and daily pollutants.' },
      { step: 2, title: 'Toning', desc: 'pH-balancing toner preps skin for treatment absorption.' },
      { step: 3, title: 'Lifting Serum', desc: 'Peptide-rich serum applied to stimulate collagen and restore elasticity.' },
      { step: 4, title: 'Lift Mask', desc: 'Firming mask left for 15 minutes to visibly tighten and lift.' },
      { step: 5, title: 'Finish', desc: 'Cream moisturizer applied for all-day hydration.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Cleanse' }, { step: 2, title: 'Tone' },
      { step: 3, title: 'Serum' }, { step: 4, title: 'Mask' }, { step: 5, title: 'Moisturise' },
    ],
  },
  {
    serviceId: 'w-sea-algae-hydra-boost',
    title: 'Korean Sea-Algae Hydra-Boost Facial',
    gender: 'women', category: 'Korean Facial',
    price: 2349, originalPrice: 2349, durationMinutes: 80,
    rating: 4.87, reviewCount: 16000,
    imageUrl: _ux('1540555700478-4be289fbecef'),
    ritualSteps: [
      { step: 1, title: 'Cleanse', desc: 'Mild cleanser removes impurities without stripping natural moisture.' },
      { step: 2, title: 'Sea-Algae Serum', desc: 'Marine-derived algae serum delivers intense hydration deep into dermis.' },
      { step: 3, title: 'Hydra Massage', desc: 'Gentle lymphatic massage boosts circulation and serum absorption.' },
      { step: 4, title: 'Plumping Mask', desc: 'Sea-algae gel mask applied for 15 minutes for a plump, dewy finish.' },
      { step: 5, title: 'Seal', desc: 'Rich moisturizer locks in all the hydration for lasting suppleness.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Cleanse' }, { step: 2, title: 'Serum' },
      { step: 3, title: 'Massage' }, { step: 4, title: 'Mask' }, { step: 5, title: 'Seal' },
    ],
  },

  // ============================================================
  // SIGNATURE FACIALS
  // ============================================================
  {
    serviceId: 'w-signature-brightening',
    title: 'Signature Brightening Facial',
    gender: 'women', category: 'Signature Facials',
    price: 2599, originalPrice: 2999, durationMinutes: 80,
    rating: 4.87, reviewCount: 15000,
    imageUrl: _ux('1570172619644-dfd03ed5d881'),
    ritualSteps: [
      { step: 1, title: 'Cleanse & Prep', desc: 'Double cleanse removes impurities and preps for brightening actives.' },
      { step: 2, title: 'Vitamin C Serum', desc: 'High-potency Vitamin C applied to target dark spots and uneven patches.' },
      { step: 3, title: 'Brightening Massage', desc: 'Upward massage strokes boost microcirculation for radiant complexion.' },
      { step: 4, title: 'Brightening Mask', desc: '15-min treatment mask with kojic acid reduces pigmentation visibly.' },
      { step: 5, title: 'SPF Finish', desc: 'Brightening cream + SPF applied for protection and lasting glow.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Cleanse' }, { step: 2, title: 'Vit C Serum' },
      { step: 3, title: 'Massage' }, { step: 4, title: 'Mask' }, { step: 5, title: 'SPF' },
    ],
  },
  {
    serviceId: 'w-o3-radiance-facial',
    title: 'O3+ Radiance Luxury Facial',
    gender: 'women', category: 'Signature Facials',
    price: 1649, originalPrice: 1649, durationMinutes: 75,
    rating: 4.86, reviewCount: 11000,
    imageUrl: _px('29189893'),
    ritualSteps: [
      { step: 1, title: 'Double Cleanse', desc: 'O3+ milk cleanser + foaming wash removes all surface impurities.' },
      { step: 2, title: 'Oat Scrub', desc: 'Gentle oat scrub buffs away dead skin cells revealing fresh radiance.' },
      { step: 3, title: 'O3+ Massage Cream', desc: '10-minute massage with O3+ cream boosts circulation and natural glow.' },
      { step: 4, title: 'Radiance Mask', desc: 'O3+ Vitamin C mask applied for deep brightening and antioxidant boost.' },
      { step: 5, title: 'Toner + Moisturiser', desc: 'pH-balancing toner + day cream for hydration and sun protection.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Cleanse' }, { step: 2, title: 'Scrub' },
      { step: 3, title: 'Massage' }, { step: 4, title: 'Mask' }, { step: 5, title: 'Tone & Moisturise' },
    ],
  },
  {
    serviceId: 'w-ainhoa-oil-control',
    title: 'Ainhoa Oil-Control Facial',
    gender: 'women', category: 'Signature Facials',
    price: 2149, originalPrice: 2899, durationMinutes: 80,
    rating: 4.86, reviewCount: 2000,
    imageUrl: _ux('1570172619644-dfd03ed5d881'),
    ritualSteps: [
      { step: 1, title: 'Cleanse', desc: 'Charcoal cleanser deep-cleans pores and removes excess sebum.' },
      { step: 2, title: 'AHA Exfoliation', desc: 'Alpha-hydroxy acid scrub resurfaces oily skin zones.' },
      { step: 3, title: 'Ainhoa Serum', desc: 'Oil-control serum with salicylic acid purifies and balances skin.' },
      { step: 4, title: 'Purifying Mask', desc: 'Clay mask tightens pores and absorbs excess oil for clear skin.' },
      { step: 5, title: 'Oil-Free Finish', desc: 'Lightweight, mattifying moisturizer seals the treatment.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Cleanse' }, { step: 2, title: 'Exfoliate' },
      { step: 3, title: 'Serum' }, { step: 4, title: 'Mask' }, { step: 5, title: 'Moisturise' },
    ],
  },

  // ============================================================
  // CLEANUP
  // ============================================================
  {
    serviceId: 'w-hydra-mud-cleanup',
    title: 'Hydra Mud Glow Cleanup',
    gender: 'women', category: 'Cleanup',
    price: 1299, originalPrice: 1299, durationMinutes: 45,
    rating: 4.89, reviewCount: 10000,
    imageUrl: _px('29189893'),
    ritualSteps: [
      { step: 1, title: 'Cleanse', desc: 'Hydrating milk cleanser removes daily impurities gently.' },
      { step: 2, title: 'Scrub', desc: 'Fine grain scrub removes dead skin cells and brightens complexion.' },
      { step: 3, title: 'Mud Mask', desc: 'Mineral-rich mud mask draws out impurities and refines pores.' },
      { step: 4, title: 'Moisturise', desc: 'Lightweight hydrating cream restores natural glow.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Cleanse' }, { step: 2, title: 'Scrub' },
      { step: 3, title: 'Mud Mask' }, { step: 4, title: 'Moisturise' },
    ],
  },
  {
    serviceId: 'w-detox-mud-cleanup',
    title: 'Detox Mud Cleanup',
    gender: 'women', category: 'Cleanup',
    price: 1299, originalPrice: 1299, durationMinutes: 45,
    rating: 4.90, reviewCount: 4000,
    imageUrl: _ux('1540555700478-4be289fbecef'),
    ritualSteps: [
      { step: 1, title: 'Foam Cleanse', desc: 'Oil-control face wash clears excess sebum and surface impurities.' },
      { step: 2, title: 'Walnut Scrub', desc: 'Exfoliating scrub removes dead skin and unclogs pores.' },
      { step: 3, title: 'Detox Mud Mask', desc: 'Activated charcoal + mud mask purifies and tightens pores for oily skin.' },
      { step: 4, title: 'Mattifying Finish', desc: 'Pore-minimising lotion applied for a clear, balanced complexion.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Cleanse' }, { step: 2, title: 'Scrub' },
      { step: 3, title: 'Detox Mask' }, { step: 4, title: 'Finish' },
    ],
  },
  {
    serviceId: 'w-repechage-brightening-cleanup',
    title: 'Repechage Brightening Cleanup',
    gender: 'women', category: 'Cleanup',
    price: 1749, originalPrice: 1749, durationMinutes: 50,
    rating: 4.88, reviewCount: 11000,
    imageUrl: _px('11179579'),
    ritualSteps: [
      { step: 1, title: 'Cleanse', desc: 'Repechage seaweed-based cleanser lifts impurities gently.' },
      { step: 2, title: 'Brightening Serum', desc: 'Concentrated brightening serum targets dark spots and pigmentation.' },
      { step: 3, title: 'Brightening Massage', desc: 'Lymphatic drainage massage promotes even skin tone.' },
      { step: 4, title: 'Brightening Mask', desc: 'Licorice + niacinamide mask reduces dark spots visibly in 15 minutes.' },
      { step: 5, title: 'SPF Seal', desc: 'SPF 30 moisturizer locks in brightening actives.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Cleanse' }, { step: 2, title: 'Serum' },
      { step: 3, title: 'Massage' }, { step: 4, title: 'Mask' }, { step: 5, title: 'SPF' },
    ],
  },
  {
    serviceId: 'w-repechage-hydra-cleanup',
    title: 'Repechage Hydra-Boost Cleanup',
    gender: 'women', category: 'Cleanup',
    price: 2199, originalPrice: 2199, durationMinutes: 50,
    rating: 4.89, reviewCount: 5000,
    imageUrl: _ux('1540555700478-4be289fbecef'),
    ritualSteps: [
      { step: 1, title: 'Cleanse', desc: 'Repechage marine cleanser removes impurities while retaining moisture.' },
      { step: 2, title: 'Hydra Serum', desc: 'Hyaluronic acid serum applied to restore skin suppleness.' },
      { step: 3, title: 'Massage', desc: 'Gentle upward strokes boost serum penetration and circulation.' },
      { step: 4, title: 'Hydra Gel Mask', desc: 'Sea-derived gel mask plumps and soothes all skin types.' },
      { step: 5, title: 'Moisturise', desc: 'Rich moisturizer seals in hydration for long-lasting softness.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Cleanse' }, { step: 2, title: 'Serum' },
      { step: 3, title: 'Massage' }, { step: 4, title: 'Mask' }, { step: 5, title: 'Moisturise' },
    ],
  },

  // ============================================================
  // PEDICURE & MANICURE
  // ============================================================
  {
    serviceId: 'w-crystal-spa-pedicure',
    title: 'Rejuvenating Crystal Spa Pedicure',
    gender: 'women', category: 'Manicure & Pedicure',
    price: 1289, originalPrice: 1499, durationMinutes: 60,
    rating: 4.86, reviewCount: 69000,
    imageUrl: _px('4155019'),
    ritualSteps: [
      { step: 1, title: 'Warm Soak', desc: 'Feet soaked in warm wheatgerm oil and mineral salt solution.' },
      { step: 2, title: 'Nail & Cuticle Care', desc: 'Nails shaped, cuticles trimmed and pushed back for clean finish.' },
      { step: 3, title: 'Paraffin Treatment', desc: 'Beeswax & paraffin treatment applied for long-lasting hydration.' },
      { step: 4, title: 'Foot Massage', desc: '15-min foot + 10-min shoulder & hand massage for full relaxation.' },
      { step: 5, title: 'Nail Paint', desc: 'Base coat + 2 colour coats + top coat applied from 50+ shades.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Soak' }, { step: 2, title: 'Nail Care' },
      { step: 3, title: 'Paraffin' }, { step: 4, title: 'Massage' }, { step: 5, title: 'Polish' },
    ],
  },
  {
    serviceId: 'w-ice-cream-pedicure',
    title: 'Ice Cream Delight Pedicure',
    gender: 'women', category: 'Manicure & Pedicure',
    price: 1699, originalPrice: 1999, durationMinutes: 70,
    rating: 4.86, reviewCount: 19000,
    imageUrl: _ux('1604654894610-df63bc536371'),
    ritualSteps: [
      { step: 1, title: 'Strawberry Soak', desc: 'Creamy strawberry-infused foot soak softens and refreshes tired feet.' },
      { step: 2, title: 'Callus Removal', desc: 'Pumice stone and callus file smooth rough heels and pressure zones.' },
      { step: 3, title: 'Scrub', desc: 'Fruit enzyme scrub exfoliates and brightens the skin.' },
      { step: 4, title: 'Cream Massage', desc: 'Rich strawberry cream massaged in for deep nourishment.' },
      { step: 5, title: 'Polish', desc: 'Nail paint applied with base and top coat from premium shades.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Soak' }, { step: 2, title: 'Callus Remove' },
      { step: 3, title: 'Scrub' }, { step: 4, title: 'Massage' }, { step: 5, title: 'Polish' },
    ],
  },
  {
    serviceId: 'w-cut-file-polish-feet',
    title: 'Cut, File & Polish – Feet',
    gender: 'women', category: 'Manicure & Pedicure',
    price: 449, originalPrice: 449, durationMinutes: 15,
    rating: 4.90, reviewCount: 17000,
    imageUrl: _ux('1604654894610-df63bc536371'),
    ritualSteps: [
      { step: 1, title: 'Soak', desc: 'Quick warm soak softens nails and cuticles.' },
      { step: 2, title: 'Cut & File', desc: 'Nails cut to preferred length and filed to smooth edges.' },
      { step: 3, title: 'Polish', desc: 'Choice of nail paint applied — base + 2 coats + top coat.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Soak' }, { step: 2, title: 'Cut & File' }, { step: 3, title: 'Polish' },
    ],
  },
  {
    serviceId: 'w-ice-cream-manicure',
    title: 'Ice Cream Delight Manicure',
    gender: 'women', category: 'Manicure & Pedicure',
    price: 1399, originalPrice: 1399, durationMinutes: 60,
    rating: 4.86, reviewCount: 6000,
    imageUrl: _ux('1604654894610-df63bc536371'),
    ritualSteps: [
      { step: 1, title: 'Strawberry Soak', desc: 'Hands soaked in warm strawberry-infused solution to soften skin.' },
      { step: 2, title: 'Nail & Cuticle Care', desc: 'Nails shaped, cuticles treated for a clean, professional finish.' },
      { step: 3, title: 'Scrub', desc: 'Gentle hand scrub exfoliates for soft, smooth skin.' },
      { step: 4, title: 'Cream Massage', desc: 'Strawberry cream massage nourishes and relaxes hands.' },
      { step: 5, title: 'Polish', desc: 'Nail paint applied from wide range of premium shades.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Soak' }, { step: 2, title: 'Nail Care' },
      { step: 3, title: 'Scrub' }, { step: 4, title: 'Massage' }, { step: 5, title: 'Polish' },
    ],
  },
  {
    serviceId: 'w-sea-algae-manicure',
    title: 'AVL Sea-Algae Manicure',
    gender: 'women', category: 'Manicure & Pedicure',
    price: 1099, originalPrice: 1099, durationMinutes: 45,
    rating: 4.86, reviewCount: 24000,
    imageUrl: _ux('1604654894610-df63bc536371'),
    ritualSteps: [
      { step: 1, title: 'Soak', desc: 'Marine mineral soak detoxifies and softens hands.' },
      { step: 2, title: 'Sea-Algae Scrub', desc: 'Marine-powered scrub tones and repairs damaged skin.' },
      { step: 3, title: 'Algae Massage', desc: 'Sea-algae cream massaged in for deep nourishment and repair.' },
      { step: 4, title: 'Polish', desc: 'Nail paint applied with base and top coat.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Soak' }, { step: 2, title: 'Scrub' },
      { step: 3, title: 'Massage' }, { step: 4, title: 'Polish' },
    ],
  },
  {
    serviceId: 'w-cut-file-polish-hands',
    title: 'Cut, File & Polish – Hands',
    gender: 'women', category: 'Manicure & Pedicure',
    price: 399, originalPrice: 399, durationMinutes: 15,
    rating: 4.89, reviewCount: 17000,
    imageUrl: _ux('1604654894610-df63bc536371'),
    ritualSteps: [
      { step: 1, title: 'Quick Soak', desc: 'Hands soaked briefly to soften nails and cuticles.' },
      { step: 2, title: 'Cut & File', desc: 'Nails cut to preferred length and filed for smooth edges.' },
      { step: 3, title: 'Polish', desc: 'Nail paint applied — base + 2 coats + top coat from premium shades.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Soak' }, { step: 2, title: 'Cut & File' }, { step: 3, title: 'Polish' },
    ],
  },
  {
    serviceId: 'w-signature-mani-pedi',
    title: 'Signature Mani-Pedi Combo',
    gender: 'women', category: 'Manicure & Pedicure',
    price: 1949, originalPrice: 2299, durationMinutes: 100,
    rating: 4.82, reviewCount: 2000,
    imageUrl: _px('4155019'),
    ritualSteps: [
      { step: 1, title: 'Soak', desc: 'Both hands and feet soaked in warm mineral-enriched water.' },
      { step: 2, title: 'Nail & Cuticle Care', desc: 'Nails shaped and cuticles treated on hands and feet.' },
      { step: 3, title: 'Scrub', desc: 'Exfoliating scrub on hands and feet removes dead skin.' },
      { step: 4, title: 'Massage', desc: 'Deep cleansing massage boosts circulation and soothes tired skin.' },
      { step: 5, title: 'Polish', desc: 'Nail paint applied on both hands and feet.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Soak' }, { step: 2, title: 'Nail Care' },
      { step: 3, title: 'Scrub' }, { step: 4, title: 'Massage' }, { step: 5, title: 'Polish' },
    ],
  },

  // ============================================================
  // THREADING & FACE WAX
  // ============================================================
  {
    serviceId: 'w-eyebrow-threading',
    title: 'Eyebrow Threading',
    gender: 'women', category: 'Threading',
    price: 99, originalPrice: 149, durationMinutes: 10,
    rating: 4.91, reviewCount: 439000,
    imageUrl: _px('6135615'),
    ritualSteps: [
      { step: 1, title: 'Brow Mapping', desc: 'Face shape assessed to determine ideal arch, thickness and tail.' },
      { step: 2, title: 'Precision Threading', desc: 'Twisted thread removes hair at follicle level for sharp, clean lines.' },
      { step: 3, title: 'Soothe', desc: 'Chilled rose water applied to close pores and calm redness.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Brow Map' }, { step: 2, title: 'Thread' }, { step: 3, title: 'Soothe' },
    ],
  },
  {
    serviceId: 'w-full-face-threading',
    title: 'Full Face Threading – Eyebrows, Upper Lip & Chin',
    gender: 'women', category: 'Threading',
    price: 249, originalPrice: 349, durationMinutes: 20,
    rating: 4.91, reviewCount: 80000,
    imageUrl: _px('8558244'),
    ritualSteps: [
      { step: 1, title: 'Consultation', desc: 'Desired brow shape and facial hair concerns discussed.' },
      { step: 2, title: 'Brow Threading', desc: 'Arch created with expert thread technique tailored to face shape.' },
      { step: 3, title: 'Face Threading', desc: 'Upper lip, chin threaded with swift, precise strokes.' },
      { step: 4, title: 'Cool Down', desc: 'Ice cube / rose water applied to reduce redness.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Consult' }, { step: 2, title: 'Brows' },
      { step: 3, title: 'Face Thread' }, { step: 4, title: 'Cool Down' },
    ],
  },
  {
    serviceId: 'w-cirepil-face-wax',
    title: 'Cirepil PR Visage Face Wax',
    gender: 'women', category: 'Threading',
    price: 199, originalPrice: 299, durationMinutes: 10,
    rating: 4.89, reviewCount: 104000,
    imageUrl: _px('6135615'),
    ritualSteps: [
      { step: 1, title: 'Skin Prep', desc: 'Face cleansed and dried before wax application.' },
      { step: 2, title: 'Cirepil Wax Applied', desc: 'Premium Cirepil PR Visage wax applied to targeted area.' },
      { step: 3, title: 'Peel Off', desc: 'Wax removed cleanly for hair-free, smooth skin.' },
      { step: 4, title: 'Soothe', desc: 'Cooling gel applied to calm skin post-wax.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Prep' }, { step: 2, title: 'Apply Wax' },
      { step: 3, title: 'Peel Off' }, { step: 4, title: 'Soothe' },
    ],
  },

  // ============================================================
  // BLEACH, DETAN & MASSAGE
  // ============================================================
  {
    serviceId: 'w-bleach',
    title: 'Bleach – Face & Neck',
    gender: 'women', category: 'Bleach & Detan',
    price: 649, originalPrice: 799, durationMinutes: 30,
    rating: 4.89, reviewCount: 21000,
    imageUrl: _px('29189920'),
    ritualSteps: [
      { step: 1, title: 'Cleanse', desc: 'Face cleansed to remove makeup and oil before bleach application.' },
      { step: 2, title: 'Bleach Mix', desc: 'Bleach cream and activator mixed to the right consistency.' },
      { step: 3, title: 'Application', desc: 'Bleach applied evenly on face, neck and arms for 15–20 minutes.' },
      { step: 4, title: 'Remove & Tone', desc: 'Bleach removed with damp cloth, toner applied to close pores.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Cleanse' }, { step: 2, title: 'Mix' },
      { step: 3, title: 'Apply' }, { step: 4, title: 'Remove' },
    ],
  },
  {
    serviceId: 'w-detan',
    title: 'Detan – Face & Neck',
    gender: 'women', category: 'Bleach & Detan',
    price: 649, originalPrice: 799, durationMinutes: 30,
    rating: 4.89, reviewCount: 28000,
    imageUrl: _px('11179579'),
    ritualSteps: [
      { step: 1, title: 'Cleanse', desc: 'Face washed to remove sunscreen and surface oil.' },
      { step: 2, title: 'Detan Pack Mix', desc: 'Detan pack with kojic acid and vitamin C prepared.' },
      { step: 3, title: 'Application', desc: 'Pack applied on tanned areas for 15–20 minutes.' },
      { step: 4, title: 'Remove & Moisturise', desc: 'Pack removed, SPF moisturizer applied to protect treated skin.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Cleanse' }, { step: 2, title: 'Prepare Pack' },
      { step: 3, title: 'Apply' }, { step: 4, title: 'Remove' },
    ],
  },
  {
    serviceId: 'w-head-massage',
    title: 'Head Massage',
    gender: 'women', category: 'Bleach & Detan',
    price: 349, originalPrice: 449, durationMinutes: 15,
    rating: 4.92, reviewCount: 49000,
    imageUrl: _ux('1519690889869-e705e59f72e1'),
    ritualSteps: [
      { step: 1, title: 'Oil Selection', desc: 'Warm coconut or bhringraj oil selected based on hair type.' },
      { step: 2, title: 'Scalp Application', desc: 'Oil poured along centre parting and spread to roots.' },
      { step: 3, title: 'Champi Massage', desc: 'Traditional champi technique with circular pressure on scalp points.' },
      { step: 4, title: 'Neck Relaxation', desc: 'Light neck strokes to complete the relaxing session.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Select Oil' }, { step: 2, title: 'Apply Oil' },
      { step: 3, title: 'Head Massage' }, { step: 4, title: 'Neck Strokes' },
    ],
  },

  // ============================================================
  // MEN'S SERVICES
  // ============================================================
  {
    serviceId: 'm-classic-haircut',
    title: 'Classic Haircut (Regular / Fade)',
    gender: 'men', category: 'Haircut',
    price: 399, originalPrice: 499, durationMinutes: 30,
    rating: 4.6, reviewCount: 9840,
    imageUrl: _ux('1599351431202-1e0f0137899a'),
    ritualSteps: [
      { step: 1, title: 'Consultation', desc: 'Face shape analysis, cut style discussed — regular, fade, undercut or taper.' },
      { step: 2, title: 'Shampoo & Condition', desc: 'Charcoal shampoo + conditioning mask on clean, workable hair.' },
      { step: 3, title: 'Precision Cut', desc: 'Scissors-over-comb and clipper technique delivers your chosen style.' },
      { step: 4, title: 'Style & Finish', desc: 'Matte clay or pomade applied, razor used for crisp lines.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Consult' }, { step: 2, title: 'Wash' },
      { step: 3, title: 'Cut' }, { step: 4, title: 'Style' },
    ],
  },
  {
    serviceId: 'm-haircut-beard-massage',
    title: 'Haircut + Beard Trim + Head Massage',
    gender: 'men', category: 'Haircut',
    price: 649, originalPrice: 799, durationMinutes: 50,
    rating: 4.8, reviewCount: 6720,
    imageUrl: _px('27497972'),
    ritualSteps: [
      { step: 1, title: 'Scalp Wash', desc: 'Deep-cleansing shampoo followed by conditioner.' },
      { step: 2, title: 'Haircut', desc: 'Precision cut to desired style — taper, fade or scissor finish.' },
      { step: 3, title: 'Beard Trim', desc: 'Clippers + scissors shape beard, straight-razor edge cleanup.' },
      { step: 4, title: 'Head Massage', desc: '10-minute warm coconut oil scalp massage on pressure points.' },
      { step: 5, title: 'Blow Dry', desc: 'Hair blow dried and styled to complete the look.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Wash' }, { step: 2, title: 'Haircut' },
      { step: 3, title: 'Beard Trim' }, { step: 4, title: 'Massage' }, { step: 5, title: 'Style' },
    ],
  },
  {
    serviceId: 'm-beard-trim',
    title: 'Beard Trim + Shaping',
    gender: 'men', category: 'Beard & Grooming',
    price: 249, originalPrice: 349, durationMinutes: 20,
    rating: 4.5, reviewCount: 11230,
    imageUrl: _ux('1503951914875-452162b0f3f1'),
    ritualSteps: [
      { step: 1, title: 'Beard Wash', desc: 'Beard shampoo removes oil and product buildup.' },
      { step: 2, title: 'Comb & Detangle', desc: 'Wide-tooth comb prepares beard for precise trimming.' },
      { step: 3, title: 'Trim & Shape', desc: 'Clippers set length, scissors refine shape and neckline.' },
      { step: 4, title: 'Beard Oil Finish', desc: 'Argan and jojoba beard oil softens and conditions.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Wash' }, { step: 2, title: 'Comb' },
      { step: 3, title: 'Trim' }, { step: 4, title: 'Oil Finish' },
    ],
  },
  {
    serviceId: 'm-hot-towel-shave',
    title: 'Hot Towel Shave + Beard Contour',
    gender: 'men', category: 'Beard & Grooming',
    price: 449, originalPrice: 599, durationMinutes: 30,
    rating: 4.7, reviewCount: 5430,
    imageUrl: _px('16553361'),
    ritualSteps: [
      { step: 1, title: 'Hot Towel Prep', desc: 'Steaming hot towel opens pores and softens coarse stubble for 5 minutes.' },
      { step: 2, title: 'Pre-Shave Oil', desc: 'Pre-shave oil creates a protective layer for razor to glide smoothly.' },
      { step: 3, title: 'Lather', desc: 'Rich shaving cream worked into thick lather with a badger brush.' },
      { step: 4, title: 'Straight Razor Shave', desc: 'Precise straight razor for baby-smooth skin with zero nicks.' },
      { step: 5, title: 'Aftershave Balm', desc: 'Alcohol-free balm closes pores and prevents razor bumps.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Hot Towel' }, { step: 2, title: 'Pre-Shave Oil' },
      { step: 3, title: 'Lather' }, { step: 4, title: 'Razor Shave' }, { step: 5, title: 'Aftershave' },
    ],
  },
  {
    serviceId: 'm-swedish-massage',
    title: 'Swedish Full Body Massage (60 min)',
    gender: 'men', category: 'Massage',
    price: 1299, originalPrice: 1699, durationMinutes: 60,
    rating: 4.8, reviewCount: 4560,
    imageUrl: _px('6560304'),
    ritualSteps: [
      { step: 1, title: 'Oil Consultation', desc: 'Choose deep-muscle sesame, relaxing lavender or energizing eucalyptus.' },
      { step: 2, title: 'Back & Shoulders', desc: 'Therapist focuses on upper back and shoulders — primary stress zones for desk workers.' },
      { step: 3, title: 'Full Body Flow', desc: 'Swedish effleurage covers arms, legs, torso to stimulate circulation.' },
      { step: 4, title: 'Pressure Point Work', desc: 'Trigger point therapy on neck, lower back and calves releases tension.' },
      { step: 5, title: 'Cool-Down', desc: 'Light feathering strokes; cooling peppermint oil on scalp and temples.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Oil Select' }, { step: 2, title: 'Back & Neck' },
      { step: 3, title: 'Full Body' }, { step: 4, title: 'Pressure Points' }, { step: 5, title: 'Cool Down' },
    ],
  },
  {
    serviceId: 'm-head-neck-shoulder',
    title: 'Head, Neck & Shoulders Massage (30 min)',
    gender: 'men', category: 'Massage',
    price: 499, originalPrice: 699, durationMinutes: 30,
    rating: 4.7, reviewCount: 7890,
    imageUrl: _px('6560291'),
    ritualSteps: [
      { step: 1, title: 'Warm Oil', desc: 'Bhringraj or coconut oil warmed and poured along centre parting.' },
      { step: 2, title: 'Champi', desc: 'Traditional champi with firm circular motions across scalp pressure points.' },
      { step: 3, title: 'Neck Release', desc: 'Deep kneading of trapezius and neck muscles relieves tech neck.' },
      { step: 4, title: 'Shoulder Decompression', desc: 'Cross-fibre friction on deltoids and rhomboids loosens adhesions.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Warm Oil' }, { step: 2, title: 'Head Massage' },
      { step: 3, title: 'Neck Release' }, { step: 4, title: 'Shoulders' },
    ],
  },
  {
    serviceId: 'm-charcoal-cleanup',
    title: 'O3+ Charcoal Cleanup for Men',
    gender: 'men', category: 'Cleanup',
    price: 799, originalPrice: 999, durationMinutes: 45,
    rating: 4.7, reviewCount: 6120,
    imageUrl: _px('29189893'),
    ritualSteps: [
      { step: 1, title: 'Charcoal Wash', desc: 'Activated charcoal face wash deep-cleans pores and removes sebum.' },
      { step: 2, title: 'Walnut Scrub', desc: 'Exfoliates dead skin, reduces tan and unclogs pores blocked by shaving.' },
      { step: 3, title: 'Steam + Extraction', desc: 'Herbal steam loosens blackheads, professional extraction with sterilised tools.' },
      { step: 4, title: 'Charcoal Peel Mask', desc: 'Black peel-off mask applied 15 minutes to pull out impurities and tighten pores.' },
      { step: 5, title: 'Ice Globe Finish', desc: 'Ice globes rolled to tighten pores, SPF moisturizer sealed in.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Charcoal Wash' }, { step: 2, title: 'Scrub' },
      { step: 3, title: 'Steam & Extract' }, { step: 4, title: 'Peel Mask' }, { step: 5, title: 'Ice Finish' },
    ],
  },
  {
    serviceId: 'm-mani-pedi',
    title: "Men's Manicure + Pedicure",
    gender: 'men', category: 'Manicure & Pedicure',
    price: 899, originalPrice: 1199, durationMinutes: 70,
    rating: 4.6, reviewCount: 3210,
    imageUrl: _px('17056222'),
    ritualSteps: [
      { step: 1, title: 'Warm Soak', desc: 'Hands and feet soaked in warm antiseptic salt water.' },
      { step: 2, title: 'Nail Care', desc: 'Nails cleaned, cuticles trimmed, filed and buffed to matte finish.' },
      { step: 3, title: 'Pumice Scrub', desc: 'Pumice stone removes calluses from heels and pressure zones.' },
      { step: 4, title: 'Deep Massage', desc: 'Shea butter massage on hands and feet for nourishment and relaxation.' },
    ],
    procedureSteps: [
      { step: 1, title: 'Soak' }, { step: 2, title: 'Nail Care' },
      { step: 3, title: 'Scrub' }, { step: 4, title: 'Massage' },
    ],
  },
];

async function seed() {
  console.log(`\n🌿 Seeding ${services.length} Bloom Salon services from Urban Company Salon Luxe...\n`);

  for (const service of services) {
    const docRef = doc(db, 'services', service.serviceId);
    await setDoc(docRef, service);
    console.log(`  ✓ ${service.gender.toUpperCase().padEnd(6)} | ${service.category.padEnd(22)} | ${service.title}`);
  }

  console.log(`\n✅ Successfully seeded ${services.length} services!\n`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌ Seeding failed:', err.message || err);
  process.exit(1);
});
