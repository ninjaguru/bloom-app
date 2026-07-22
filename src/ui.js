import {
  addToCart,
  removeFromCart,
  updateQuantity,
  isInCart,
  onCartChange,
  getCartState,
  validateAndApplyCoupon,
  clearCoupon,
  applyLoyaltyPoints,
  clearLoyaltyPoints,
  getLoyaltyPointsApplied,
} from './cart.js';
import {
  getLoyaltyBalance, canRedeem, pointsToRupees,
  clampRedeemPoints, getExpiryWarningText,
} from './loyalty.js';
import { openBookingModal } from './booking.js';
import { signInWithGoogle, logout, onAuthChange, getCurrentUser, saveProfile, loadProfile, onSignIn } from './auth.js';
import { ensureReferralCode, getReferralShareUrl } from './referral.js';
import { initNotificationBell, showNotificationBanner } from './notifications.js';
import { db } from './firebase.js';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

/* ---------- Service Card Images ---------- */
const _px = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop`;
const _ux = (id) => `https://images.unsplash.com/photo-${id}?w=800&h=500&fit=crop&auto=format`;

const SERVICE_IMAGES = {
  'Waxing':             _px('6763618'),
  'Facial':             _ux('1570172619644-dfd03ed5d881'),
  'Hair':               _px('10028673'),
  'Massage':            _ux('1544161515-4ab6ce6db874'),
  'Manicure & Pedicure':_ux('1604654894610-df63bc536371'),
  'Nails':              _ux('1604654894610-df63bc536371'),
  'Threading':          _px('6135615'),
  'Cleanup':            _px('29189893'),
  'Beard & Grooming':   _ux('1503951914875-452162b0f3f1'),
  'Haircut':            _ux('1599351431202-1e0f0137899a'),
  'Spa':                _ux('1540555700478-4be289fbecef'),
  'Body Polish':        _ux('1544161515-4ab6ce6db874'),
  'default':            _px('6763618'),
};

function getServiceImage(service) {
  if (service && service.imageUrl) return service.imageUrl;
  const category = typeof service === 'string' ? service : (service && service.category);
  return SERVICE_IMAGES[category] || SERVICE_IMAGES['default'];
}

