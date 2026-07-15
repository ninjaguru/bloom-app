import { checkout } from './cart.js';
import { db } from './firebase.js';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { getCurrentUser, loadProfile } from './auth.js';

const FALLBACK_APARTMENTS = [
  // Whitefield
  'Adarsh Palm Retreat',
  'Adarsh Palm Meadows',
  'Assetz Marq',
  'Brigade Cosmopolis',
  'Brigade Gateway',
  'Brigade Orchards',
  'Casagrand Ultima',
  'Concorde Sylvan View',
  'DNR Reflection',
  'Embassy Springs',
  'Godrej Reflections',
  'Godrej Splendour',
  'L&T Raintree Boulevard',
  'Mahindra Windchimes',
  'Mantri Webcity',
  'Nitesh Caesars Palace',
  'Prestige Lakeside Habitat',
  'Prestige Shantiniketan',
  'Prestige White Meadows',
  'Purva Fountainhead',
  'Purva Skywood',
  'Rajapushpa Provincia',
  'RMZ Latitude',
  'Salarpuria Greenage',
  'Salarpuria Sattva Misty Charm',
  'Shriram Summitt',
  'Sobha Dream Acres',
  'Sumadhura Epitome',
  'Tata New Haven',
  'Vaishnavi Terraces',
  // Marathahalli
  'Brigade Caladium',
  'Mantri Espana',
  'Nester Piccadily',
  'Prestige Misty Waters',
  'Purva Skydale',
  'Salarpuria Sattva Magnus',
  'SJR Watermark',
  'Sobha City',
  // Varthur
  'Brigade Utopia',
  'Gopalan Grandeur',
  'Mana Glen',
  'Prestige Sunrise Park',
  'Prestige Tranquility',
  'Rohan Prerna',
  'Vaishnavi Serene',
];

async function populateApartmentList() {
  const datalist = document.getElementById('apartment-list');
  if (!datalist) return;
  try {
    const snap = await getDocs(
      query(collection(db, 'societies'), where('active', '==', true), orderBy('name', 'asc'))
    );
    const names = snap.empty
      ? FALLBACK_APARTMENTS
      : snap.docs.map((d) => d.data().name).filter(Boolean);
    datalist.innerHTML = names.map((n) => `<option value="${n}"></option>`).join('');
  } catch {
    datalist.innerHTML = FALLBACK_APARTMENTS.map((n) => `<option value="${n}"></option>`).join('');
  }
}

const FALLBACK_SLOTS = [
  '8:00 – 10:00 AM',
  '10:00 AM – 12:00 PM',
  '12:00 – 2:00 PM',
  '2:00 – 4:00 PM',
  '4:00 – 6:00 PM',
  '6:00 – 8:00 PM',
];

const WHATSAPP_NUMBER = '919916953366';

async function fetchSlotsForApartment(apartmentName) {
  try {
    const snap = await getDocs(
      query(collection(db, 'slots'), where('active', '==', true))
    );
    if (snap.empty) return FALLBACK_SLOTS;

    const all = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((s) => {
        const societies = s.societies;
        // no restriction = available to all
        if (!societies || societies.length === 0) return true;
        return societies.some(
          (soc) => soc.trim().toLowerCase() === apartmentName.trim().toLowerCase()
        );
      })
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

    return all.length ? all.map((s) => s.timeSlot) : FALLBACK_SLOTS;
  } catch {
    return FALLBACK_SLOTS;
  }
}

function getAvailableDates() {
  const dates = [];
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      value: d.toISOString().split('T')[0],
      label: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : dayNames[d.getDay()],
      sublabel: `${d.getDate()} ${monthNames[d.getMonth()]}`,
    });
  }
  return dates;
}

let selectedDate = null;
let selectedSlot = null;
let _callbacks   = {};
let _cartState   = null;

export function setupBookingListeners({ closeCart, showToast }) {
  _callbacks = { closeCart, showToast };

  document.getElementById('booking-close').addEventListener('click', closeBookingModal);
  document.getElementById('booking-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeBookingModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeBookingModal();
  });
  document.getElementById('booking-confirm-btn').addEventListener('click', handleConfirm);

  // Reveal date + slot sections once apartment is filled
  const apartmentInput = document.getElementById('booking-apartment');
  let slotLoadTimer = null;

  function onApartmentChange() {
    const val = apartmentInput.value.trim();
    if (!val) return;

    clearTimeout(slotLoadTimer);
    slotLoadTimer = setTimeout(() => loadDateAndSlots(val), 400);
  }

  apartmentInput.addEventListener('change', onApartmentChange);
  apartmentInput.addEventListener('blur',   onApartmentChange);
}

