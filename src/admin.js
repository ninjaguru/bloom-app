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
  addDoc,
  updateDoc,
  deleteDoc,
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
let allProducts = [];

async function loadAllData() {
  try {
    const [ordersSnap, servicesSnap, productsSnap] = await Promise.all([
      getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'))),
      getDocs(collection(db, 'services')),
      getDocs(collection(db, 'products')),
    ]);

    allOrders   = ordersSnap.docs.map((d)  => ({ id: d.id, ...d.data() }));
    allServices = servicesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    allProducts = productsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    renderKPIs(allOrders);
    renderBookingsTable(allOrders);
    renderSalesReport(allOrders);
    renderInventoryReport(allOrders, allServices);
    renderProductsTab(allProducts);
    renderStaffReport(allOrders);
    renderReportsTab(allOrders);
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
  const bookingMap = {};
  orders.filter((o) => o.status !== 'cancelled').forEach((o) => {
    (o.items || []).forEach((item) => {
      const id = item.serviceId;
      if (!bookingMap[id]) bookingMap[id] = { count: 0, revenue: 0 };
      bookingMap[id].count   += item.quantity  || 1;
      bookingMap[id].revenue += item.lineTotal || 0;
    });
  });

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
        <td><button class="action-btn edit-svc-btn" data-doc-id="${svc.id}">✎ Edit</button></td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('.edit-svc-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const svc = allServices.find((s) => s.id === btn.dataset.docId);
      if (svc) openServiceEditModal(svc);
    });
  });
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
   SERVICE CRUD MODAL
   ================================================================ */
let _editingDocId = null; // null = add mode, string = edit mode

function getFormData() {
  return {
    title:           document.getElementById('svc-title').value.trim(),
    price:           parseInt(document.getElementById('svc-price').value, 10)          || 0,
    originalPrice:   parseInt(document.getElementById('svc-original-price').value, 10) || 0,
    category:        document.getElementById('svc-category').value.trim(),
    gender:          document.getElementById('svc-gender').value,
    durationMinutes: parseInt(document.getElementById('svc-duration').value, 10)       || 0,
    rating:          parseFloat(document.getElementById('svc-rating').value)           || 4.8,
    imageUrl:        document.getElementById('svc-image').value.trim(),
  };
}

function openServiceEditModal(svc) {
  _editingDocId = svc.id;
  document.getElementById('svc-modal-title').textContent  = 'Edit Service';
  document.getElementById('svc-title').value              = svc.title          || '';
  document.getElementById('svc-price').value              = svc.price          || 0;
  document.getElementById('svc-original-price').value     = svc.originalPrice  || 0;
  document.getElementById('svc-category').value           = svc.category       || '';
  document.getElementById('svc-gender').value             = svc.gender         || 'women';
  document.getElementById('svc-duration').value           = svc.durationMinutes || 0;
  document.getElementById('svc-rating').value             = svc.rating          || 4.8;
  document.getElementById('svc-image').value              = svc.imageUrl        || '';
  document.getElementById('svc-error').textContent        = '';
  document.getElementById('svc-delete').style.display     = 'inline-flex';
  document.getElementById('svc-save').textContent         = 'Save Changes';
  document.getElementById('svc-overlay').classList.add('open');
}

function openServiceAddModal() {
  _editingDocId = null;
  document.getElementById('svc-modal-title').textContent  = 'Add New Service';
  document.getElementById('svc-title').value              = '';
  document.getElementById('svc-price').value              = '';
  document.getElementById('svc-original-price').value     = '';
  document.getElementById('svc-category').value           = '';
  document.getElementById('svc-gender').value             = 'women';
  document.getElementById('svc-duration').value           = '';
  document.getElementById('svc-rating').value             = '4.8';
  document.getElementById('svc-image').value              = '';
  document.getElementById('svc-error').textContent        = '';
  document.getElementById('svc-delete').style.display     = 'none';
  document.getElementById('svc-save').textContent         = 'Add Service';
  document.getElementById('svc-overlay').classList.add('open');
}

function closeServiceModal() {
  document.getElementById('svc-overlay').classList.remove('open');
  _editingDocId = null;
}

document.getElementById('add-svc-btn').addEventListener('click', openServiceAddModal);
document.getElementById('svc-close').addEventListener('click', closeServiceModal);
document.getElementById('svc-cancel').addEventListener('click', closeServiceModal);
document.getElementById('svc-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('svc-overlay')) closeServiceModal();
});