/* ---------- Ritual Step Images (verified Unsplash IDs) ---------- */
const _IMG  = (id) => `https://images.unsplash.com/photo-${id}?w=800&h=500&fit=crop&auto=format`;
const _IMGPX = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop`;
const RITUAL_STEP_IMAGES = [
  [/wax|strip|rica/,                           _IMGPX('6763618')],
  [/massage|effleurage|tapotement|petrissage|kneading|pressure|decompression/, _IMG('1544161515-4ab6ce6db874')],
  [/oil|pour|bhringraj|coconut|champi/,         _IMG('1519690889869-e705e59f72e1')],
  [/mask|pack|peel|charcoal|mud|vitamin c/,     _IMG('1570172619644-dfd03ed5d881')],
  [/steam|extract|spa|cool|soothe|rose/,        _IMG('1540555700478-4be289fbecef')],
  [/blow|dry|style|finish/,                     _IMGPX('10028673')],
  [/keratin|iron|sealing|smooth|shampoo|clarif|scalp/, _IMGPX('23349909')],
  [/nail|polish|gel|callus|mani|pedi/,          _IMG('1604654894610-df63bc536371')],
  [/soak|detox|foot|paraffin|pumice/,           _IMGPX('4155019')],
  [/thread|brow|eyebrow|mapping/,               _IMGPX('6135615')],
  [/shave|razor|lather|aftershave|balm|towel/,  _IMGPX('16553361')],
  [/haircut|cut|trim|fade|shape|taper/,         _IMG('1599351431202-1e0f0137899a')],
  [/beard/,                                     _IMG('1503951914875-452162b0f3f1')],
  [/moistur|toner|serum|spf|sunscreen|hydrat|cleanse|wash|foam|scrub|exfoliat|aha|walnut/, _IMGPX('29189893')],
  [/consult|assess|skin type/,                  _IMGPX('6135615')],
  [/neck|shoulder|back|trapez|rhomboid/,        _IMGPX('6560291')],
];

function getRitualStepImage(title) {
  const t = (title || '').toLowerCase();
  for (const [pattern, url] of RITUAL_STEP_IMAGES) {
    if (pattern.test(t)) return url;
  }
  return _IMG('1560750588-73207b1ef5b8');
}

/* ---------- Stars Rendering ---------- */
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

/* ---------- Format Price ---------- */
function formatPrice(amount) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/* ---------- Discount Percentage ---------- */
function calcDiscountPercent(original, current) {
  if (!original || original <= current) return 0;
  return Math.round(((original - current) / original) * 100);
}

/* =============================================
   RENDER SERVICE CARDS
   ============================================= */
let _servicesSnapshot = [];

export function renderServices(services) {
  _servicesSnapshot = services;
  const grid = document.getElementById('services-grid');
  const loading = document.getElementById('services-loading');
  const empty = document.getElementById('services-empty');

  loading.style.display = 'none';

  if (services.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  grid.innerHTML = services.map((service, index) => {
    const discount = calcDiscountPercent(service.originalPrice, service.price);
    const serviceId = service.serviceId || service.id;
    const inCart = isInCart(serviceId);
    const image = getServiceImage(service);

    return `
      <div class="service-card" data-service-id="${serviceId}" style="animation-delay: ${index * 60}ms">
        <div class="service-card-image">
          <img src="${image}" alt="${service.title}" loading="lazy" />
          ${service.isBundle ? `<span class="service-card-badge badge-bundle">Bundle</span>` : discount > 0 ? `<span class="service-card-badge badge-discount">${discount}% OFF</span>` : ''}
          <span class="service-card-duration">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            ${service.durationMinutes} min
          </span>
        </div>
        <div class="service-card-body">
          <div class="service-card-category">${service.category}</div>
          <h3 class="service-card-title">${service.title}</h3>
          <div class="service-card-rating">
            <span class="stars">${renderStars(service.rating)}</span>
            <span class="rating-value">${service.rating}</span>
            <span class="rating-count">(${service.reviewCount})</span>
          </div>
          <div class="service-card-footer">
            <div class="price-group">
              <span class="price-current">${formatPrice(service.price)}</span>
              ${service.originalPrice > service.price ? `<span class="price-original">${formatPrice(service.originalPrice)}</span>` : ''}
            </div>
            <button class="add-to-cart-btn ${inCart ? 'added' : ''}"
                    data-action="add-to-cart"
                    data-service-id="${serviceId}"
                    id="add-btn-${serviceId}">
              ${inCart ? '✓ Added' : '+ Add'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach click events
  grid.querySelectorAll('.service-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      // Don't open modal if clicking Add button
      if (e.target.closest('[data-action="add-to-cart"]')) return;
      const id = card.dataset.serviceId;
      const service = services.find((s) => (s.serviceId || s.id) === id);
      if (service) openServiceModal(service);
    });
  });

  grid.querySelectorAll('[data-action="add-to-cart"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.serviceId;
      const service = services.find((s) => (s.serviceId || s.id) === id);
      if (service) {
        addToCart(service);
        btn.classList.add('added');
        btn.innerHTML = '✓ Added';
      }
    });
  });
}

/* =============================================
   RENDER CATEGORIES
   ============================================= */
export function renderCategories(categories, activeCategory, onSelect) {
  const scroll = document.getElementById('categories-scroll');

  scroll.innerHTML = categories.map((cat) => `
    <button class="category-pill ${cat === activeCategory ? 'active' : ''}"
            data-category="${cat}"
            id="cat-${cat.replace(/\s+/g, '-').toLowerCase()}">
      ${cat}
    </button>
  `).join('');

  scroll.querySelectorAll('.category-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      onSelect(pill.dataset.category);
    });
  });
}

/* =============================================
   SERVICE DETAIL MODAL
   ============================================= */
