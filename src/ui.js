import {
  addToCart,
  removeFromCart,
  updateQuantity,
  isInCart,
  onCartChange,
  getCartState,
  validateAndApplyCoupon,
  clearCoupon,
} from './cart.js';
import { openBookingModal } from './booking.js';
import { requestOTP, verifyOTP, getSession, logout } from './auth.js';

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
export function renderServices(services) {
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
          ${discount > 0 ? `<span class="service-card-badge badge-discount">${discount}% OFF</span>` : ''}
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

      ${service.procedureSteps && service.procedureSteps.length > 0 ? `
        <div class="procedure-steps">
          <h3 class="modal-section-title">Procedure</h3>
          <div class="procedure-grid">
            ${service.procedureSteps
              .sort((a, b) => a.step - b.step)
              .map((step) => `
                <div class="procedure-step">
                  <div class="procedure-step-img-wrap">
                    <img src="${getRitualStepImage(step.title)}" alt="${step.title}" loading="lazy" />
                    <span class="procedure-step-num">${step.step}</span>
                  </div>
                  <h4>${step.title}</h4>
                </div>
              `).join('')}
          </div>
        </div>
      ` : ''}
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
export function updateLoginHeader() {
  const session = getSession();
  const btn     = document.getElementById('login-btn-header');
  const label   = document.getElementById('login-label');
  if (session?.loggedIn) {
    const display = session.phone.slice(-4);
    label.textContent = `+91 ••••${display}`;
    btn.classList.add('logged-in');
  } else {
    label.textContent = 'Login';
    btn.classList.remove('logged-in');
  }
}

export function setupLoginModal() {
  updateLoginHeader();

  const overlay    = document.getElementById('login-overlay');
  const stepPhone  = document.getElementById('login-step-phone');
  const stepOTP    = document.getElementById('login-step-otp');

  function openLogin() {
    stepPhone.style.display = 'block';
    stepOTP.style.display   = 'none';
    document.getElementById('login-phone').value    = '';
    document.getElementById('login-otp').value      = '';
    document.getElementById('login-phone-error').textContent = '';
    document.getElementById('login-otp-error').textContent   = '';
    overlay.classList.add('active');
    document.body.classList.add('modal-open');
  }

  function closeLogin() {
    overlay.classList.remove('active');
    document.body.classList.remove('modal-open');
  }

  document.getElementById('login-btn-header').addEventListener('click', () => {
    const session = getSession();
    if (session?.loggedIn) {
      if (confirm(`Logged in as +91${session.phone}. Logout?`)) {
        logout();
        updateLoginHeader();
      }
    } else {
      openLogin();
    }
  });

  document.getElementById('login-modal-close').addEventListener('click', closeLogin);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeLogin(); });

  // Step 1: Request OTP
  document.getElementById('login-request-btn').addEventListener('click', async () => {
    const phone   = document.getElementById('login-phone').value.trim();
    const errorEl = document.getElementById('login-phone-error');
    const btn     = document.getElementById('login-request-btn');

    if (!/^[6-9]\d{9}$/.test(phone)) {
      errorEl.textContent = 'Enter valid 10-digit mobile number.';
      return;
    }

    errorEl.textContent = '';
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Opening WhatsApp…';

    try {
      await requestOTP(phone);
      stepPhone.style.display = 'none';
      stepOTP.style.display   = 'block';
      document.getElementById('login-subtitle').textContent = `OTP requested for +91${phone}`;
      document.getElementById('login-otp').focus();
    } catch (err) {
      console.error(err);
      errorEl.textContent = 'Failed to create OTP. Check Firestore permissions.';
    } finally {
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Request OTP via WhatsApp';
    }
  });

  // Step 2: Back
  document.getElementById('login-back-btn').addEventListener('click', () => {
    stepOTP.style.display   = 'none';
    stepPhone.style.display = 'block';
  });

  // Step 2: Verify OTP
  document.getElementById('login-verify-btn').addEventListener('click', async () => {
    const phone   = document.getElementById('login-phone').value.trim();
    const otp     = document.getElementById('login-otp').value.trim();
    const errorEl = document.getElementById('login-otp-error');
    const btn     = document.getElementById('login-verify-btn');

    if (otp.length !== 6) { errorEl.textContent = 'Enter 6-digit OTP.'; return; }

    errorEl.textContent = '';
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Verifying…';

    try {
      const result = await verifyOTP(phone, otp);
      if (result.success) {
        updateLoginHeader();
        closeLogin();
        showToast('Logged in successfully!');
      } else {
        errorEl.textContent = result.message;
      }
    } catch (err) {
      console.error(err);
      errorEl.textContent = 'Verification failed. Try again.';
    } finally {
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Verify OTP';
    }
  });

  document.getElementById('login-otp').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('login-verify-btn').click();
  });
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