document.getElementById('svc-save').addEventListener('click', async () => {
  const data    = getFormData();
  const errorEl = document.getElementById('svc-error');
  const saveBtn = document.getElementById('svc-save');

  if (!data.title)    { errorEl.textContent = 'Title is required.'; return; }
  if (data.price < 0) { errorEl.textContent = 'Enter a valid price.'; return; }
  if (data.originalPrice > 0 && data.originalPrice < data.price) {
    errorEl.textContent = 'Original price must be ≥ sale price.'; return;
  }

  saveBtn.disabled = true;
  const origText   = saveBtn.textContent;
  saveBtn.textContent = 'Saving…';
  errorEl.textContent = '';

  try {
    if (_editingDocId) {
      // UPDATE
      await updateDoc(doc(db, 'services', _editingDocId), data);
      const idx = allServices.findIndex((s) => s.id === _editingDocId);
      if (idx !== -1) Object.assign(allServices[idx], data);
      showToast('Service updated');
    } else {
      // CREATE
      const serviceId = `svc-${Date.now()}`;
      const newSvc    = { ...data, serviceId, reviewCount: 0, ritualSteps: [], procedureSteps: [] };
      const ref       = await addDoc(collection(db, 'services'), newSvc);
      allServices.push({ id: ref.id, ...newSvc });
      showToast('Service added');
    }
    closeServiceModal();
    renderInventoryReport(allOrders, allServices);
  } catch (err) {
    console.error(err);
    errorEl.textContent = 'Operation failed. Check Firestore permissions.';
  } finally {
    saveBtn.disabled    = false;
    saveBtn.textContent = origText;
  }
});

document.getElementById('svc-delete').addEventListener('click', async () => {
  if (!_editingDocId) return;
  const svc = allServices.find((s) => s.id === _editingDocId);
  if (!confirm(`Delete "${svc?.title}"? This cannot be undone.`)) return;

  const deleteBtn = document.getElementById('svc-delete');
  deleteBtn.disabled    = true;
  deleteBtn.textContent = 'Deleting…';

  try {
    await deleteDoc(doc(db, 'services', _editingDocId));
    allServices = allServices.filter((s) => s.id !== _editingDocId);
    closeServiceModal();
    renderInventoryReport(allOrders, allServices);
    showToast('Service deleted');
  } catch (err) {
    console.error(err);
    document.getElementById('svc-error').textContent = 'Delete failed. Check Firestore permissions.';
    deleteBtn.disabled    = false;
    deleteBtn.textContent = '🗑 Delete';
  }
});

/* ================================================================
   REPORTS TAB
   ================================================================ */
