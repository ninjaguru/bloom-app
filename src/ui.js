import {
  addToCart,
  removeFromCart,
  updateQuantity,
  isInCart,
  onCartChange,
  getCartState,
} from './cart.js';
import { openBookingModal } from './booking.js';

/* ---------- Service Card Images ---------- */
const SERVICE_IMAGES = {
  'Waxing': 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&h=400&fit=crop',
  'Facial': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop',
  'Hair': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=400&fit=crop',
  'Massage': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=400&fit=crop',
  'Manicure & Pedicure': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop',
  'Nails': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop',
  'Threading': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop',
  'Cleanup': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop',
  'Beard & Grooming': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=400&fit=crop',
  'Haircut': 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&h=400&fit=crop',
  'Spa': 'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=600&h=400&fit=crop',
  'Body Polish': 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&h=400&fit=crop',
  'default': 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&h=400&fit=crop',
};

function getServiceImage(service) {
  if (service && service.imageUrl) return service.imageUrl;
  const category = typeof service === 'string' ? service : (service && service.category);
  return SERVICE_IMAGES[category] || SERVICE_IMAGES['default'];
}

/* ---------- Procedure Step Icons ---------- */
const PROCEDURE_ICONS = ['🧴', '💆', '✨', '🌸', '💅', '🧖', '🪮', '💎'];

/* ---------- Ritual Step Images (verified Unsplash IDs) ---------- */
const _IMG = (id) => `https://images.unsplash.com/photo-${id}?w=800&h=500&fit=crop&auto=format`;
const RITUAL_STEP_IMAGES = [
  // waxing / strip / rica
  [/wax|strip|rica/,                          _IMG('1560750588-73207b1ef5b8')],
  // massage table / body treatment
  [/massage|effleurage|tapotement|petrissage|kneading|pressure|decompression/, _IMG('1544161515-4ab6ce6db874')],
  // oil pour / warm oil / champi
  [/oil|pour|bhringraj|coconut|champi/,        _IMG('1519690889869-e705e59f72e1')],
  // face mask / pack / peel / charcoal / mud
  [/mask|pack|peel|charcoal|mud|vitamin c/,    _IMG('1570172619644-dfd03ed5d881')],
  // steam / sauna / spa
  [/steam|extract|spa|cool|soothe|rose/,       _IMG('1540555700478-4be289fbecef')],
  // hair blow dry / style
  [/blow|dry|style|finish/,                    _IMG('1562322140-8baeececf3df')],
  // keratin / flat iron / smoothen
  [/keratin|iron|sealing|smooth|shampoo|clarif|scalp/, _IMG('1522337360788-8b13dee7a37e')],
  // nail / gel / polish / mani / pedi / callus
  [/nail|polish|gel|callus|mani|pedi/,         _IMG('1604654894610-df63bc536371')],
  // foot soak / detox soak / paraffin / pumice
  [/soak|detox|foot|paraffin|pumice/,          _IMG('1544161515-4ab6ce6db874')],
  // threading / brow / eyebrow
  [/thread|brow|eyebrow|mapping/,              _IMG('1519823551278-64ac92734fb1')],
  // shave / razor / lather / aftershave / hot towel
  [/shave|razor|lather|aftershave|balm|towel/, _IMG('1503951914875-452162b0f3f1')],
  // haircut / cut / trim / fade / taper
  [/haircut|cut|trim|fade|shape|taper/,        _IMG('1599351431202-1e0f0137899a')],
  // beard
  [/beard/,                                    _IMG('1503951914875-452162b0f3f1')],
  // moisturize / toner / serum / spf / sunscreen / skincare
  [/moistur|toner|serum|spf|sunscreen|hydrat|cleanse|wash|foam|scrub|exfoliat|aha|walnut/, _IMG('1570172619644-dfd03ed5d881')],
  // consultation / assessment
  [/consult|assess|skin type/,                 _IMG('1519823551278-64ac92734fb1')],
  // shoulder / neck / back
  [/neck|shoulder|back|trapez|rhomboid/,       _IMG('1544161515-4ab6ce6db874')],
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
          <span class="icon">⭐</span>
          <strong>${service.rating}</strong> (${service.reviewCount} reviews)
        </div>
        <div class="modal-meta-item">
          <span class="icon">⏱</span>
          <strong>${service.durationMinutes}</strong> minutes
        </div>
        ${discount > 0 ? `
        <div class="modal-meta-item">
          <span class="icon">🏷</span>
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
            <h3 class="modal-section-title"><span class="icon">✨</span> The Ritual</h3>
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
          <h3 class="modal-section-title"><span class="icon">📋</span> Procedure</h3>
          <div class="procedure-grid">
            ${service.procedureSteps
              .sort((a, b) => a.step - b.step)
              .map((step, i) => `
                <div class="procedure-step">
                  <span class="procedure-step-num">${step.step}</span>
                  <div class="procedure-step-icon">${PROCEDURE_ICONS[i % PROCEDURE_ICONS.length]}</div>
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

  // Discount info
  const discountInfo = document.getElementById('cart-discount-info');
  if (state.discountPercent > 0) {
    discountInfo.innerHTML = `<span class="discount-badge">🎉 ${state.discountPercent}% Bundle Discount Applied!</span>`;
  } else if (state.totalItems === 1) {
    discountInfo.innerHTML = `<span class="discount-badge" style="opacity:0.6">Add 1 more for 5% off</span>`;
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
