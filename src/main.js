import { subscribeToServices, getCategories } from './services.js';
import { renderServices, renderCategories, setupGlobalListeners, setupLoginModal, closeCart, showToast } from './ui.js';
import { setupBookingListeners } from './booking.js';
import { setupRecommender } from './recommender.js';
import { addToCart } from './cart.js';

/* ---------- App State ---------- */
let currentGender = 'women';
let currentCategory = 'All';
let cachedServices = [];

/* ---------- Load Services ---------- */
function loadServices() {
  const loading = document.getElementById('services-loading');
  const grid = document.getElementById('services-grid');
  const empty = document.getElementById('services-empty');

  loading.style.display = 'block';
  grid.innerHTML = '';
  empty.style.display = 'none';

  subscribeToServices(currentGender, currentCategory, (services) => {
    cachedServices = services;
    renderServices(services);
  });
}

/* ---------- Load Categories ---------- */
async function loadCategories() {
  const categories = await getCategories(currentGender);

  function handleCategorySelect(selected) {
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
  loadCategories();
  loadServices();
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