function renderReportsTab(orders) {
  const active    = orders.filter((o) => o.status !== 'cancelled');
  const completed = orders.filter((o) => o.status === 'completed');
  const cancelled = orders.filter((o) => o.status === 'cancelled');
  const total     = orders.length || 1;
  const revenue   = active.reduce((s, o) => s + (o.total || 0), 0);
  const aov       = active.length ? Math.round(revenue / active.length) : 0;

  // ── Revenue KPIs ──
  document.getElementById('rpt-revenue').textContent    = `₹${revenue.toLocaleString('en-IN')}`;
  document.getElementById('rpt-aov').textContent        = `₹${aov.toLocaleString('en-IN')}`;
  document.getElementById('rpt-completion').textContent = `${Math.round((completed.length / total) * 100)}%`;
  document.getElementById('rpt-cancel').textContent     = `${Math.round((cancelled.length / total) * 100)}%`;

  // ── Daily Revenue (14 days) ──
  const daily = {};
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    daily[d.toISOString().split('T')[0]] = 0;
  }
  active.forEach((o) => {
    const date = o.appointment?.date;
    if (date && daily[date] !== undefined) daily[date] += (o.total || 0);
  });
  const maxDaily = Math.max(...Object.values(daily), 1);
  document.getElementById('rpt-daily-revenue').innerHTML =
    `<div class="daily-chart">` +
    Object.entries(daily).map(([date, rev]) => {
      const d = new Date(date);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      const h = Math.round((rev / maxDaily) * 100);
      return `<div class="daily-col">
        <div class="daily-val">${rev ? '₹' + Math.round(rev / 1000) + 'k' : ''}</div>
        <div class="daily-bar-wrap"><div class="daily-bar" style="height:${h}%"></div></div>
        <div class="daily-label">${label}</div>
      </div>`;
    }).join('') + `</div>`;

  // ── Booking Status ──
  const counts = { confirmed: 0, completed: 0, cancelled: 0 };
  orders.forEach((o) => { const s = o.status || 'confirmed'; counts[s] = (counts[s] || 0) + 1; });
  document.getElementById('rpt-status').innerHTML =
    Object.entries(counts).map(([s, n]) => `
      <div class="bar-row">
        <div class="bar-label-left"><span class="status-badge status-${s}">${s}</span></div>
        <div class="bar-track"><div class="bar-fill ${s}" style="width:${Math.round((n / total) * 100)}%"></div></div>
        <div class="bar-val">${n} <span style="font-size:0.72rem;color:var(--color-text-muted)">(${Math.round((n/total)*100)}%)</span></div>
      </div>`).join('') || '<p class="empty-msg">No data</p>';

  // ── Day of Week ──
  const DOW_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayNames  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dow = Object.fromEntries(DOW_ORDER.map((d) => [d, 0]));
  active.forEach((o) => {
    const d = o.appointment?.date;
    if (d) dow[dayNames[new Date(d).getDay()]]++;
  });
  const maxDow = Math.max(...Object.values(dow), 1);
  document.getElementById('rpt-dow').innerHTML =
    DOW_ORDER.map((day) => barRow(day, dow[day], maxDow, `${dow[day]}`)).join('');

  // ── Time Slots ──
  const slots = {};
  active.forEach((o) => {
    const slot = o.appointment?.timeSlot;
    if (slot) slots[slot] = (slots[slot] || 0) + 1;
  });
  const maxSlot = Math.max(...Object.values(slots), 1);
  document.getElementById('rpt-slots').innerHTML =
    Object.entries(slots).sort((a, b) => b[1] - a[1])
      .map(([slot, n]) => barRow(slot, n, maxSlot, `${n} bookings`)).join('')
    || '<p class="empty-msg">No booking data yet</p>';

  // ── Service aggregation ──
  const svcMap = {};
  active.forEach((o) => {
    (o.items || []).forEach((item) => {
      const key = item.serviceId || item.title;
      if (!svcMap[key]) svcMap[key] = { title: item.title, revenue: 0, count: 0 };
      svcMap[key].revenue += item.lineTotal || 0;
      svcMap[key].count   += item.quantity  || 1;
    });
  });
  const svcs = Object.values(svcMap);

  // Top by revenue
  const topRev = [...svcs].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  const maxRev = Math.max(...topRev.map((s) => s.revenue), 1);
  document.getElementById('rpt-top-revenue').innerHTML = topRev.map((s, i) =>
    `<div class="bar-row">
      <div class="bar-label-left rank-label"><span class="rank">${i + 1}</span>${s.title}</div>
      <div class="bar-track"><div class="bar-fill confirmed" style="width:${Math.round((s.revenue/maxRev)*100)}%"></div></div>
      <div class="bar-val">₹${s.revenue.toLocaleString('en-IN')}</div>
    </div>`).join('') || '<p class="empty-msg">No data yet</p>';

  // Top by bookings
  const topCount = [...svcs].sort((a, b) => b.count - a.count).slice(0, 8);
  const maxCount = Math.max(...topCount.map((s) => s.count), 1);
  document.getElementById('rpt-top-count').innerHTML = topCount.map((s, i) =>
    `<div class="bar-row">
      <div class="bar-label-left rank-label"><span class="rank">${i + 1}</span>${s.title}</div>
      <div class="bar-track"><div class="bar-fill completed" style="width:${Math.round((s.count/maxCount)*100)}%"></div></div>
      <div class="bar-val">${s.count}×</div>
    </div>`).join('') || '<p class="empty-msg">No data yet</p>';

  // Revenue by category
  const catRev = {};
  active.forEach((o) => {
    (o.items || []).forEach((item) => {
      const cat = item.category || 'Other';
      catRev[cat] = (catRev[cat] || 0) + (item.lineTotal || 0);
    });
  });
  const maxCat = Math.max(...Object.values(catRev), 1);
  document.getElementById('rpt-category').innerHTML =
    Object.entries(catRev).sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([cat, rev]) => barRow(cat, rev, maxCat, `₹${rev.toLocaleString('en-IN')}`)).join('')
    || '<p class="empty-msg">No data yet</p>';

  // ── Top Customers ──
  const custMap = {};
  active.forEach((o) => {
    const name  = o.customer?.name  || 'Unknown';
    const phone = o.customer?.phone || '';
    const key   = phone || name;
    if (!custMap[key]) custMap[key] = { name, phone, spend: 0, orders: 0 };
    custMap[key].spend  += o.total || 0;
    custMap[key].orders += 1;
  });
  const topCusts = Object.values(custMap).sort((a, b) => b.spend - a.spend).slice(0, 8);
  document.getElementById('rpt-top-customers').innerHTML = topCusts.length
    ? `<table style="width:100%;font-size:0.83rem;border-collapse:collapse">
        <thead><tr style="color:var(--color-text-muted);font-size:0.75rem;text-transform:uppercase">
          <th style="text-align:left;padding:6px 0">#</th>
          <th style="text-align:left;padding:6px 0">Name</th>
          <th style="text-align:left;padding:6px 0">Phone</th>
          <th style="text-align:right;padding:6px 0">Orders</th>
          <th style="text-align:right;padding:6px 0">Spend</th>
        </tr></thead>
        <tbody>${topCusts.map((c, i) => `
          <tr style="border-top:1px solid var(--color-border)">
            <td style="padding:8px 0;color:var(--color-accent-primary);font-weight:700">${i + 1}</td>
            <td style="padding:8px 4px;font-weight:600">${c.name}</td>
            <td style="padding:8px 4px;color:var(--color-text-muted)">${c.phone}</td>
            <td style="padding:8px 0;text-align:right">${c.orders}</td>
            <td style="padding:8px 0;text-align:right;font-weight:700;color:var(--color-gold)">₹${c.spend.toLocaleString('en-IN')}</td>
          </tr>`).join('')}
        </tbody></table>`
    : '<p class="empty-msg">No data yet</p>';

  // ── Order Size Distribution ──
  const buckets = { '₹0–500': 0, '₹500–1k': 0, '₹1k–2k': 0, '₹2k–5k': 0, '₹5k+': 0 };
  active.forEach((o) => {
    const t = o.total || 0;
    if      (t < 500)  buckets['₹0–500']++;
    else if (t < 1000) buckets['₹500–1k']++;
    else if (t < 2000) buckets['₹1k–2k']++;
    else if (t < 5000) buckets['₹2k–5k']++;
    else               buckets['₹5k+']++;
  });
  const maxBkt = Math.max(...Object.values(buckets), 1);
  document.getElementById('rpt-order-size').innerHTML =
    Object.entries(buckets).map(([label, n]) => barRow(label, n, maxBkt, `${n} orders`)).join('');
}

