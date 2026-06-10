import { checkout } from './cart.js';

const TIME_SLOTS = [
  '8:00 – 10:00 AM',
  '10:00 AM – 12:00 PM',
  '12:00 – 2:00 PM',
  '2:00 – 4:00 PM',
  '4:00 – 6:00 PM',
  '6:00 – 8:00 PM',
];

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

export function openBookingModal(cartState) {
  selectedDate = null;
  selectedSlot = null;

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

  // Render time slots
  const slotGrid = document.getElementById('booking-slots');
  slotGrid.innerHTML = TIME_SLOTS.map((slot) => `
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
  ['booking-name', 'booking-phone', 'booking-address'].forEach((id) => {
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

async function handleConfirm() {
  const name    = document.getElementById('booking-name').value.trim();
  const phone   = document.getElementById('booking-phone').value.trim();
  const address = document.getElementById('booking-address').value.trim();
  const errorEl = document.getElementById('booking-error');

  if (!selectedDate)                       { errorEl.textContent = 'Select a date.'; return; }
  if (!selectedSlot)                       { errorEl.textContent = 'Select a time slot.'; return; }
  if (!name)                               { errorEl.textContent = 'Enter your name.'; return; }
  if (!/^[6-9]\d{9}$/.test(phone))         { errorEl.textContent = 'Enter valid 10-digit mobile number.'; return; }
  if (!address)                            { errorEl.textContent = 'Enter your address.'; return; }

  errorEl.textContent = '';
  const btn = document.getElementById('booking-confirm-btn');
  btn.disabled = true;
  btn.innerHTML = '<span>Confirming…</span>';

  try {
    const bookingDetails = {
      customer:    { name, phone, address },
      appointment: { date: selectedDate, timeSlot: selectedSlot },
    };
    const orderId = await checkout(bookingDetails);
    if (orderId) {
      closeBookingModal();
      _callbacks.closeCart?.();
      _callbacks.showToast?.(`Booked for ${selectedDate} · ${selectedSlot}`);
    }
  } catch (err) {
    console.error('Booking error:', err);
    errorEl.textContent = 'Booking failed. Please try again.';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Confirm Booking</span>';
  }
}