function openServiceModal(service) {
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');
  const image = getServiceImage(service);
  const serviceId = service.serviceId || service.id;
  const discount = calcDiscountPercent(service.originalPrice, service.price);

  body.innerHTML = `
    <div class="modal-hero">
      <img src="${image}" alt="${service.title}" />
      <div class="modal-hero-overlay"></div>
    </div>
    <div class="modal-info">
      <div class="modal-category">${service.category}</div>
      <h2 class="modal-title">${service.title}</h2>
      <div class="modal-meta">
        <div class="modal-meta-item">
          <svg class="meta-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <strong>${service.rating}</strong> (${service.reviewCount} reviews)
        </div>
        <div class="modal-meta-item">
          <svg class="meta-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <strong>${service.durationMinutes}</strong> minutes
        </div>
        ${discount > 0 ? `
        <div class="modal-meta-item">
          <svg class="meta-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          <strong>${discount}% off</strong>
        </div>
        ` : ''}
      </div>

      ${service.ritualSteps && service.ritualSteps.length > 0 ? (() => {
        const steps = [...service.ritualSteps].sort((a, b) => a.step - b.step);
        const slides = steps.map((step, i) => `
          <div class="ritual-slide${i === 0 ? ' active' : ''}" data-index="${i}">
            <img class="ritual-slide-img" src="${getRitualStepImage(step.title)}" alt="${step.title}" loading="lazy" />
            <div class="ritual-slide-content">
              <span class="ritual-slide-num">${step.step}</span>
              <h4>${step.title}</h4>
              <p>${step.desc}</p>
            </div>
          </div>`).join('');
        const dots = steps.map((_, i) => `<button class="ritual-dot${i === 0 ? ' active' : ''}" data-dot="${i}" aria-label="Step ${i + 1}"></button>`).join('');
        return `
          <div class="ritual-carousel">
            <h3 class="modal-section-title">The Ritual</h3>
            <div class="ritual-carousel-wrap">
              <button class="ritual-arrow ritual-prev" aria-label="Previous">&#8249;</button>
              <div class="ritual-track-overflow">
                <div class="ritual-track">${slides}</div>
              </div>
              <button class="ritual-arrow ritual-next" aria-label="Next">&#8250;</button>
            </div>
            <div class="ritual-dots">${dots}</div>
          </div>`;
      })() : ''}

      ${(() => {
        const related = _servicesSnapshot.filter(
          (s) => s.category === service.category && (s.serviceId || s.id) !== serviceId
        ).slice(0, 3);
        if (!related.length) return '';
        return `
          <div class="related-services">
            <h3 class="modal-section-title">Customers also bought</h3>
            <div class="related-services-list">
              ${related.map((rel) => {
                const relId = rel.serviceId || rel.id;
                const inCart = isInCart(relId);
                return `
                  <div class="related-card" data-related-id="${relId}">
                    <img class="related-card-img" src="${getServiceImage(rel)}" alt="${rel.title}" loading="lazy" />
                    <div class="related-card-info">
                      <p class="related-card-title">${rel.title}</p>
                      <span class="related-card-price">${formatPrice(rel.price)}</span>
                    </div>
                    <button class="add-to-cart-btn ${inCart ? 'added' : ''}" data-action="add-related" data-service-id="${relId}">
                      ${inCart ? '✓' : '+'}
                    </button>
                  </div>`;
              }).join('')}
            </div>
          </div>`;
      })()}
    </div>

    <div class="modal-footer">
      <div class="modal-price">
        <div class="price-group">
          <span class="price-current">${formatPrice(service.price)}</span>
          ${service.originalPrice > service.price ? `<span class="price-original">${formatPrice(service.originalPrice)}</span>` : ''}
        </div>
      </div>
      <button class="modal-add-btn" id="modal-add-btn" data-service-id="${serviceId}">
        ${isInCart(serviceId) ? '✓ Added to Cart' : '+ Add to Cart'}
      </button>
    </div>
  `;

  overlay.classList.add('active');
  document.body.classList.add('modal-open');

  // Ritual carousel
  const track = body.querySelector('.ritual-track');
  if (track) {
    let current = 0;
    const slides = body.querySelectorAll('.ritual-slide');
    const dots   = body.querySelectorAll('.ritual-dot');
    const total  = slides.length;

    function goTo(idx) {
      current = (idx + total) % total;
      track.style.transform = `translateX(-${current * 100}%)`;
      slides.forEach((s, i) => s.classList.toggle('active', i === current));
      dots.forEach((d, i)   => d.classList.toggle('active', i === current));
    }

    body.querySelector('.ritual-prev').addEventListener('click', () => goTo(current - 1));
    body.querySelector('.ritual-next').addEventListener('click', () => goTo(current + 1));
    dots.forEach((d) => d.addEventListener('click', () => goTo(+d.dataset.dot)));

    // Swipe support
    let touchX = 0;
    track.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend',   (e) => {
      const diff = touchX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
    }, { passive: true });
  }

  // Modal add button
  document.getElementById('modal-add-btn').addEventListener('click', () => {
    addToCart(service);
    const btn = document.getElementById('modal-add-btn');
    btn.innerHTML = '✓ Added to Cart';

    // Also update card button
    const cardBtn = document.getElementById(`add-btn-${serviceId}`);
    if (cardBtn) {
      cardBtn.classList.add('added');
      cardBtn.innerHTML = '✓ Added';
    }
  });

  // Related services
  body.querySelectorAll('.related-card').forEach((card) => {
    const relId = card.dataset.relatedId;
    const relSvc = _servicesSnapshot.find((s) => (s.serviceId || s.id) === relId);

    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="add-related"]')) return;
      if (relSvc) openServiceModal(relSvc);
    });

    card.querySelector('[data-action="add-related"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!relSvc) return;
      addToCart(relSvc);
      e.currentTarget.classList.add('added');
      e.currentTarget.innerHTML = '✓';
    });
  });
}

