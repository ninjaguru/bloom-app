import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDdgn9XnjtJp9i7GlWmCUmuze8vHXATb2k",
  authDomain: "maison-salon-at-home.firebaseapp.com",
  projectId: "maison-salon-at-home",
  storageBucket: "maison-salon-at-home.firebasestorage.app",
  messagingSenderId: "18321783031",
  appId: "1:18321783031:web:498e0265f46e5ff1467bf2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentStaff = null;
let allOrders = [];

/* ── UI refs ── */
const loginScreen = document.getElementById('login-screen');
const dashboard   = document.getElementById('dashboard');
const loginBtn    = document.getElementById('login-btn');
const loginError  = document.getElementById('login-error');
const staffPhone  = document.getElementById('staff-phone');
const staffBadge  = document.getElementById('staff-name-badge');
const staffDate   = document.getElementById('staff-date');
const contentArea = document.getElementById('content-area');
const toastEl     = document.getElementById('toast');

const statToday   = document.getElementById('stat-today');
const statUpcoming = document.getElementById('stat-upcoming');
const statEarnings = document.getElementById('stat-earnings');

/* ── Helpers ── */
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.style.display = 'block';
  setTimeout(() => { toastEl.style.display = 'none'; }, 3000);
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

/* ── Login ── */
loginBtn.addEventListener('click', async () => {
  const phone = staffPhone.value.trim();
  if (!/^[6-9]\d{9}$/.test(phone)) {
    loginError.textContent = 'Enter a valid 10-digit mobile number.';
    loginError.style.display = 'block';
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Checking…';
  loginError.style.display = 'none';

  try {
    const snap = await getDocs(
      query(collection(db, 'stylists'), where('phone', '==', phone), where('active', '==', true))
    );

    if (snap.empty) {
      loginError.textContent = 'Staff member not found. Contact your admin.';
      loginError.style.display = 'block';
      loginBtn.disabled = false;
      loginBtn.textContent = 'View My Schedule';
      return;
    }

    currentStaff = { id: snap.docs[0].id, ...snap.docs[0].data() };
    sessionStorage.setItem('bloom_staff_session', JSON.stringify({ phone, id: currentStaff.id }));
    showDashboard();
  } catch (err) {
    console.error('Staff login error:', err);
    loginError.textContent = 'Something went wrong. Try again.';
    loginError.style.display = 'block';
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'View My Schedule';
  }
});

/* ── Restore session ── */
const saved = sessionStorage.getItem('bloom_staff_session');
if (saved) {
  const { phone } = JSON.parse(saved);
  staffPhone.value = phone;
  loginBtn.click();
}

/* ── Sign out ── */
document.getElementById('signout-link').addEventListener('click', () => {
  currentStaff = null;
  sessionStorage.removeItem('bloom_staff_session');
  dashboard.classList.add('hidden');
  loginScreen.classList.remove('hidden');
});

/* ── Dashboard ── */
async function showDashboard() {
  loginScreen.classList.add('hidden');
  dashboard.classList.remove('hidden');
  staffDate.textContent = `Today · ${formatDate(getToday())}`;
  staffBadge.textContent = currentStaff.name || currentStaff.phone;

  await loadOrders();
}

async function loadOrders() {
  contentArea.innerHTML = '<div class="loading">Loading your schedule…</div>';

  try {
    const snap = await getDocs(
      query(
        collection(db, 'orders'),
        where('stylistId', '==', currentStaff.id),
        orderBy('createdAt', 'desc')
      )
    );

    allOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderView();
  } catch (err) {
    console.error('Load orders error:', err);
    contentArea.innerHTML = '<div class="empty-state"><div class="emoji">⚠️</div><p>Could not load schedule.</p></div>';
  }
}

function renderView() {
  const today = getToday();

  const todayOrders = allOrders.filter((o) => {
    const orderDate = o.appointment?.date;
    return orderDate === today && o.status !== 'cancelled' && o.status !== 'no_show';
  });

  const upcomingOrders = allOrders.filter((o) => {
    const orderDate = o.appointment?.date;
    return orderDate && orderDate > today && o.status !== 'cancelled' && o.status !== 'completed';
  });

  const completed = allOrders.filter((o) => o.status === 'completed');
  const earnings = completed.reduce((sum, o) => {
    const totalMin = o.items?.reduce((s, i) => s + (i.durationMinutes || 0), 0) || 0;
    const hrs = totalMin / 60;
    return sum + (hrs * (currentStaff.hourlyRate || 0));
  }, 0);

  statToday.textContent = todayOrders.length;
  statUpcoming.textContent = upcomingOrders.length;
  statEarnings.textContent = `₹${Math.round(earnings).toLocaleString('en-IN')}`;

  /* ── Render Today ── */
  let html = '';

  if (todayOrders.length > 0) {
    html += '<div class="section-title"><span>●</span> Today\'s Appointments</div>';
    todayOrders.forEach((o) => { html += renderOrderCard(o); });
  } else {
    html += '<div class="empty-state"><div class="emoji">🎉</div><p>No appointments today. Enjoy your day off!</p></div>';
  }

  /* ── Render Upcoming ── */
  if (upcomingOrders.length > 0) {
    html += `<div class="section-title" style="margin-top:20px"><span>📅</span> Upcoming (${upcomingOrders.length})</div>`;
    upcomingOrders.slice(0, 10).forEach((o) => { html += renderOrderCard(o); });
  }

  contentArea.innerHTML = html;

  /* ── Attach status change handlers ── */
  document.querySelectorAll('.status-select').forEach((sel) => {
    sel.addEventListener('change', async (e) => {
      const orderId = e.target.dataset.orderId;
      const newStatus = e.target.value;
      if (!orderId || !newStatus) return;

      try {
        await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
        showToast(`Status updated to "${newStatus.replace(/_/g, ' ')}"`);
        renderView(); // re-render
      } catch (err) {
        console.error('Status update error:', err);
        showToast('Failed to update status');
      }
    });
  });
}

function renderOrderCard(order) {
  const servicesHtml = (order.items || [])
    .map((i) => `<span class="service-tag">${i.title}${i.quantity > 1 ? ` ×${i.quantity}` : ''}</span>`)
    .join('');

  const statuses = [
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'en_route', label: 'On the Way' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'rescheduled', label: 'Rescheduled' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'no_show', label: 'No Show' },
  ];

  const statusOpts = statuses
    .map((s) => `<option value="${s.value}"${order.status === s.value ? ' selected' : ''}>${s.label}</option>`)
    .join('');

  const timeSlot = order.appointment?.timeSlot || '—';
  const address = order.customer?.address || '—';
  const customerName = order.customer?.name || '—';
  const customerPhone = order.customer?.phone || '—';
  const date = order.appointment?.date ? formatDate(order.appointment.date) : '—';

  return `
    <div class="booking-card">
      <div class="top-row">
        <div>
          <div class="customer-name">${customerName}</div>
          <div class="customer-info">${customerPhone} · ${timeSlot}</div>
        </div>
        <div class="time-badge">${date}</div>
      </div>
      <div class="address">📍 ${address}</div>
      <div class="services">${servicesHtml}</div>
      <select class="status-select" data-order-id="${order.id}">${statusOpts}</select>
    </div>
  `;
}