async function loadDateAndSlots(apartmentName) {
  const dateSection = document.getElementById('booking-date-section');
  const slotSection = document.getElementById('booking-slot-section');
  const hintEl      = document.getElementById('slot-hint');

  // Show date section
  dateSection.style.display = 'block';

  // Render date pills if not done yet
  const dateGrid = document.getElementById('booking-dates');
  if (!dateGrid.children.length) {
    dateGrid.innerHTML = getAvailableDates().map((d) => `
      <button class="date-btn" data-date="${d.value}">
        <span class="date-label">${d.label}</span>
        <span class="date-sublabel">${d.sublabel}</span>
      </button>
    `).join('');
    dateGrid.querySelectorAll('.date-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        dateGrid.querySelectorAll('.date-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedDate = btn.dataset.date;
      });
    });
  }

  // Fetch + render slots for this apartment
  slotSection.style.display = 'block';
  const slotGrid = document.getElementById('booking-slots');
  slotGrid.innerHTML = '<p style="color:var(--color-text-muted);font-size:0.82rem">Loading slots…</p>';
  hintEl.textContent = '';

  const slots = await fetchSlotsForApartment(apartmentName);

  if (!slots.length) {
    slotGrid.innerHTML = '';
    hintEl.textContent = 'No slots configured for this apartment yet.';
    hintEl.style.color = 'var(--color-red)';
    return;
  }

  selectedSlot = null;
  slotGrid.innerHTML = slots.map((slot) => `
    <button class="slot-btn" data-slot="${slot}">${slot}</button>
  `).join('');
  slotGrid.querySelectorAll('.slot-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      slotGrid.querySelectorAll('.slot-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSlot = btn.dataset.slot;
    });
  });
}

export async function openBookingModal(cartState) {
  selectedDate = null;
  selectedSlot = null;
  _cartState   = cartState;

  // Reset first — before any async work
  document.getElementById('booking-dates').innerHTML            = '';
  document.getElementById('booking-slots').innerHTML            = '';
  document.getElementById('booking-date-section').style.display = 'none';
  document.getElementById('booking-slot-section').style.display = 'none';
  document.getElementById('booking-error').textContent          = '';
  ['booking-name', 'booking-phone', 'booking-apartment', 'booking-flat'].forEach((id) => {
    document.getElementById(id).value = '';
  });

  document.getElementById('booking-summary').textContent =
    `${cartState.totalItems} service${cartState.totalItems !== 1 ? 's' : ''} · ₹${cartState.total.toLocaleString('en-IN')}`;

  populateApartmentList();

  document.getElementById('booking-overlay').classList.add('active');
  document.body.classList.add('modal-open');

  // Pre-fill from saved profile (after modal is visible)
  const user = getCurrentUser();
  if (user) {
    try {
      const profile = await loadProfile(user.uid);
      if (profile) {
        const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
        document.getElementById('booking-name').value      = fullName          || '';
        document.getElementById('booking-phone').value     = profile.phone     || '';
        document.getElementById('booking-apartment').value = profile.apartment || '';
        document.getElementById('booking-flat').value      = profile.flat      || '';
        if (profile.apartment) await loadDateAndSlots(profile.apartment);
      }
    } catch (err) {
      console.warn('Profile pre-fill failed:', err);
    }
  }
}

export function closeBookingModal() {
  document.getElementById('booking-overlay').classList.remove('active');
  document.body.classList.remove('modal-open');
}

function buildWhatsAppMessage({ name, phone, apartment, flat, date, slot, cartState }) {
  const serviceLines = cartState.items
    .map((item) => `  • ${item.service.title} (×${item.quantity}) — ₹${item.lineTotal.toLocaleString('en-IN')}`)
    .join('\n');

  const lines = [
    '🌿 *New Bloom Salon Booking*',
    '',
    `*Customer:* ${name}`,
    `*Phone:* ${phone}`,
    `*Address:* ${flat}, ${apartment}`,
    '',
    `*Date:* ${date}`,
    `*Time:* ${slot}`,
    '',
    '*Services:*',
    serviceLines,
  ];

  if (cartState.couponCode && cartState.discountAmount > 0) {
    lines.push(`Coupon (${cartState.couponCode}): -₹${cartState.discountAmount.toLocaleString('en-IN')}`);
  }

  lines.push(`*Total: ₹${cartState.total.toLocaleString('en-IN')}*`);

  return lines.join('\n');
}

async function handleConfirm() {
  const name      = document.getElementById('booking-name').value.trim();
  const phone     = document.getElementById('booking-phone').value.trim();
  const apartment = document.getElementById('booking-apartment').value.trim();
  const flat      = document.getElementById('booking-flat').value.trim();
  const errorEl   = document.getElementById('booking-error');

  if (!name)                               { errorEl.textContent = 'Enter your name.'; return; }
  if (!/^[6-9]\d{9}$/.test(phone))         { errorEl.textContent = 'Enter valid 10-digit mobile number.'; return; }
  if (!apartment)                          { errorEl.textContent = 'Enter apartment / society name.'; return; }
  if (!flat)                               { errorEl.textContent = 'Enter flat / door number.'; return; }
  if (!selectedDate)                       { errorEl.textContent = 'Select a date.'; return; }
  if (!selectedSlot)                       { errorEl.textContent = 'Select a time slot.'; return; }

  errorEl.textContent = '';
  const btn = document.getElementById('booking-confirm-btn');
  btn.disabled = true;
  btn.innerHTML = '<span>Confirming…</span>';

  try {
    const address = `${flat}, ${apartment}`;
    const bookingDetails = {
      customer:    { name, phone, address, apartment, flat },
      appointment: { date: selectedDate, timeSlot: selectedSlot },
    };
    await checkout(bookingDetails);

    const message = buildWhatsAppMessage({
      name, phone, apartment, flat,
      date: selectedDate,
      slot: selectedSlot,
      cartState: _cartState,
    });
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      '_blank'
    );

    closeBookingModal();
    _callbacks.closeCart?.();
    _callbacks.showToast?.(`Booking confirmed for ${selectedDate} · ${selectedSlot}`);
  } catch (err) {
    console.error('Booking error:', err);
    errorEl.textContent = 'Booking failed. Please try again.';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Confirm Booking</span>';
  }
}