export function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.body.classList.remove('modal-open');
}

/* =============================================
   CART DRAWER
   ============================================= */
export function openCart() {
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('cart-overlay').classList.add('active');
  document.body.classList.add('cart-open');
}

export function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('active');
  document.body.classList.remove('cart-open');
}

export function renderCart(state) {
  const itemsContainer = document.getElementById('cart-items');
  const emptyEl = document.getElementById('cart-empty');
  const footerEl = document.getElementById('cart-footer');
  const badge = document.getElementById('cart-badge');

  // Badge
  if (state.totalItems > 0) {
    badge.textContent = state.totalItems;
    badge.classList.add('visible');
    badge.classList.remove('pulse');
    // Trigger reflow for re-animation
    void badge.offsetWidth;
    badge.classList.add('pulse');
  } else {
    badge.classList.remove('visible');
  }

  // Empty state
  if (state.items.length === 0) {
    itemsContainer.innerHTML = '';
    emptyEl.classList.add('visible');
    footerEl.style.display = 'none';
    return;
  }

  emptyEl.classList.remove('visible');
  footerEl.style.display = 'block';

  // Render items
  itemsContainer.innerHTML = state.items.map((item) => `
    <div class="cart-item" data-cart-id="${item.id}">
      <div class="cart-item-info">
        <div class="cart-item-title">${item.service.title}</div>
        <div class="cart-item-price">${formatPrice(item.lineTotal)}</div>
      </div>
      <div class="cart-item-actions">
        <div class="qty-controls">
          <button class="qty-btn" data-action="decrease" data-id="${item.id}">−</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
        </div>
        <button class="cart-item-remove" data-action="remove" data-id="${item.id}">Remove</button>
      </div>
    </div>
  `).join('');

  // Coupon info
  const discountInfo = document.getElementById('cart-discount-info');
  if (state.couponCode && state.discountAmount > 0) {
    const label = state.couponType === 'percent'
      ? `${state.discountPercent}% off`
      : `₹${state.discountAmount.toLocaleString('en-IN')} off`;
    discountInfo.innerHTML = `
      <span class="discount-badge">
        🎟 ${state.couponCode} — ${label}
        <button id="remove-coupon-btn" style="margin-left:8px;background:none;border:none;color:inherit;cursor:pointer;font-size:0.85rem;opacity:0.7" title="Remove coupon">✕</button>
      </span>`;
    document.getElementById('remove-coupon-btn')?.addEventListener('click', () => {
      clearCoupon();
      document.getElementById('coupon-input').value = '';
      document.getElementById('coupon-status').textContent = '';
      document.getElementById('coupon-status').className = 'coupon-status';
    });
  } else {
    discountInfo.innerHTML = '';
  }

  // Summary
  document.getElementById('cart-subtotal').textContent = formatPrice(state.subtotal);

  const discountRow = document.getElementById('discount-row');
  if (state.discountAmount > 0) {
    discountRow.style.display = 'flex';
    document.getElementById('cart-discount').textContent = `-${formatPrice(state.discountAmount)}`;
  } else {
    discountRow.style.display = 'none';
  }

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

  document.getElementById('cart-total').textContent = formatPrice(state.total);

  // Event delegation for cart actions
  itemsContainer.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'increase') updateQuantity(id, 1);
      else if (action === 'decrease') updateQuantity(id, -1);
      else if (action === 'remove') removeFromCart(id);
    });
  });
}

