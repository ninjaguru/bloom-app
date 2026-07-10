import { checkout } from './cart.js';
import { db } from './firebase.js';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

const FALLBACK_SLOTS = [
  '8:00 – 10:00 AM',
  '10:00 AM – 12:00 PM',
  '12:00 – 2:00 PM',
  '2:00 – 4:00 PM',
  '4:00 – 6:00 PM',
  '6:00 – 8:00 PM',
];

const WHATSAPP_NUMBER = '919916953366';

async function fetchActiveSlots() {
  try {
    const snap = await getDocs(
      query(collection(db, 'slots'), where('active', '==', true), orderBy('order', 'asc'))
    );
    if (!snap.empty) {
      return snap.docs.map((d) => d.data().timeSlot);
    }
  } catch {
    // fall through to defaults
  }
  return FALLBACK_SLOTS;
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
let _callbacks = {};
let _cartState = null;

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
}

export async function openBookingModal(cartState) {
  selectedDate = null;
  selectedSlot = null;
  _cartState = cartState;

  document.getElementById('booking-summary').textContent =
    `${cartState.totalItems} service${cartState.totalItems !== 1 ? 's' : ''} · ₹${cartState.total.toLocaleString('en-IN')}`;

  // Render date pills
  const dateGrid = document.getElementById('booking-dates');
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

  // Fetch + render time slots
  const slots = await fetchActiveSlots();
  const slotGrid = document.getElementById('booking-slots');
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

  // Reset form
  ['booking-name', 'booking-phone', 'booking-apartment', 'booking-flat'].forEach((id) => {
    document.getElementById(id).value = '';
  });
  document.getElementById('booking-error').textContent = '';

  document.getElementById('booking-overlay').classList.add('active');
  document.body.classList.add('modal-open');
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

  if (!selectedDate)                       { errorEl.textContent = 'Select a date.'; return; }
  if (!selectedSlot)                       { errorEl.textContent = 'Select a time slot.'; return; }
  if (!name)                               { errorEl.textContent = 'Enter your name.'; return; }
  if (!/^[6-9]\d{9}$/.test(phone))         { errorEl.textContent = 'Enter valid 10-digit mobile number.'; return; }
  if (!apartment)                          { errorEl.textContent = 'Enter apartment / society name.'; return; }
  if (!flat)                               { errorEl.textContent = 'Enter flat / door number.'; return; }

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

    // Open WhatsApp
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
