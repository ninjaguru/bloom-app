import { auth, db } from './firebase.js';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  query,
} from 'firebase/firestore';

/* ================================================================
   AUTH
   ================================================================ */
onAuthStateChanged(auth, (user) => {
  if (user) showDashboard(user);
  else       showLogin();
});

function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-screen').style.display  = 'none';
}

async function showDashboard(user) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-screen').style.display  = 'block';
  document.getElementById('admin-user-email').textContent = user.email;
  await loadAllData();
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email    = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value;
  const errorEl  = document.getElementById('login-error');
  const btn      = document.getElementById('login-btn');

  errorEl.textContent = '';
  btn.disabled    = true;
  btn.textContent = 'Signing in…';

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    const msg = {
      'auth/user-not-found':      'No admin account found.',
      'auth/wrong-password':      'Incorrect password.',
      'auth/invalid-email':       'Invalid email address.',
      'auth/invalid-credential':  'Invalid email or password.',
      'auth/too-many-requests':   'Too many attempts. Try again later.',
    };
    errorEl.textContent = msg[err.code] || 'Login failed.';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Sign In';
  }
});

document.getElementById('signout-btn').addEventListener('click', () => signOut(auth));

/* ================================================================
   DATA LOADING
   ================================================================ */
let allOrders   = [];
let allServices = [];

async function loadAllData() {
  try {
    const [ordersSnap, servicesSnap] = await Promise.all([
      getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'))),
      getDocs(collection(db, 'services')),
    ]);

    allOrders   = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    allServices = servicesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    renderKPIs(allOrders);
    renderBookingsTable(allOrders);
    renderSalesReport(allOrders);
    renderInventoryReport(allOrders, allServices);
    renderStaffReport(allOrders);
  } catch (err) {
    console.error('Data load failed:', err);
    showToast('Failed to load data. Check Firestore rules.');
  }
}

/* ================================================================
   TAB SWITCHING
   ================================================================ */
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

/* ================================================================
   KPI CARDS
   ================================================================ */
function renderKPIs(orders) {
  const today   = new Date().toISOString().split('T')[0];
  const active  = orders.filter((o) => o.status !== 'cancelled');
  const revenue = active.reduce((s, o) => s + (o.total || 0), 0);
  const todayN  = orders.filter((o) => o.appointment?.date === today && o.status === 'confirmed').length;
  const avg     = active.length ? Math.round(revenue / active.length) : 0;

  document.getElementById('stat-total').textContent   = orders.length;
  document.getElementById('stat-revenue').textContent = `₹${revenue.toLocaleString('en-IN')}`;
  document.getElementById('stat-today').textContent   = todayN;
  document.getElementById('stat-avg').textContent     = `₹${avg.toLocaleString('en-IN')}`;
}

/* ================================================================
   BOOKINGS TABLE
   ================================================================ */