/* ================================================================
   INVENTORY / PRODUCTS TAB
   ================================================================ */
function renderProductsTab(products) {
  const total      = products.length;
  const lowStock   = products.filter((p) => (p.stockQty || 0) <= (p.reorderLevel || 0)).length;
  const stockValue = products.reduce((s, p) => s + (p.stockQty || 0) * (p.costPrice || 0), 0);

  document.getElementById('inv-stat-total').textContent = total;
  document.getElementById('inv-stat-low').textContent   = lowStock;
  document.getElementById('inv-stat-value').textContent = `₹${stockValue.toLocaleString('en-IN')}`;

  const tbody = document.getElementById('inv-prod-tbody');
  if (!products.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="table-empty"><p>No products. Add your first product.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = products
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    .map((p) => {
      const isLow    = (p.stockQty || 0) <= (p.reorderLevel || 0);
      const statusBadge = isLow
        ? `<span class="status-badge status-cancelled">Low Stock</span>`
        : `<span class="status-badge status-completed">OK</span>`;
      return `
        <tr>
          <td style="font-weight:600;font-size:0.85rem">${p.name || '—'}</td>
          <td>${p.brand || '—'}</td>
          <td><span class="service-tag">${p.category || '—'}</span></td>
          <td style="font-weight:700">${p.stockQty ?? '—'}</td>
          <td style="color:var(--color-text-muted)">${p.unit || '—'}</td>
          <td>₹${(p.costPrice || 0).toLocaleString('en-IN')}</td>
          <td>${statusBadge}</td>
          <td><button class="action-btn edit-svc-btn prod-edit-btn" data-prod-id="${p.id}">✎ Edit</button></td>
        </tr>`;
    }).join('');

  tbody.querySelectorAll('.prod-edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const prod = allProducts.find((p) => p.id === btn.dataset.prodId);
      if (prod) openProductModal(prod);
    });
  });
}

/* ================================================================
   PRODUCT MODAL CRUD
   ================================================================ */