/* =============================================
   TOAST
   ============================================= */
export function showToast(message) {
  const toast = document.getElementById('toast');
  const text = document.getElementById('toast-text');
  text.textContent = message;
  toast.classList.add('visible');

  setTimeout(() => {
    toast.classList.remove('visible');
  }, 3000);
}

/* =============================================
   LOGIN MODAL
   ============================================= */
function updateLoginHeader(user) {
  const btn   = document.getElementById('login-btn-header');
  const label = document.getElementById('login-label');
  if (user) {
    const name = user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Me';
    label.textContent = name;
    btn.classList.add('logged-in');
    document.getElementById('profile-dropdown-user').textContent = user.email || user.displayName || '';
  } else {
    label.textContent = 'Login';
    btn.classList.remove('logged-in');
  }
}

export function setupLoginModal() {
  const loginOverlay   = document.getElementById('login-overlay');
  const profileOverlay = document.getElementById('profile-overlay');
  const dropdown       = document.getElementById('profile-dropdown');

  /* ---- Login modal ---- */
  function openLogin()  {
    document.getElementById('login-error').textContent = '';
    loginOverlay.classList.add('active');
    document.body.classList.add('modal-open');
  }
  function closeLogin() {
    loginOverlay.classList.remove('active');
    document.body.classList.remove('modal-open');
  }

  /* ---- Dropdown ---- */
  function closeDropdown() { dropdown.classList.remove('open'); }

  document.getElementById('login-btn-header').addEventListener('click', (e) => {
    e.stopPropagation();
    const user = getCurrentUser();
    if (user) {
      dropdown.classList.toggle('open');
    } else {
      openLogin();
    }
  });

  document.addEventListener('click', closeDropdown);
  dropdown.addEventListener('click', (e) => e.stopPropagation());

  document.getElementById('profile-menu-logout').addEventListener('click', () => {
    closeDropdown();
    logout();
  });

  document.getElementById('profile-menu-profile').addEventListener('click', () => {
    closeDropdown();
    openProfileModal();
  });

  document.getElementById('profile-menu-bookings').addEventListener('click', () => {
    closeDropdown();
    openHistoryModal();
  });

  document.getElementById('profile-menu-help').addEventListener('click', () => {
    closeDropdown();
    const user = getCurrentUser();
    const msg  = user
      ? `Hi Bloom Salon! I need help. My account: ${user.email}`
      : 'Hi Bloom Salon! I need help with my booking.';
    window.open(`https://wa.me/919916953366?text=${encodeURIComponent(msg)}`, '_blank');
  });

  /* ---- Profile modal ---- */
  async function openProfileModal() {
    const user = getCurrentUser();
    if (!user) return;

    document.getElementById('profile-subtitle').textContent = user.email || '';
    document.getElementById('profile-email').value = user.email || '';
    document.getElementById('profile-error').textContent = '';

    // Populate apartment select from Firestore
    const aptSelect = document.getElementById('profile-apartment');
    try {
      const snap = await getDocs(
        query(collection(db, 'societies'), where('active', '==', true))
      );
      const names = snap.empty
        ? ['Adarsh Palm Retreat','Brigade Cosmopolis','Prestige Shantiniketan','Sobha Dream Acres','Salarpuria Greenage']
        : snap.docs.map((d) => d.data().name).filter(Boolean).sort();
      aptSelect.innerHTML = '<option value="">— Select Apartment / Society —</option>' +
        names.map((n) => `<option value="${n}">${n}</option>`).join('');
    } catch {
      aptSelect.innerHTML = '<option value="">— Select Apartment / Society —</option>';
    }

    // Pre-fill from Firestore
    try {
      const profile = await loadProfile(user.uid);
      if (profile) {
        document.getElementById('profile-first-name').value = profile.firstName || '';
        document.getElementById('profile-last-name').value  = profile.lastName  || '';
        document.getElementById('profile-phone').value      = profile.phone     || '';
        document.getElementById('profile-apartment').value  = profile.apartment || '';
        document.getElementById('profile-flat').value       = profile.flat      || '';
      } else {
        // Pre-fill name from Google
        const parts = (user.displayName || '').split(' ');
        document.getElementById('profile-first-name').value = parts[0] || '';
        document.getElementById('profile-last-name').value  = parts.slice(1).join(' ') || '';
        document.getElementById('profile-phone').value      = '';
        document.getElementById('profile-apartment').value  = '';
        document.getElementById('profile-flat').value       = '';
      }
    } catch (err) { console.error(err); }

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

    profileOverlay.classList.add('active');
    document.body.classList.add('modal-open');
  }

  function closeProfileModal() {
    profileOverlay.classList.remove('active');
    document.body.classList.remove('modal-open');
  }

  document.getElementById('profile-modal-close').addEventListener('click', closeProfileModal);
  profileOverlay.addEventListener('click', (e) => { if (e.target === profileOverlay) closeProfileModal(); });

  document.getElementById('profile-save-btn').addEventListener('click', async () => {
    const user    = getCurrentUser();
    if (!user) return;
    const errorEl = document.getElementById('profile-error');
    const btn     = document.getElementById('profile-save-btn');
    const phone   = document.getElementById('profile-phone').value.trim();

    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      errorEl.textContent = 'Enter valid 10-digit mobile number.';
      return;
    }

    btn.disabled = true;
    btn.querySelector('span').textContent = 'Saving…';
    errorEl.textContent = '';

    try {
      await saveProfile(user.uid, {
        firstName: document.getElementById('profile-first-name').value.trim(),
        lastName:  document.getElementById('profile-last-name').value.trim(),
        email:     user.email,
        phone,
        apartment: document.getElementById('profile-apartment').value.trim(),
        flat:      document.getElementById('profile-flat').value.trim(),
      });
      closeProfileModal();
      showToast('Profile saved!');
    } catch (err) {
      console.error(err);
      errorEl.textContent = 'Save failed. Check Firestore permissions.';
    } finally {
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Save Profile';
    }
  });

  /* ---- Booking history modal ---- */
  const historyOverlay = document.getElementById('history-overlay');

  const STATUS_CONFIG = {
    confirmed:   { label: 'Confirmed',   cls: 'status-confirmed' },
    assigned:    { label: 'Assigned',    cls: 'status-confirmed' },
    en_route:    { label: 'On the Way',  cls: 'status-confirmed' },
    in_progress: { label: 'In Progress', cls: 'status-confirmed' },
    completed:   { label: 'Completed',   cls: 'status-completed' },
    cancelled:   { label: 'Cancelled',   cls: 'status-cancelled' },
    rescheduled: { label: 'Rescheduled', cls: 'status-confirmed' },
    no_show:     { label: 'No Show',     cls: 'status-cancelled' },
  };

  const PAGE_SIZE = 5;
  let _historyOrders = [];
  let _historyPage   = 0;

  function renderHistoryPage() {
    const body  = document.getElementById('history-body');
    const total = _historyOrders.length;
    const start = _historyPage * PAGE_SIZE;
    const page  = _historyOrders.slice(start, start + PAGE_SIZE);
    const pages = Math.ceil(total / PAGE_SIZE);

    body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;padding-bottom:8px;">
        ${page.map((o) => {
          const appt   = o.appointment || {};
          const sc     = STATUS_CONFIG[o.status] || STATUS_CONFIG.confirmed;
          const booked = o.createdAt?.toDate?.();
          const bookedStr = booked
            ? booked.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
            : '—';

          // Format appointment date nicely
          let apptDateStr = '—', apptDayStr = '';
          if (appt.date) {
            const d = new Date(appt.date);
            apptDateStr = d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
            apptDayStr  = d.toLocaleDateString('en-IN', { weekday:'long' });
          }

          const serviceTags = (o.items || [])
            .map((i) => `<span style="display:inline-block;padding:2px 10px;border-radius:999px;background:var(--color-surface);border:1px solid var(--color-border);font-size:0.72rem;color:var(--color-text-secondary);margin:2px 2px 2px 0">${i.title?.split(' ').slice(0,4).join(' ')}</span>`)
            .join('');

          return `
            <div style="background:var(--gradient-card);border:1px solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden;">
              <!-- Top accent bar -->
              <div style="height:3px;background:var(--gradient-accent);opacity:0.7;"></div>

              <div style="padding:16px;">
                <!-- Header row: date + status -->
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;">
                  <div style="display:flex;align-items:center;gap:12px;">
                    <!-- Date block -->
                    <div style="background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);border-radius:var(--radius-md);padding:8px 12px;text-align:center;min-width:52px;">
                      <div style="font-size:1.3rem;font-weight:800;line-height:1;color:var(--color-accent-primary)">${appt.date ? new Date(appt.date).getDate() : '—'}</div>
                      <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.5px;color:var(--color-text-muted);margin-top:2px">${appt.date ? new Date(appt.date).toLocaleDateString('en-IN',{month:'short'}) : ''}</div>
                    </div>
                    <div>
                      <div style="font-weight:700;font-size:0.9rem;color:var(--color-text-primary)">${apptDayStr}</div>
                      <div style="font-size:0.8rem;color:var(--color-text-secondary);margin-top:1px">${appt.timeSlot || '—'}</div>
                    </div>
                  </div>
                  <span class="status-badge ${sc.cls}" style="flex-shrink:0">${sc.label}</span>
                </div>

                <!-- Services -->
                <div style="margin-bottom:12px;">${serviceTags || '<span style="font-size:0.82rem;color:var(--color-text-muted)">—</span>'}</div>

                <!-- Footer: address + price -->
                <div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid var(--color-border);">
                  <div>
                    ${o.customer?.address ? `<div style="font-size:0.75rem;color:var(--color-text-muted)">${o.customer.address}</div>` : ''}
                    ${o.stylistName ? `<div style="font-size:0.75rem;color:var(--color-accent-primary);margin-top:2px">Staff · ${o.stylistName}</div>` : ''}
                    <div style="font-size:0.68rem;color:var(--color-text-muted);margin-top:2px">Booked ${bookedStr}</div>
                  </div>
                  <div style="font-family:var(--font-display);font-size:1.2rem;font-weight:800;color:var(--color-gold)">₹${(o.total || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>
      ${pages > 1 ? `
        <div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid var(--color-border);margin-top:4px;">
          <button id="hist-prev" style="padding:6px 16px;border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text-secondary);font-size:0.82rem;cursor:pointer;" ${_historyPage === 0 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>← Prev</button>
          <span style="font-size:0.78rem;color:var(--color-text-muted)">Page ${_historyPage + 1} of ${pages}</span>
          <button id="hist-next" style="padding:6px 16px;border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text-secondary);font-size:0.82rem;cursor:pointer;" ${_historyPage >= pages - 1 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>Next →</button>
        </div>` : ''}`;

    document.getElementById('hist-prev')?.addEventListener('click', () => { _historyPage--; renderHistoryPage(); });
    document.getElementById('hist-next')?.addEventListener('click', () => { _historyPage++; renderHistoryPage(); });
  }

  async function openHistoryModal() {
    const user = getCurrentUser();
    if (!user) return;

    historyOverlay.classList.add('active');
    document.body.classList.add('modal-open');

    const body = document.getElementById('history-body');
    body.innerHTML = '<div class="services-loading"><div class="loader"></div><p>Loading…</p></div>';
    document.getElementById('history-subtitle').textContent = 'Your appointment history';

    try {
      const snap = await getDocs(
        query(collection(db, 'orders'), where('customerUid', '==', user.uid))
      );

      _historyOrders = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      _historyPage   = 0;

      document.getElementById('history-subtitle').textContent =
        `${_historyOrders.length} booking${_historyOrders.length !== 1 ? 's' : ''}`;

      if (!_historyOrders.length) {
        body.innerHTML = `
          <div style="text-align:center;padding:48px 24px;color:var(--color-text-secondary);">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.3;margin:0 auto 16px;display:block"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <p>No bookings yet.</p>
            <p style="font-size:0.82rem;color:var(--color-text-muted);margin-top:8px">Your confirmed bookings will appear here.</p>
          </div>`;
        return;
      }

      renderHistoryPage();
    } catch (err) {
      console.error(err);
      body.innerHTML = `<p style="color:var(--color-red);padding:24px;text-align:center;font-size:0.85rem">Failed to load bookings. Check Firestore permissions.</p>`;
    }
  }

  document.getElementById('history-modal-close').addEventListener('click', () => {
    historyOverlay.classList.remove('active');
    document.body.classList.remove('modal-open');
  });
  historyOverlay.addEventListener('click', (e) => {
    if (e.target === historyOverlay) {
      historyOverlay.classList.remove('active');
      document.body.classList.remove('modal-open');
    }
  });

  /* ---- Google sign-in ---- */
  let _notifUnsubscribe = null;
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

  document.getElementById('login-modal-close').addEventListener('click', closeLogin);
  loginOverlay.addEventListener('click', (e) => { if (e.target === loginOverlay) closeLogin(); });

  document.getElementById('google-signin-btn').addEventListener('click', async () => {
    const btn     = document.getElementById('google-signin-btn');
    const errorEl = document.getElementById('login-error');
    btn.disabled  = true;
    btn.textContent = 'Signing in…';
    errorEl.textContent = '';
    try {
      await signInWithGoogle();
      const signedInUser = getCurrentUser();
      if (signedInUser) onSignIn(signedInUser.uid).catch(() => {});
      closeLogin();
      showToast('Signed in with Google!');
      if (signedInUser) showNotificationBanner(signedInUser.uid);
    } catch (err) {
      console.error('Google sign-in error:', err.code, err.message);
      errorEl.textContent = err.code === 'auth/popup-closed-by-user'
        ? 'Sign-in cancelled.'
        : `Sign-in failed: ${err.code || err.message}`;
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-19.3 0-1.3-.1-2.5-.4-3.7z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.4-5L31.3 33c-2 1.4-4.5 2.2-7.3 2.2-5.2 0-9.6-3.5-11.2-8.3l-6.5 5C9.9 39.3 16.4 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4.1-4.3 5.4l6.1 5c3.7-3.4 5.9-8.4 5.9-14.1 0-1.3-.1-2.5-.4-3.7z"/></svg> Continue with Google`;
    }
  });
}

/* =============================================
   LOYALTY ROW
   ============================================= */
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

/* =============================================
   SETUP EVENT LISTENERS
   ============================================= */
export function setupGlobalListeners() {
  // Modal close
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Cart toggle
  document.getElementById('cart-toggle').addEventListener('click', openCart);
  document.getElementById('cart-close').addEventListener('click', closeCart);
  document.getElementById('cart-overlay').addEventListener('click', closeCart);

  // Coupon Apply
  document.getElementById('coupon-apply-btn').addEventListener('click', async () => {
    const input   = document.getElementById('coupon-input');
    const statusEl = document.getElementById('coupon-status');
    const applyBtn = document.getElementById('coupon-apply-btn');

    applyBtn.disabled = true;
    applyBtn.textContent = '…';
    statusEl.textContent = '';
    statusEl.className = 'coupon-status';

    const result = await validateAndApplyCoupon(input.value);

    statusEl.textContent = result.message;
    statusEl.className = `coupon-status ${result.success ? 'success' : 'error'}`;
    if (result.success) input.value = '';

    applyBtn.disabled = false;
    applyBtn.textContent = 'Apply';
  });

  document.getElementById('coupon-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('coupon-apply-btn').click();
  });

  // Checkout → open booking modal
  document.getElementById('checkout-btn').addEventListener('click', () => {
    openBookingModal(getCartState());
  });

  // Keyboard: Escape closes modal/cart
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeCart();
    }
  });

  // Subscribe to cart changes for rendering
  onCartChange(renderCart);

  // Initial cart render
  renderCart(getCartState());
}
