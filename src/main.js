import { subscribeToServices, getCategories, getBundles } from './services.js';
import { renderServices, renderCategories, setupGlobalListeners, setupLoginModal, closeCart, showToast } from './ui.js';
import { setupBookingListeners } from './booking.js';
import { setupRecommender } from './recommender.js';
import { addToCart } from './cart.js';
import { filterServices, debounce } from './search.js';

/* ---------- App State ---------- */
let currentGender = 'women';
let currentCategory = 'All';
let cachedServices = [];
let searchQuery = '';

/* ---------- Load Services ---------- */
function loadServices() {
  const loading = document.getElementById('services-loading');
  const grid = document.getElementById('services-grid');
  const empty = document.getElementById('services-empty');

  loading.style.display = 'block';
  grid.innerHTML = '';
  empty.style.display = 'none';

  subscribeToServices(currentGender, currentCategory, async (services) => {
    // Prepend active bundles when showing All category
    let displayed = services;
    if (!currentCategory || currentCategory === 'All') {
      try {
        const bundles = await getBundles(currentGender);
        displayed = [...bundles, ...services];
      } catch { /* bundles optional */ }
    }
    cachedServices = displayed;
    renderServices(filterServices(cachedServices, searchQuery));
  });
}

/* ---------- Load Categories ---------- */
async function loadCategories() {
  const categories = await getCategories(currentGender);

  function handleCategorySelect(selected) {
    searchQuery = '';
    const si = document.getElementById('search-input');
    if (si) si.value = '';
    currentCategory = selected;
    loadServices();
    renderCategories(categories, currentCategory, handleCategorySelect);
  }

  renderCategories(categories, currentCategory, handleCategorySelect);
}

/* ---------- Gender Toggle ---------- */
function setupGenderToggle() {
  const womenBtn = document.getElementById('gender-women');
  const menBtn = document.getElementById('gender-men');
  const slider = document.getElementById('gender-slider');

  function switchGender(gender) {
    currentGender = gender;
    currentCategory = 'All';
    searchQuery = '';
    const si = document.getElementById('search-input');
    if (si) si.value = '';

    // Update UI
    womenBtn.classList.toggle('active', gender === 'women');
    menBtn.classList.toggle('active', gender === 'men');
    slider.classList.toggle('men', gender === 'men');

    // Reload data
    loadCategories();
    loadServices();
  }

  womenBtn.addEventListener('click', () => switchGender('women'));
  menBtn.addEventListener('click', () => switchGender('men'));
}

/* ---------- Search ---------- */
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

/* ---------- Initialize App ---------- */
function init() {
  setupGlobalListeners();
  setupLoginModal();
  setupBookingListeners({ closeCart, showToast });
  setupRecommender(
    () => currentGender,
    () => cachedServices,
    addToCart,
  );
  setupGenderToggle();
  setupSearch();
  loadCategories();
  loadServices();
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