let _editingProdId = null;

function openProductModal(prod) {
  _editingProdId = prod ? prod.id : null;
  const isEdit   = !!prod;

  document.getElementById('prod-modal-title').textContent = isEdit ? 'Edit Product' : 'Add Product';
  document.getElementById('prod-name').value     = prod?.name      || '';
  document.getElementById('prod-brand').value    = prod?.brand     || '';
  document.getElementById('prod-category').value = prod?.category  || '';
  document.getElementById('prod-stock').value    = prod?.stockQty  ?? '';
  document.getElementById('prod-unit').value     = prod?.unit      || 'pieces';
  document.getElementById('prod-price').value    = prod?.costPrice ?? '';
  document.getElementById('prod-reorder').value  = prod?.reorderLevel ?? '';
  document.getElementById('prod-error').textContent = '';
  document.getElementById('prod-delete').style.display = isEdit ? 'inline-flex' : 'none';
  document.getElementById('prod-save').textContent     = isEdit ? 'Save Changes' : 'Add Product';
  document.getElementById('prod-overlay').classList.add('open');
}

function closeProdModal() {
  document.getElementById('prod-overlay').classList.remove('open');
  _editingProdId = null;
}

document.getElementById('add-prod-btn').addEventListener('click', () => openProductModal(null));
document.getElementById('prod-close').addEventListener('click', closeProdModal);
document.getElementById('prod-cancel').addEventListener('click', closeProdModal);
document.getElementById('prod-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('prod-overlay')) closeProdModal();
});

document.getElementById('prod-save').addEventListener('click', async () => {
  const name       = document.getElementById('prod-name').value.trim();
  const brand      = document.getElementById('prod-brand').value.trim();
  const category   = document.getElementById('prod-category').value.trim();
  const stockQty   = parseInt(document.getElementById('prod-stock').value,   10);
  const unit       = document.getElementById('prod-unit').value;
  const costPrice  = parseFloat(document.getElementById('prod-price').value);
  const reorderLevel = parseInt(document.getElementById('prod-reorder').value, 10) || 0;
  const errorEl    = document.getElementById('prod-error');
  const saveBtn    = document.getElementById('prod-save');

  if (!name) { errorEl.textContent = 'Product name is required.'; return; }
  if (isNaN(stockQty) || stockQty < 0) { errorEl.textContent = 'Enter valid stock quantity.'; return; }

  saveBtn.disabled    = true;
  const origText      = saveBtn.textContent;
  saveBtn.textContent = 'Saving…';
  errorEl.textContent = '';

  const data = { name, brand, category, stockQty, unit, costPrice: costPrice || 0, reorderLevel };

  try {
    if (_editingProdId) {
      await updateDoc(doc(db, 'products', _editingProdId), data);
      const idx = allProducts.findIndex((p) => p.id === _editingProdId);
      if (idx !== -1) Object.assign(allProducts[idx], data);
      showToast('Product updated');
    } else {
      const ref = await addDoc(collection(db, 'products'), data);
      allProducts.push({ id: ref.id, ...data });
      showToast('Product added');
    }
    closeProdModal();
    renderProductsTab(allProducts);
  } catch (err) {
    console.error(err);
    errorEl.textContent = 'Operation failed. Check Firestore permissions.';
  } finally {
    saveBtn.disabled    = false;
    saveBtn.textContent = origText;
  }
});

document.getElementById('prod-delete').addEventListener('click', async () => {
  if (!_editingProdId) return;
  const prod = allProducts.find((p) => p.id === _editingProdId);
  if (!confirm(`Delete "${prod?.name}"? This cannot be undone.`)) return;

  const btn = document.getElementById('prod-delete');
  btn.disabled    = true;
  btn.textContent = 'Deleting…';

  try {
    await deleteDoc(doc(db, 'products', _editingProdId));
    allProducts = allProducts.filter((p) => p.id !== _editingProdId);
    closeProdModal();
    renderProductsTab(allProducts);
    showToast('Product deleted');
  } catch (err) {
    console.error(err);
    document.getElementById('prod-error').textContent = 'Delete failed.';
    btn.disabled    = false;
    btn.textContent = '🗑 Delete';
  }
});

/* ================================================================
   TOAST
   ================================================================ */
function showToast(msg) {
  const t = document.getElementById('admin-toast');
  t.textContent = msg;
  t.classList.add('visible');
  setTimeout(() => t.classList.remove('visible'), 3000);
}