function renderBookingsTable(orders) {
  const tbody = document.getElementById('orders-tbody');

  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="table-empty"><p>No bookings yet.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map((order) => {
    const appt      = order.appointment || {};
    const customer  = order.customer    || {};
    const items     = order.items       || [];
    const isPending = order.status === 'confirmed';
    const statusCls = `status-${order.status || 'confirmed'}`;

    const tags = items.map((i) =>
      `<span class="service-tag">${(i.title || '').split(' ').slice(0, 3).join(' ')}…</span>`
    ).join('');

    const createdDate = order.createdAt?.toDate
      ? order.createdAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';

    return `
      <tr data-id="${order.id}">
        <td class="td-customer">
          <strong>${customer.name || '—'}</strong>
          <span>${customer.phone || ''}</span>
          <span style="display:block;font-size:0.72rem;color:var(--color-text-muted);margin-top:2px">${customer.address || ''}</span>
        </td>
        <td class="td-services">${tags || '—'}</td>
        <td class="td-datetime">
          <strong>${appt.date || '—'}</strong>
          <span>${appt.timeSlot || '—'}</span>
          <span style="display:block;font-size:0.72rem;color:var(--color-text-muted)">${createdDate}</span>
        </td>
        <td class="td-amount">₹${(order.total || 0).toLocaleString('en-IN')}</td>
        <td><span class="status-badge ${statusCls}">${order.status || 'confirmed'}</span></td>
        <td class="td-actions">
          <button class="action-btn complete" data-id="${order.id}" data-action="completed" ${!isPending ? 'disabled' : ''}>✓ Done</button>
          <button class="action-btn cancel"   data-id="${order.id}" data-action="cancelled" ${!isPending ? 'disabled' : ''}>✕ Cancel</button>
        </td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('.action-btn:not([disabled])').forEach((btn) => {
    btn.addEventListener('click', () => updateOrderStatus(btn.dataset.id, btn.dataset.action));
  });
}

async function updateOrderStatus(orderId, newStatus) {
  const row  = document.querySelector(`tr[data-id="${orderId}"]`);
  row?.querySelectorAll('.action-btn').forEach((b) => { b.disabled = true; });

  try {
    await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    const order = allOrders.find((o) => o.id === orderId);
    if (order) order.status = newStatus;
    renderBookingsTable(allOrders);
    renderKPIs(allOrders);
    renderSalesReport(allOrders);
    showToast(`Booking marked as ${newStatus}`);
  } catch (err) {
    console.error(err);
    showToast('Update failed. Check Firestore rules.');
  }
}

document.getElementById('refresh-btn').addEventListener('click', loadAllData);

document.getElementById('status-filter').addEventListener('change', (e) => {
  const val = e.target.value;
  renderBookingsTable(val === 'all' ? allOrders : allOrders.filter((o) => (o.status || 'confirmed') === val));
});

/* ================================================================
   SALES REPORT
   ================================================================ */
function renderSalesReport(orders) {
  const active = orders.filter((o) => o.status !== 'cancelled');

  // Status breakdown
  const counts = { confirmed: 0, completed: 0, cancelled: 0 };
  orders.forEach((o) => { counts[o.status || 'confirmed'] = (counts[o.status || 'confirmed'] || 0) + 1; });
  const total = orders.length || 1;
  document.getElementById('sales-status').innerHTML = Object.entries(counts).map(([status, n]) => `
    <div class="bar-row">
      <div class="bar-label-left"><span class="status-badge status-${status}">${status}</span></div>
      <div class="bar-track"><div class="bar-fill ${status}" style="width:${Math.round((n / total) * 100)}%"></div></div>
      <div class="bar-val">${n}</div>
    </div>`).join('');

  // Revenue by category
  const catRev = {};
  active.forEach((o) => {
    (o.items || []).forEach((item) => {
      const cat = item.category || 'Other';
      catRev[cat] = (catRev[cat] || 0) + (item.lineTotal || 0);
    });
  });
  const maxCatRev = Math.max(...Object.values(catRev), 1);
  document.getElementById('sales-category').innerHTML =
    Object.entries(catRev)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([cat, rev]) => barRow(cat, rev, maxCatRev, `₹${rev.toLocaleString('en-IN')}`))
      .join('') || '<p class="empty-msg">No data yet</p>';

  // Top services by revenue
  const svcRev = {};
  active.forEach((o) => {
    (o.items || []).forEach((item) => {
      const key = item.serviceId || item.title;
      if (!svcRev[key]) svcRev[key] = { title: item.title, revenue: 0, count: 0 };
      svcRev[key].revenue += item.lineTotal || 0;
      svcRev[key].count   += item.quantity  || 1;
    });
  });
  const topSvcs = Object.values(svcRev).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  const maxSvcRev = Math.max(...topSvcs.map((s) => s.revenue), 1);
  document.getElementById('sales-top-services').innerHTML = topSvcs.map((s, i) =>
    `<div class="bar-row">
      <div class="bar-label-left rank-label"><span class="rank">${i + 1}</span>${s.title}</div>
      <div class="bar-track"><div class="bar-fill confirmed" style="width:${Math.round((s.revenue / maxSvcRev) * 100)}%"></div></div>
      <div class="bar-val">₹${s.revenue.toLocaleString('en-IN')}<span style="color:var(--color-text-muted);font-size:0.72rem"> ×${s.count}</span></div>
    </div>`
  ).join('') || '<p class="empty-msg">No bookings yet</p>';

  // Daily bookings last 14 days
  const daily = {};
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    daily[d.toISOString().split('T')[0]] = 0;
  }
  active.forEach((o) => {
    const date = o.appointment?.date;
    if (date && daily[date] !== undefined) daily[date]++;
  });
  const maxDaily = Math.max(...Object.values(daily), 1);
  document.getElementById('sales-daily').innerHTML =
    `<div class="daily-chart">` +
    Object.entries(daily).map(([date, n]) => {
      const d    = new Date(date);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      const h    = Math.round((n / maxDaily) * 100);
      return `<div class="daily-col">
        <div class="daily-val">${n || ''}</div>
        <div class="daily-bar-wrap"><div class="daily-bar" style="height:${h}%"></div></div>
        <div class="daily-label">${label}</div>
      </div>`;
    }).join('') +
    `</div>`;
}

/* ================================================================
   INVENTORY REPORT
   ================================================================ */
function renderInventoryReport(orders, services) {
  // Compute booking count per serviceId from orders
  const bookingMap = {};
  orders.filter((o) => o.status !== 'cancelled').forEach((o) => {
    (o.items || []).forEach((item) => {
      const id = item.serviceId;
      if (!bookingMap[id]) bookingMap[id] = { count: 0, revenue: 0 };
      bookingMap[id].count   += item.quantity  || 1;
      bookingMap[id].revenue += item.lineTotal || 0;
    });
  });

  // Category chart
  const catCount = {};
  services.forEach((s) => { catCount[s.category] = (catCount[s.category] || 0) + 1; });
  const maxCat = Math.max(...Object.values(catCount), 1);
  document.getElementById('inv-category-chart').innerHTML =
    Object.entries(catCount).sort((a, b) => b[1] - a[1])
      .map(([cat, n]) => barRow(cat, n, maxCat, `${n} services`)).join('');

  // Gender chart
  const genderCount = { women: 0, men: 0 };
  services.forEach((s) => { genderCount[s.gender] = (genderCount[s.gender] || 0) + 1; });
  const maxG = Math.max(...Object.values(genderCount), 1);
  document.getElementById('inv-gender-chart').innerHTML =
    Object.entries(genderCount).map(([g, n]) => barRow(g, n, maxG, `${n} services`)).join('');

  renderInventoryTable(services, bookingMap, 'all');

  document.getElementById('inv-gender-filter').addEventListener('change', (e) => {
    renderInventoryTable(services, bookingMap, e.target.value);
  });
}

function renderInventoryTable(services, bookingMap, genderFilter) {
  const tbody = document.getElementById('inv-tbody');
  const filtered = genderFilter === 'all' ? services : services.filter((s) => s.gender === genderFilter);
  const sorted   = [...filtered].sort((a, b) => {
    const bA = bookingMap[a.serviceId]?.count || 0;
    const bB = bookingMap[b.serviceId]?.count || 0;
    return bB - bA;
  });

  if (!sorted.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="table-empty"><p>No services found. Run seed.js first.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = sorted.map((svc) => {
    const stats    = bookingMap[svc.serviceId] || { count: 0, revenue: 0 };
    const discount = svc.originalPrice > svc.price
      ? Math.round(((svc.originalPrice - svc.price) / svc.originalPrice) * 100)
      : 0;
    const genderPill = svc.gender === 'women'
      ? `<span class="gender-pill women">Women</span>`
      : `<span class="gender-pill men">Men</span>`;

    return `
      <tr>
        <td style="font-weight:600;font-size:0.85rem">${svc.title}</td>
        <td><span class="service-tag">${svc.category}</span></td>
        <td>${genderPill}</td>
        <td style="font-weight:600">₹${svc.price.toLocaleString('en-IN')}</td>
        <td>${discount > 0 ? `<span class="discount-pill">${discount}% off</span>` : '—'}</td>
        <td style="font-weight:700;color:var(--color-accent-primary)">${stats.count}</td>
        <td style="font-weight:700;color:var(--color-gold)">₹${stats.revenue.toLocaleString('en-IN')}</td>
      </tr>`;
  }).join('');
}

/* ================================================================
   STAFF REPORT
   ================================================================ */
function renderStaffReport(orders) {
  const active = orders.filter((o) => o.status !== 'cancelled');

  // Time slot popularity
  const slots = {};
  active.forEach((o) => {
    const slot = o.appointment?.timeSlot;
    if (slot) slots[slot] = (slots[slot] || 0) + 1;
  });
  const maxSlot = Math.max(...Object.values(slots), 1);
  document.getElementById('staff-slots').innerHTML =
    Object.entries(slots).sort((a, b) => b[1] - a[1])
      .map(([slot, n]) => barRow(slot, n, maxSlot, `${n} bookings`)).join('')
    || '<p class="empty-msg">No booking data yet</p>';

  // Day of week
  const DOW_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayNames  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dow       = Object.fromEntries(DOW_ORDER.map((d) => [d, 0]));
  active.forEach((o) => {
    const date = o.appointment?.date;
    if (!date) return;
    const d = new Date(date);
    dow[dayNames[d.getDay()]]++;
  });
  const maxDow = Math.max(...Object.values(dow), 1);
  document.getElementById('staff-dow').innerHTML =
    DOW_ORDER.map((day) => barRow(day, dow[day], maxDow, `${dow[day]} bookings`)).join('');

  // Upcoming 7 days
  const today   = new Date();
  const in7days = new Date(today);
  in7days.setDate(today.getDate() + 7);
  const upcoming = orders
    .filter((o) => {
      if (o.status !== 'confirmed') return false;
      const d = new Date(o.appointment?.date);
      return d >= today && d <= in7days;
    })
    .sort((a, b) => {
      const da = new Date(a.appointment?.date);
      const db = new Date(b.appointment?.date);
      return da - db;
    });

  const upcomingEl = document.getElementById('staff-upcoming');
  if (!upcoming.length) {
    upcomingEl.innerHTML = '<p class="empty-msg">No upcoming appointments in next 7 days</p>';
    return;
  }

  upcomingEl.innerHTML = `
    <div class="upcoming-list">
      ${upcoming.map((o) => {
        const appt     = o.appointment || {};
        const customer = o.customer    || {};
        const services = (o.items || []).map((i) => i.title).join(', ');
        return `
          <div class="upcoming-item">
            <div class="upcoming-date-block">
              <span class="upcoming-date">${appt.date || '—'}</span>
              <span class="upcoming-slot">${appt.timeSlot || '—'}</span>
            </div>
            <div class="upcoming-details">
              <div class="upcoming-customer">${customer.name || '—'} · ${customer.phone || ''}</div>
              <div class="upcoming-services">${services || '—'}</div>
              <div class="upcoming-address">${customer.address || ''}</div>
            </div>
            <div class="upcoming-amount">₹${(o.total || 0).toLocaleString('en-IN')}</div>
          </div>`;
      }).join('')}
    </div>`;
}

/* ================================================================
   CHART HELPERS
   ================================================================ */
function barRow(label, value, max, displayVal) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return `
    <div class="bar-row">
      <div class="bar-label-left">${label}</div>
      <div class="bar-track"><div class="bar-fill confirmed" style="width:${pct}%"></div></div>
      <div class="bar-val">${displayVal}</div>
    </div>`;
}

/* ================================================================
   TOAST
   ================================================================ */
function showToast(msg) {
  const t = document.getElementById('admin-toast');
  t.textContent = msg;
  t.classList.add('visible');
  setTimeout(() => t.classList.remove('visible'), 3000);
}
