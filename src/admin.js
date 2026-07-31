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
  where,
  Timestamp,
  serverTimestamp,
  writeBatch,
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
let allOrders    = [];
let allServices  = [];
let allProducts  = [];
let allSlots     = [];
let allCoupons   = [];
let allSocieties = [];
let allStylists  = [];
let allBundles   = [];
let allPlans     = [];

async function loadAllData() {
  try {
    const [ordersSnap, servicesSnap, productsSnap, slotsSnap, couponsSnap, societiesSnap, stylistsSnap, bundlesSnap, plansSnap] = await Promise.all([
      getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'))),
      getDocs(collection(db, 'services')),
      getDocs(collection(db, 'products')),
      getDocs(query(collection(db, 'slots'), orderBy('order', 'asc'))),
      getDocs(collection(db, 'coupons')),
      getDocs(query(collection(db, 'societies'), orderBy('name', 'asc'))),
      getDocs(collection(db, 'stylists')),
      getDocs(collection(db, 'bundles')),
      getDocs(collection(db, 'subscriptionPlans')),
    ]);

    allOrders    = ordersSnap.docs.map((d)    => ({ id: d.id, ...d.data() }));
    allServices  = servicesSnap.docs.map((d)  => ({ id: d.id, ...d.data() }));
    allProducts  = productsSnap.docs.map((d)  => ({ id: d.id, ...d.data() }));
    allSlots     = slotsSnap.docs.map((d)     => ({ id: d.id, ...d.data() }));
    allCoupons   = couponsSnap.docs.map((d)   => ({ id: d.id, ...d.data() }));
    allSocieties = societiesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    allStylists  = stylistsSnap.docs.map((d)  => ({ id: d.id, ...d.data() }));
    allBundles   = bundlesSnap.docs.map((d)   => ({ id: d.id, ...d.data() }));
    allPlans     = plansSnap.docs.map((d)     => ({ id: d.id, ...d.data() }));

    renderKPIs(allOrders);
    renderBookingsTable(allOrders, allStylists);
    renderSalesReport(allOrders);
    renderInventoryReport(allOrders, allServices);
    renderProductsTab(allProducts);
    renderStaffReport(allOrders);
    renderReportsTab(allOrders);
    renderSlotsTab(allSlots);
    renderDiscountsTab(allCoupons);
    renderBundlesTab(allBundles);
    renderApartmentsTab(allSocieties);
    renderStaffMgmtTab(allStylists);
    renderPlansTab(allPlans);
    renderBroadcastTab();
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
function renderBookingsTable(orders, stylists) {
  const tbody = document.getElementById('orders-tbody');

  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="table-empty"><p>No bookings yet.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map((order) => {
    const appt      = order.appointment || {};
    const customer  = order.customer    || {};
    const items     = order.items       || [];
    const ACTIVE_STATUSES = ['confirmed', 'assigned', 'en_route', 'in_progress', 'rescheduled'];
    const STATUS_LABELS   = {
      confirmed: 'Confirmed', assigned: 'Assigned', en_route: 'On the Way',
      in_progress: 'In Progress', completed: 'Completed',
      cancelled: 'Cancelled', rescheduled: 'Rescheduled', no_show: 'No Show',
    };
    const STATUS_CSS = {
      confirmed: 'status-confirmed', assigned: 'status-confirmed',
      en_route: 'status-confirmed', in_progress: 'status-confirmed',
      rescheduled: 'status-confirmed', completed: 'status-completed',
      cancelled: 'status-cancelled', no_show: 'status-cancelled',
    };
    const isPending = ACTIVE_STATUSES.includes(order.status || 'confirmed');
    const statusCls = STATUS_CSS[order.status] || 'status-confirmed';
    const statusLabel = STATUS_LABELS[order.status] || order.status || 'confirmed';

    const tags = items.map((i) =>
      `<span class="service-tag">${(i.title || '').split(' ').slice(0, 3).join(' ')}…</span>`
    ).join('');

    const createdDate = order.createdAt?.toDate
      ? order.createdAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';

    const assignedStylist = stylists?.find((s) => s.id === order.stylistId);
    const staffName = order.stylistName
      ? `<span style="font-weight:600;font-size:0.82rem;color:var(--color-accent-primary)">${order.stylistName}</span>`
      : `<span style="font-size:0.75rem;color:var(--color-text-muted)">Unassigned</span>`;
    const payout = calcOrderPayout(order, assignedStylist);
    const payoutCell = payout !== null
      ? `<span style="font-weight:700;color:var(--color-gold)">₹${payout.toLocaleString('en-IN')}</span>
         <span style="font-size:0.7rem;color:var(--color-text-muted);display:block">${Math.round((order.items||[]).reduce((s,i)=>s+(i.durationMinutes||60)*(i.quantity||1),0))} min</span>`
      : `<span style="color:var(--color-text-muted);font-size:0.75rem">—</span>`;

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
        <td>
          ${staffName}
          <button class="action-btn assign-btn" style="margin-top:4px;display:block" data-id="${order.id}" data-name="${customer.name || ''}" data-date="${appt.date || ''}" data-slot="${appt.timeSlot || ''}">Assign</button>
        </td>
        <td>${payoutCell}</td>
        <td><span class="status-badge ${statusCls}">${statusLabel}</span></td>
        <td>
          <select class="admin-select status-select" data-id="${order.id}" style="font-size:0.78rem;padding:5px 8px;">
            <option value="confirmed"   ${(order.status||'confirmed')==='confirmed'   ? 'selected':''}>Confirmed</option>
            <option value="assigned"    ${order.status==='assigned'    ? 'selected':''}>Assigned</option>
            <option value="en_route"    ${order.status==='en_route'    ? 'selected':''}>On the Way</option>
            <option value="in_progress" ${order.status==='in_progress' ? 'selected':''}>In Progress</option>
            <option value="rescheduled" ${order.status==='rescheduled' ? 'selected':''}>Rescheduled</option>
            <option value="completed"   ${order.status==='completed'   ? 'selected':''}>Completed</option>
            <option value="cancelled"   ${order.status==='cancelled'   ? 'selected':''}>Cancelled</option>
            <option value="no_show"     ${order.status==='no_show'     ? 'selected':''}>No Show</option>
          </select>
        </td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('.status-select').forEach((sel) => {
    sel.addEventListener('change', () => updateOrderStatus(sel.dataset.id, sel.value));
  });

  tbody.querySelectorAll('.assign-btn').forEach((btn) => {
    btn.addEventListener('click', () => openAssignModal(btn.dataset.id, btn.dataset.name, btn.dataset.date, btn.dataset.slot));
  });
}

async function updateOrderStatus(orderId, newStatus) {
  const row  = document.querySelector(`tr[data-id="${orderId}"]`);
  row?.querySelectorAll('.action-btn').forEach((b) => { b.disabled = true; });

  try {
    await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    const order = allOrders.find((o) => o.id === orderId);
    if (order) order.status = newStatus;
    renderBookingsTable(allOrders, allStylists);
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
  renderBookingsTable(val === 'all' ? allOrders : allOrders.filter((o) => (o.status || 'confirmed') === val), allStylists);
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

/* ── Ritual Steps Tab State ─────────────────────────────────── */
let _ritualSteps = [];   // array of { title, description, durationMinutes, imageUrl }
let _activeStepIdx = 0;

function renderRitualTabs() {
  const tabBar   = document.getElementById('ritual-tab-bar');
  const editPane = document.getElementById('ritual-edit-pane');
  const empty    = document.getElementById('ritual-empty-hint');
  if (!tabBar || !editPane) return;

  /* Build tab pills */
  tabBar.innerHTML = '';
  _ritualSteps.forEach((step, idx) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.dataset.idx = idx;
    tab.className = 'ritual-tab-pill' + (idx === _activeStepIdx ? ' active' : '');
    tab.innerHTML = `<span class="ritual-tab-num">${idx + 1}</span>${step.title || 'Untitled'}<span class="ritual-tab-del" data-del="${idx}">✕</span>`;
    tab.addEventListener('click', (e) => {
      if (e.target.dataset.del !== undefined) {
        /* delete icon clicked */
        saveCurrentStepToState();
        _ritualSteps.splice(Number(e.target.dataset.del), 1);
        _activeStepIdx = Math.min(_activeStepIdx, Math.max(0, _ritualSteps.length - 1));
        renderRitualTabs();
      } else {
        saveCurrentStepToState();
        _activeStepIdx = idx;
        renderRitualTabs();
      }
    });
    tabBar.appendChild(tab);
  });

  /* Show/hide empty hint */
  if (empty) empty.style.display = _ritualSteps.length === 0 ? 'block' : 'none';

  /* Populate edit pane */
  editPane.style.display = _ritualSteps.length === 0 ? 'none' : 'block';
  if (_ritualSteps.length > 0) {
    const s = _ritualSteps[_activeStepIdx] || {};
    editPane.querySelector('#step-title').value       = s.title       || '';
    editPane.querySelector('#step-duration').value    = s.durationMinutes || '';
    editPane.querySelector('#step-img').value         = s.imageUrl    || '';
    editPane.querySelector('#step-desc').value        = s.description || '';
  }
}

function saveCurrentStepToState() {
  if (_ritualSteps.length === 0) return;
  const editPane = document.getElementById('ritual-edit-pane');
  if (!editPane) return;
  const s = _ritualSteps[_activeStepIdx];
  if (!s) return;
  s.title            = editPane.querySelector('#step-title').value.trim();
  s.durationMinutes  = parseInt(editPane.querySelector('#step-duration').value, 10) || 0;
  s.imageUrl         = editPane.querySelector('#step-img').value.trim();
  s.description      = editPane.querySelector('#step-desc').value.trim();
}

function populateRitualSteps(steps = []) {
  _ritualSteps   = steps.map((s) => ({ ...s }));
  _activeStepIdx = 0;
  renderRitualTabs();
}

function collectRitualSteps() {
  saveCurrentStepToState();
  return _ritualSteps.filter((s) => s.title);
}

/* Live tab title refresh as user types */
document.getElementById('step-title')?.addEventListener('input', (e) => {
  if (_ritualSteps[_activeStepIdx]) {
    _ritualSteps[_activeStepIdx].title = e.target.value.trim();
  }
  const tabBar = document.getElementById('ritual-tab-bar');
  const pill = tabBar?.querySelector(`[data-idx="${_activeStepIdx}"]`);
  if (pill) {
    const numSpan = pill.querySelector('.ritual-tab-num').outerHTML;
    const delSpan = pill.querySelector('.ritual-tab-del').outerHTML;
    pill.innerHTML = `${numSpan}${e.target.value.trim() || 'Untitled'}${delSpan}`;
  }
});

document.getElementById('add-ritual-step-btn')?.addEventListener('click', () => {
  saveCurrentStepToState();
  _ritualSteps.push({ title: '', description: '', durationMinutes: 0, imageUrl: '' });
  _activeStepIdx = _ritualSteps.length - 1;
  renderRitualTabs();
  /* Focus title input */
  setTimeout(() => document.getElementById('step-title')?.focus(), 50);
});

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
    ritualSteps:     collectRitualSteps(),
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
  populateRitualSteps(svc.ritualSteps || []);
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
  populateRitualSteps([]);
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
      const newSvc    = { ...data, serviceId, reviewCount: 0, procedureSteps: [] };
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
   BUNDLES TAB
   ================================================================ */
function renderBundlesTab(bundles) {
  const tbody = document.getElementById('bundles-tbody');
  if (!bundles.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="table-empty"><p>No bundles yet. Create your first package.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = bundles.map((b) => {
    const savings    = (b.originalPrice || 0) - (b.price || 0);
    const savingsPct = b.originalPrice ? Math.round((savings / b.originalPrice) * 100) : 0;
    const badge      = b.active !== false
      ? `<span class="status-badge status-completed">Active</span>`
      : `<span class="status-badge status-cancelled">Inactive</span>`;
    const genderPill = b.gender === 'men'
      ? `<span class="gender-pill men">Men</span>`
      : b.gender === 'both'
        ? `<span class="service-tag">Both</span>`
        : `<span class="gender-pill women">Women</span>`;
    const svcNames = (b.services || []).map((s) => `<span class="service-tag">${s.title?.split(' ').slice(0,3).join(' ')}…</span>`).join(' ');
    return `
      <tr>
        <td style="font-weight:700">${b.title || '—'}</td>
        <td style="max-width:200px">${svcNames || '—'}</td>
        <td style="font-weight:600">${b.totalDurationMinutes || 0} min</td>
        <td style="color:var(--color-text-muted);text-decoration:line-through">₹${(b.originalPrice || 0).toLocaleString('en-IN')}</td>
        <td style="font-weight:700;color:var(--color-gold)">₹${(b.price || 0).toLocaleString('en-IN')}</td>
        <td><span class="discount-pill">${savingsPct}% off</span></td>
        <td>${genderPill}</td>
        <td>${badge}</td>
        <td><button class="action-btn edit-svc-btn bundle-edit-btn" data-bundle-id="${b.id}">✎ Edit</button></td>
      </tr>`;
  }).join('');
  tbody.querySelectorAll('.bundle-edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const bundle = allBundles.find((b) => b.id === btn.dataset.bundleId);
      if (bundle) openBundleModal(bundle);
    });
  });
}

/* ================================================================
   BUNDLE CRUD MODAL
   ================================================================ */
let _editingBundleId = null;

function populateBundleServices(selectedIds = [], gender = 'women') {
  const wrap = document.getElementById('bundle-services-wrap');
  const filtered = gender === 'both' ? allServices : allServices.filter((s) => s.gender === gender || gender === 'both');

  if (!filtered.length) {
    wrap.innerHTML = '<p style="font-size:0.78rem;color:var(--color-text-muted)">No services found. Seed services first.</p>';
    return;
  }

  // Group by category
  const grouped = {};
  filtered.forEach((s) => {
    const cat = s.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  });

  wrap.innerHTML = Object.entries(grouped).map(([cat, svcs]) => `
    <div>
      <p style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.8px;color:var(--color-text-muted);margin:6px 0 4px;">${cat}</p>
      ${svcs.map((s) => {
        const sid = s.serviceId || s.id;
        return `
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.84rem;color:var(--color-text-secondary);padding:3px 0;">
          <input type="checkbox" class="bundle-svc-check" value="${sid}"
            data-price="${s.price || 0}" data-duration="${s.durationMinutes || 0}"
            data-title="${(s.title || '').replace(/"/g, '&quot;')}"
            ${selectedIds.includes(sid) ? 'checked' : ''}
            style="accent-color:var(--color-accent-primary);width:15px;height:15px;cursor:pointer;" />
          <span style="flex:1">${s.title}</span>
          <span style="color:var(--color-gold);font-size:0.78rem;font-weight:600">₹${s.price?.toLocaleString('en-IN')} · ${s.durationMinutes}min</span>
        </label>`;
      }).join('')}
    </div>`).join('');

  // Wire up auto-calculation
  wrap.querySelectorAll('.bundle-svc-check').forEach((cb) => {
    cb.addEventListener('change', recalcBundle);
  });
  recalcBundle();
}

function recalcBundle() {
  const checks   = document.querySelectorAll('.bundle-svc-check:checked');
  const totalMin = Array.from(checks).reduce((s, cb) => s + parseInt(cb.dataset.duration || 0), 0);
  const totalPx  = Array.from(checks).reduce((s, cb) => s + parseInt(cb.dataset.price    || 0), 0);

  document.getElementById('bundle-calc-duration').textContent = `${totalMin} min`;
  document.getElementById('bundle-calc-original').textContent = `₹${totalPx.toLocaleString('en-IN')}`;

  const currentPrice = parseInt(document.getElementById('bundle-price').value) || 0;
  const savings      = totalPx - currentPrice;
  document.getElementById('bundle-calc-savings').textContent  =
    savings > 0 ? `₹${savings.toLocaleString('en-IN')}` : '₹0';

  // Auto-set price if not yet set
  if (!document.getElementById('bundle-price').value) {
    document.getElementById('bundle-price').value = Math.round(totalPx * 0.85); // default 15% off
    recalcBundle();
  }
}

document.getElementById('bundle-price').addEventListener('input', () => {
  const checks  = document.querySelectorAll('.bundle-svc-check:checked');
  const totalPx = Array.from(checks).reduce((s, cb) => s + parseInt(cb.dataset.price || 0), 0);
  const price   = parseInt(document.getElementById('bundle-price').value) || 0;
  const savings = totalPx - price;
  document.getElementById('bundle-calc-savings').textContent = savings > 0 ? `₹${savings.toLocaleString('en-IN')}` : '₹0';
});

document.getElementById('bundle-gender').addEventListener('change', (e) => {
  const selected = Array.from(document.querySelectorAll('.bundle-svc-check:checked')).map((cb) => cb.value);
  populateBundleServices(selected, e.target.value);
});

function openBundleModal(bundle) {
  _editingBundleId = bundle ? bundle.id : null;
  const isEdit     = !!bundle;

  document.getElementById('bundle-modal-title').textContent = isEdit ? 'Edit Bundle' : 'Create Bundle';
  document.getElementById('bundle-title').value             = bundle?.title   || '';
  document.getElementById('bundle-gender').value            = bundle?.gender  || 'women';
  document.getElementById('bundle-active').value            = String(bundle?.active ?? true);
  document.getElementById('bundle-price').value             = bundle?.price   ?? '';
  document.getElementById('bundle-error').textContent       = '';
  document.getElementById('bundle-delete').style.display    = isEdit ? 'inline-flex' : 'none';
  document.getElementById('bundle-save').textContent        = isEdit ? 'Save Changes' : 'Create Bundle';

  const selectedIds = (bundle?.services || []).map((s) => s.serviceId || s.id);
  populateBundleServices(selectedIds, bundle?.gender || 'women');

  document.getElementById('bundle-overlay').classList.add('open');
}

function closeBundleModal() {
  document.getElementById('bundle-overlay').classList.remove('open');
  _editingBundleId = null;
}

document.getElementById('add-bundle-btn').addEventListener('click', () => openBundleModal(null));
document.getElementById('bundle-close').addEventListener('click', closeBundleModal);
document.getElementById('bundle-cancel').addEventListener('click', closeBundleModal);
document.getElementById('bundle-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('bundle-overlay')) closeBundleModal();
});

document.getElementById('bundle-save').addEventListener('click', async () => {
  const title   = document.getElementById('bundle-title').value.trim();
  const gender  = document.getElementById('bundle-gender').value;
  const active  = document.getElementById('bundle-active').value === 'true';
  const price   = parseInt(document.getElementById('bundle-price').value, 10);
  const errorEl = document.getElementById('bundle-error');
  const saveBtn = document.getElementById('bundle-save');

  const checks = Array.from(document.querySelectorAll('.bundle-svc-check:checked'));

  if (!title)           { errorEl.textContent = 'Bundle name is required.'; return; }
  if (checks.length < 2) { errorEl.textContent = 'Select at least 2 services.'; return; }
  if (isNaN(price) || price <= 0) { errorEl.textContent = 'Enter a valid bundle price.'; return; }

  const services = checks.map((cb) => ({
    serviceId:       cb.value,
    title:           cb.dataset.title,
    price:           parseInt(cb.dataset.price    || 0),
    durationMinutes: parseInt(cb.dataset.duration || 0),
  }));

  const totalDurationMinutes = services.reduce((s, sv) => s + sv.durationMinutes, 0);
  const originalPrice        = services.reduce((s, sv) => s + sv.price, 0);

  const data = { title, gender, active, price, originalPrice, totalDurationMinutes, services };

  saveBtn.disabled    = true;
  const origText      = saveBtn.textContent;
  saveBtn.textContent = 'Saving…';
  errorEl.textContent = '';

  try {
    if (_editingBundleId) {
      await updateDoc(doc(db, 'bundles', _editingBundleId), data);
      const idx = allBundles.findIndex((b) => b.id === _editingBundleId);
      if (idx !== -1) Object.assign(allBundles[idx], data);
      showToast('Bundle updated');
    } else {
      const ref = await addDoc(collection(db, 'bundles'), { ...data, createdAt: Timestamp.now() });
      allBundles.push({ id: ref.id, ...data });
      showToast('Bundle created');
    }
    closeBundleModal();
    renderBundlesTab(allBundles);
  } catch (err) {
    console.error(err);
    errorEl.textContent = 'Operation failed. Check Firestore permissions.';
  } finally {
    saveBtn.disabled    = false;
    saveBtn.textContent = origText;
  }
});

document.getElementById('bundle-delete').addEventListener('click', async () => {
  if (!_editingBundleId) return;
  const bundle = allBundles.find((b) => b.id === _editingBundleId);
  if (!confirm(`Delete "${bundle?.title}"? Cannot be undone.`)) return;
  const btn = document.getElementById('bundle-delete');
  btn.disabled = true; btn.textContent = 'Deleting…';
  try {
    await deleteDoc(doc(db, 'bundles', _editingBundleId));
    allBundles = allBundles.filter((b) => b.id !== _editingBundleId);
    closeBundleModal();
    renderBundlesTab(allBundles);
    showToast('Bundle deleted');
  } catch (err) {
    console.error(err);
    document.getElementById('bundle-error').textContent = 'Delete failed.';
    btn.disabled = false; btn.textContent = '🗑 Delete';
  }
});

/* ================================================================
   APARTMENTS TAB
   ================================================================ */
function renderApartmentsTab(societies) {
  const tbody = document.getElementById('apt-tbody');
  if (!societies.length) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="table-empty"><p>No apartments yet. Add your first one.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = societies.map((s) => {
    const badge = s.active !== false
      ? `<span class="status-badge status-completed">Active</span>`
      : `<span class="status-badge status-cancelled">Inactive</span>`;
    return `
      <tr>
        <td style="font-weight:600">${s.name || '—'}</td>
        <td style="color:var(--color-text-muted)">${s.area || '—'}</td>
        <td>${badge}</td>
        <td><button class="action-btn edit-svc-btn apt-edit-btn" data-apt-id="${s.id}">✎ Edit</button></td>
      </tr>`;
  }).join('');
  tbody.querySelectorAll('.apt-edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const soc = allSocieties.find((s) => s.id === btn.dataset.aptId);
      if (soc) openAptModal(soc);
    });
  });
}

let _editingAptId = null;

function openAptModal(soc) {
  _editingAptId = soc ? soc.id : null;
  const isEdit  = !!soc;
  document.getElementById('apt-modal-title').textContent = isEdit ? 'Edit Apartment' : 'Add Apartment';
  document.getElementById('apt-name').value   = soc?.name   || '';
  document.getElementById('apt-area').value   = soc?.area   || '';
  document.getElementById('apt-active').value = String(soc?.active ?? true);
  document.getElementById('apt-error').textContent = '';
  document.getElementById('apt-delete').style.display = isEdit ? 'inline-flex' : 'none';
  document.getElementById('apt-save').textContent = isEdit ? 'Save Changes' : 'Add Apartment';
  document.getElementById('apt-overlay').classList.add('open');
}

function closeAptModal() {
  document.getElementById('apt-overlay').classList.remove('open');
  _editingAptId = null;
}

const BANGALORE_COMMUNITIES = [
  // Whitefield
  { name: 'Adarsh Palm Retreat',           area: 'Whitefield' },
  { name: 'Adarsh Palm Meadows',           area: 'Whitefield' },
  { name: 'Assetz Marq',                   area: 'Whitefield' },
  { name: 'Brigade Cosmopolis',            area: 'Whitefield' },
  { name: 'Brigade Gateway',               area: 'Whitefield' },
  { name: 'Brigade Orchards',              area: 'Whitefield' },
  { name: 'Casagrand Ultima',              area: 'Whitefield' },
  { name: 'Concorde Sylvan View',          area: 'Whitefield' },
  { name: 'DNR Reflection',               area: 'Whitefield' },
  { name: 'Embassy Springs',              area: 'Whitefield' },
  { name: 'Godrej Reflections',           area: 'Whitefield' },
  { name: 'Godrej Splendour',             area: 'Whitefield' },
  { name: 'L&T Raintree Boulevard',       area: 'Whitefield' },
  { name: 'Mahindra Windchimes',          area: 'Whitefield' },
  { name: 'Mantri Webcity',              area: 'Whitefield' },
  { name: 'Nitesh Caesars Palace',        area: 'Whitefield' },
  { name: 'Prestige Lakeside Habitat',    area: 'Whitefield' },
  { name: 'Prestige Shantiniketan',       area: 'Whitefield' },
  { name: 'Prestige White Meadows',       area: 'Whitefield' },
  { name: 'Purva Fountainhead',           area: 'Whitefield' },
  { name: 'Purva Skywood',               area: 'Whitefield' },
  { name: 'Rajapushpa Provincia',         area: 'Whitefield' },
  { name: 'RMZ Latitude',               area: 'Whitefield' },
  { name: 'Salarpuria Greenage',          area: 'Whitefield' },
  { name: 'Salarpuria Sattva Misty Charm',area: 'Whitefield' },
  { name: 'Shriram Summitt',             area: 'Whitefield' },
  { name: 'Sobha Dream Acres',           area: 'Whitefield' },
  { name: 'Sumadhura Epitome',           area: 'Whitefield' },
  { name: 'Tata New Haven',             area: 'Whitefield' },
  { name: 'Vaishnavi Terraces',          area: 'Whitefield' },
  // Marathahalli
  { name: 'Brigade Caladium',            area: 'Marathahalli' },
  { name: 'Mantri Espana',              area: 'Marathahalli' },
  { name: 'Nester Piccadily',            area: 'Marathahalli' },
  { name: 'Prestige Misty Waters',       area: 'Marathahalli' },
  { name: 'Purva Skydale',              area: 'Marathahalli' },
  { name: 'Salarpuria Sattva Magnus',    area: 'Marathahalli' },
  { name: 'SJR Watermark',             area: 'Marathahalli' },
  { name: 'Sobha City',               area: 'Marathahalli' },
  // Varthur
  { name: 'Brigade Utopia',            area: 'Varthur' },
  { name: 'Gopalan Grandeur',          area: 'Varthur' },
  { name: 'Mana Glen',               area: 'Varthur' },
  { name: 'Prestige Sunrise Park',     area: 'Varthur' },
  { name: 'Prestige Tranquility',      area: 'Varthur' },
  { name: 'Rohan Prerna',             area: 'Varthur' },
  { name: 'Vaishnavi Serene',         area: 'Varthur' },
];

async function seedDefaultApartments() {
  const btn = document.getElementById('seed-apts-btn');
  btn.disabled    = true;
  btn.textContent = 'Seeding…';

  const existingNames = new Set(allSocieties.map((s) => s.name));
  const toAdd = BANGALORE_COMMUNITIES.filter((c) => !existingNames.has(c.name));

  if (!toAdd.length) {
    showToast('All communities already exist.');
    btn.disabled    = false;
    btn.textContent = 'Seed Bangalore Communities';
    return;
  }

  let added = 0;
  for (const community of toAdd) {
    try {
      const ref = await addDoc(collection(db, 'societies'), {
        ...community,
        active: true,
        createdAt: Timestamp.now(),
      });
      allSocieties.push({ id: ref.id, ...community, active: true });
      added++;
    } catch (err) {
      console.error(`Failed to add ${community.name}:`, err);
    }
  }

  allSocieties.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  renderApartmentsTab(allSocieties);
  showToast(`Added ${added} communities.`);
  btn.disabled    = false;
  btn.textContent = 'Seed Bangalore Communities';
}

document.getElementById('seed-apts-btn').addEventListener('click', async () => {
  if (!confirm(`Add ${BANGALORE_COMMUNITIES.length} Bangalore communities to Firestore? Existing ones will be skipped.`)) return;
  await seedDefaultApartments();
});

document.getElementById('add-apt-btn').addEventListener('click', () => openAptModal(null));
document.getElementById('apt-close').addEventListener('click', closeAptModal);
document.getElementById('apt-cancel').addEventListener('click', closeAptModal);
document.getElementById('apt-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('apt-overlay')) closeAptModal();
});

document.getElementById('apt-save').addEventListener('click', async () => {
  const name    = document.getElementById('apt-name').value.trim();
  const area    = document.getElementById('apt-area').value.trim();
  const active  = document.getElementById('apt-active').value === 'true';
  const errorEl = document.getElementById('apt-error');
  const saveBtn = document.getElementById('apt-save');

  if (!name) { errorEl.textContent = 'Apartment name is required.'; return; }

  saveBtn.disabled = true;
  const origText   = saveBtn.textContent;
  saveBtn.textContent = 'Saving…';
  errorEl.textContent = '';

  const data = { name, area, active };

  try {
    if (_editingAptId) {
      await updateDoc(doc(db, 'societies', _editingAptId), data);
      const idx = allSocieties.findIndex((s) => s.id === _editingAptId);
      if (idx !== -1) Object.assign(allSocieties[idx], data);
      showToast('Apartment updated');
    } else {
      const ref = await addDoc(collection(db, 'societies'), { ...data, createdAt: Timestamp.now() });
      allSocieties.push({ id: ref.id, ...data });
      allSocieties.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      showToast('Apartment added');
    }
    closeAptModal();
    renderApartmentsTab(allSocieties);
  } catch (err) {
    console.error(err);
    errorEl.textContent = 'Operation failed. Check Firestore permissions.';
  } finally {
    saveBtn.disabled    = false;
    saveBtn.textContent = origText;
  }
});

document.getElementById('apt-delete').addEventListener('click', async () => {
  if (!_editingAptId) return;
  const soc = allSocieties.find((s) => s.id === _editingAptId);
  if (!confirm(`Delete "${soc?.name}"? Cannot be undone.`)) return;
  const btn = document.getElementById('apt-delete');
  btn.disabled = true; btn.textContent = 'Deleting…';
  try {
    await deleteDoc(doc(db, 'societies', _editingAptId));
    allSocieties = allSocieties.filter((s) => s.id !== _editingAptId);
    closeAptModal();
    renderApartmentsTab(allSocieties);
    showToast('Apartment deleted');
  } catch (err) {
    console.error(err);
    document.getElementById('apt-error').textContent = 'Delete failed.';
    btn.disabled = false; btn.textContent = '🗑 Delete';
  }
});

/* ================================================================
   PAYOUT HELPER
   ================================================================ */
function calcOrderPayout(order, stylist) {
  if (!stylist?.hourlyRate) return null;
  const totalMinutes = (order.items || []).reduce((sum, item) => {
    return sum + (item.durationMinutes || 60) * (item.quantity || 1);
  }, 0);
  return Math.round((totalMinutes / 60) * stylist.hourlyRate);
}

/* ================================================================
   STAFF MGMT TAB
   ================================================================ */
function renderStaffMgmtTab(stylists) {
  const tbody = document.getElementById('staff-mgmt-tbody');
  if (!stylists.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="table-empty"><p>No staff yet. Add your first member.</p></div></td></tr>`;
    return;
  }

  // Build earnings map from completed orders
  const earningsMap = {};
  const bookingCount = {};
  allOrders.filter((o) => o.status === 'completed' && o.stylistId).forEach((o) => {
    const stylist = stylists.find((s) => s.id === o.stylistId);
    const payout  = calcOrderPayout(o, stylist);
    if (payout !== null) {
      earningsMap[o.stylistId]  = (earningsMap[o.stylistId]  || 0) + payout;
      bookingCount[o.stylistId] = (bookingCount[o.stylistId] || 0) + 1;
    }
  });

  tbody.innerHTML = stylists.map((s) => {
    const badge = s.active !== false
      ? `<span class="status-badge status-completed">Active</span>`
      : `<span class="status-badge status-cancelled">Inactive</span>`;
    const specs = (s.specializations || []).map((sp) => `<span class="service-tag">${sp}</span>`).join(' ');
    const genderPill = s.gender === 'male'
      ? `<span class="gender-pill men">Male</span>`
      : s.gender === 'other'
        ? `<span class="gender-pill" style="background:rgba(167,139,250,0.12);color:#a78bfa;border:1px solid rgba(167,139,250,0.25)">Other</span>`
        : `<span class="gender-pill women">Female</span>`;
    const rate     = s.hourlyRate ? `₹${s.hourlyRate}/hr` : '—';
    const bookings = bookingCount[s.id] || 0;
    const earnings = earningsMap[s.id]  ? `₹${earningsMap[s.id].toLocaleString('en-IN')}` : '—';
    return `
      <tr>
        <td style="font-weight:600">${s.name || '—'} ${genderPill}</td>
        <td style="color:var(--color-text-muted)">${s.phone || '—'}</td>
        <td>${specs || '—'}</td>
        <td style="font-weight:600;color:var(--color-gold)">${rate}</td>
        <td style="color:var(--color-text-secondary)">${bookings}</td>
        <td style="font-weight:700;color:var(--color-accent-primary)">${earnings}</td>
        <td>${badge}</td>
        <td><button class="action-btn edit-svc-btn staff-edit-btn" data-staff-id="${s.id}">✎ Edit</button></td>
      </tr>`;
  }).join('');
  tbody.querySelectorAll('.staff-edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const st = allStylists.find((s) => s.id === btn.dataset.staffId);
      if (st) openStaffModal(st);
    });
  });
}

let _editingStaffId = null;

function openStaffModal(st) {
  _editingStaffId = st ? st.id : null;
  const isEdit    = !!st;
  document.getElementById('staff-modal-title').textContent = isEdit ? 'Edit Staff' : 'Add Staff';
  document.getElementById('staff-name').value             = st?.name        || '';
  document.getElementById('staff-phone').value            = st?.phone       || '';
  document.getElementById('staff-specializations').value  = (st?.specializations || []).join(', ');
  document.getElementById('staff-hourly-rate').value      = st?.hourlyRate  ?? '';
  document.getElementById('staff-gender').value           = st?.gender      || 'female';
  document.getElementById('staff-active').value           = String(st?.active ?? true);
  document.getElementById('staff-error').textContent      = '';
  document.getElementById('staff-delete').style.display   = isEdit ? 'inline-flex' : 'none';
  document.getElementById('staff-save').textContent       = isEdit ? 'Save Changes' : 'Add Staff';
  document.getElementById('staff-overlay').classList.add('open');
}

function closeStaffModal() {
  document.getElementById('staff-overlay').classList.remove('open');
  _editingStaffId = null;
}

document.getElementById('add-staff-btn').addEventListener('click', () => openStaffModal(null));
document.getElementById('staff-close').addEventListener('click', closeStaffModal);
document.getElementById('staff-cancel').addEventListener('click', closeStaffModal);
document.getElementById('staff-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('staff-overlay')) closeStaffModal();
});

document.getElementById('staff-save').addEventListener('click', async () => {
  const name         = document.getElementById('staff-name').value.trim();
  const phone        = document.getElementById('staff-phone').value.trim();
  const specsRaw     = document.getElementById('staff-specializations').value;
  const specializations = specsRaw ? specsRaw.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const hourlyRate   = parseFloat(document.getElementById('staff-hourly-rate').value) || 0;
  const gender       = document.getElementById('staff-gender').value;
  const active       = document.getElementById('staff-active').value === 'true';
  const errorEl      = document.getElementById('staff-error');
  const saveBtn      = document.getElementById('staff-save');

  if (!name) { errorEl.textContent = 'Name is required.'; return; }

  saveBtn.disabled    = true;
  const origText      = saveBtn.textContent;
  saveBtn.textContent = 'Saving…';
  errorEl.textContent = '';

  const data = { name, phone, specializations, hourlyRate, gender, active };

  try {
    if (_editingStaffId) {
      await updateDoc(doc(db, 'stylists', _editingStaffId), data);
      const idx = allStylists.findIndex((s) => s.id === _editingStaffId);
      if (idx !== -1) Object.assign(allStylists[idx], data);
      showToast('Staff updated');
    } else {
      const ref = await addDoc(collection(db, 'stylists'), { ...data, createdAt: Timestamp.now() });
      allStylists.push({ id: ref.id, ...data });
      showToast('Staff added');
    }
    closeStaffModal();
    renderStaffMgmtTab(allStylists);
  } catch (err) {
    console.error(err);
    errorEl.textContent = 'Operation failed. Check Firestore permissions.';
  } finally {
    saveBtn.disabled    = false;
    saveBtn.textContent = origText;
  }
});

document.getElementById('staff-delete').addEventListener('click', async () => {
  if (!_editingStaffId) return;
  const st = allStylists.find((s) => s.id === _editingStaffId);
  if (!confirm(`Delete "${st?.name}"? Cannot be undone.`)) return;
  const btn = document.getElementById('staff-delete');
  btn.disabled = true; btn.textContent = 'Deleting…';
  try {
    await deleteDoc(doc(db, 'stylists', _editingStaffId));
    allStylists = allStylists.filter((s) => s.id !== _editingStaffId);
    closeStaffModal();
    renderStaffMgmtTab(allStylists);
    showToast('Staff deleted');
  } catch (err) {
    console.error(err);
    document.getElementById('staff-error').textContent = 'Delete failed.';
    btn.disabled = false; btn.textContent = '🗑 Delete';
  }
});

/* ================================================================
   STAFF ASSIGNMENT MODAL
   ================================================================ */
let _assigningOrderId = null;

function openAssignModal(orderId, customerName, date, slot) {
  _assigningOrderId = orderId;
  document.getElementById('assign-booking-label').textContent =
    `${customerName} · ${date} · ${slot}`;
  document.getElementById('assign-error').textContent = '';

  const select = document.getElementById('assign-staff-select');
  const activeStylists = allStylists.filter((s) => s.active !== false);
  const order = allOrders.find((o) => o.id === orderId);

  select.innerHTML = '<option value="">— Unassigned —</option>' +
    activeStylists.map((s) =>
      `<option value="${s.id}" data-name="${s.name}" ${order?.stylistId === s.id ? 'selected' : ''}>${s.name}${s.specializations?.length ? ' · ' + s.specializations.slice(0,2).join(', ') : ''}</option>`
    ).join('');

  document.getElementById('assign-overlay').classList.add('open');
}

function closeAssignModal() {
  document.getElementById('assign-overlay').classList.remove('open');
  _assigningOrderId = null;
}

document.getElementById('assign-close').addEventListener('click', closeAssignModal);
document.getElementById('assign-cancel').addEventListener('click', closeAssignModal);
document.getElementById('assign-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('assign-overlay')) closeAssignModal();
});

document.getElementById('assign-save').addEventListener('click', async () => {
  if (!_assigningOrderId) return;
  const select    = document.getElementById('assign-staff-select');
  const stylistId = select.value;
  const stylistName = stylistId
    ? select.options[select.selectedIndex].dataset.name
    : null;
  const errorEl   = document.getElementById('assign-error');
  const saveBtn   = document.getElementById('assign-save');

  saveBtn.disabled    = true;
  saveBtn.textContent = 'Saving…';
  errorEl.textContent = '';

  try {
    await updateDoc(doc(db, 'orders', _assigningOrderId), { stylistId: stylistId || null, stylistName: stylistName || null });
    const order = allOrders.find((o) => o.id === _assigningOrderId);
    if (order) { order.stylistId = stylistId || null; order.stylistName = stylistName || null; }
    closeAssignModal();
    renderBookingsTable(allOrders, allStylists);
    showToast(stylistName ? `Assigned to ${stylistName}` : 'Staff unassigned');
  } catch (err) {
    console.error(err);
    errorEl.textContent = 'Assignment failed. Check Firestore permissions.';
  } finally {
    saveBtn.disabled    = false;
    saveBtn.textContent = 'Save Assignment';
  }
});

/* ================================================================
   DISCOUNTS / COUPONS TAB
   ================================================================ */
function renderDiscountsTab(coupons) {
  const tbody = document.getElementById('coupons-tbody');
  if (!coupons.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="table-empty"><p>No coupons yet. Create your first one.</p></div></td></tr>`;
    return;
  }

  const sorted = [...coupons].sort((a, b) => {
    const ta = a.createdAt?.toDate?.() || new Date(0);
    const tb = b.createdAt?.toDate?.() || new Date(0);
    return tb - ta;
  });

  tbody.innerHTML = sorted.map((c) => {
    const activeBadge = c.active !== false
      ? `<span class="status-badge status-completed">Active</span>`
      : `<span class="status-badge status-cancelled">Inactive</span>`;
    const valueLabel = c.type === 'percent' ? `${c.value}%` : `₹${(c.value || 0).toLocaleString('en-IN')}`;
    const usageLabel = `${c.usedCount || 0} / ${c.maxUses ?? '∞'}`;
    const minOrder   = c.minOrderValue ? `₹${c.minOrderValue.toLocaleString('en-IN')}` : '—';
    const expiry     = c.expiresAt?.toDate
      ? c.expiresAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';

    return `
      <tr>
        <td style="font-weight:700;font-size:0.95rem;letter-spacing:1px;color:var(--color-gold)">${c.code || '—'}</td>
        <td><span class="service-tag">${c.type === 'percent' ? '% Percent' : '₹ Flat'}</span></td>
        <td style="font-weight:700">${valueLabel}</td>
        <td style="color:var(--color-text-muted)">${minOrder}</td>
        <td style="color:var(--color-text-secondary)">${usageLabel}</td>
        <td style="color:var(--color-text-muted);font-size:0.82rem">${expiry}</td>
        <td>${activeBadge}</td>
        <td><button class="action-btn edit-svc-btn coupon-edit-btn" data-coupon-id="${c.id}">✎ Edit</button></td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('.coupon-edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const coupon = allCoupons.find((c) => c.id === btn.dataset.couponId);
      if (coupon) openCouponModal(coupon);
    });
  });
}

/* ================================================================
   COUPON CRUD MODAL
   ================================================================ */
let _editingCouponId = null;

function openCouponModal(coupon) {
  _editingCouponId = coupon ? coupon.id : null;
  const isEdit = !!coupon;

  document.getElementById('coupon-modal-title').textContent = isEdit ? 'Edit Coupon' : 'Create Coupon';
  document.getElementById('coupon-code').value       = coupon?.code      || '';
  document.getElementById('coupon-type').value       = coupon?.type      || 'percent';
  document.getElementById('coupon-value').value      = coupon?.value     ?? '';
  document.getElementById('coupon-min-order').value  = coupon?.minOrderValue ?? '';
  document.getElementById('coupon-max-uses').value   = coupon?.maxUses   ?? '';
  document.getElementById('coupon-active').value     = String(coupon?.active ?? true);

  const expiry = coupon?.expiresAt?.toDate ? coupon.expiresAt.toDate() : null;
  document.getElementById('coupon-expiry').value = expiry
    ? expiry.toISOString().split('T')[0]
    : '';

  document.getElementById('coupon-error').textContent = '';
  document.getElementById('coupon-delete').style.display = isEdit ? 'inline-flex' : 'none';
  document.getElementById('coupon-save').textContent     = isEdit ? 'Save Changes' : 'Create Coupon';
  document.getElementById('coupon-overlay').classList.add('open');
}

function closeCouponModal() {
  document.getElementById('coupon-overlay').classList.remove('open');
  _editingCouponId = null;
}

document.getElementById('add-coupon-btn').addEventListener('click', () => openCouponModal(null));
document.getElementById('coupon-close').addEventListener('click', closeCouponModal);
document.getElementById('coupon-cancel').addEventListener('click', closeCouponModal);
document.getElementById('coupon-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('coupon-overlay')) closeCouponModal();
});

document.getElementById('coupon-save').addEventListener('click', async () => {
  const code         = document.getElementById('coupon-code').value.trim().toUpperCase();
  const type         = document.getElementById('coupon-type').value;
  const value        = parseFloat(document.getElementById('coupon-value').value);
  const minOrderValue = parseFloat(document.getElementById('coupon-min-order').value) || 0;
  const maxUses      = parseInt(document.getElementById('coupon-max-uses').value, 10) || null;
  const active       = document.getElementById('coupon-active').value === 'true';
  const expiryVal    = document.getElementById('coupon-expiry').value;
  const errorEl      = document.getElementById('coupon-error');
  const saveBtn      = document.getElementById('coupon-save');

  if (!code)             { errorEl.textContent = 'Coupon code is required.'; return; }
  if (isNaN(value) || value <= 0) { errorEl.textContent = 'Enter a valid discount value.'; return; }
  if (type === 'percent' && value > 100) { errorEl.textContent = 'Percentage cannot exceed 100.'; return; }

  const data = {
    code,
    type,
    value,
    minOrderValue,
    maxUses,
    active,
    expiresAt: expiryVal ? Timestamp.fromDate(new Date(expiryVal + 'T23:59:59')) : null,
  };

  saveBtn.disabled    = true;
  const origText      = saveBtn.textContent;
  saveBtn.textContent = 'Saving…';
  errorEl.textContent = '';

  try {
    if (_editingCouponId) {
      await updateDoc(doc(db, 'coupons', _editingCouponId), data);
      const idx = allCoupons.findIndex((c) => c.id === _editingCouponId);
      if (idx !== -1) Object.assign(allCoupons[idx], data);
      showToast('Coupon updated');
    } else {
      const newData = { ...data, usedCount: 0, createdAt: Timestamp.now() };
      const ref = await addDoc(collection(db, 'coupons'), newData);
      allCoupons.push({ id: ref.id, ...newData });
      showToast(`Coupon ${code} created`);
    }
    closeCouponModal();
    renderDiscountsTab(allCoupons);
  } catch (err) {
    console.error(err);
    errorEl.textContent = 'Operation failed. Check Firestore permissions.';
  } finally {
    saveBtn.disabled    = false;
    saveBtn.textContent = origText;
  }
});

document.getElementById('coupon-delete').addEventListener('click', async () => {
  if (!_editingCouponId) return;
  const coupon = allCoupons.find((c) => c.id === _editingCouponId);
  if (!confirm(`Delete coupon "${coupon?.code}"? This cannot be undone.`)) return;

  const btn = document.getElementById('coupon-delete');
  btn.disabled    = true;
  btn.textContent = 'Deleting…';

  try {
    await deleteDoc(doc(db, 'coupons', _editingCouponId));
    allCoupons = allCoupons.filter((c) => c.id !== _editingCouponId);
    closeCouponModal();
    renderDiscountsTab(allCoupons);
    showToast('Coupon deleted');
  } catch (err) {
    console.error(err);
    document.getElementById('coupon-error').textContent = 'Delete failed.';
    btn.disabled    = false;
    btn.textContent = '🗑 Delete';
  }
});

/* ================================================================
   SLOTS TAB
   ================================================================ */
function renderSlotsTab(slots) {
  const tbody = document.getElementById('slots-tbody');
  if (!slots.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="table-empty"><p>No slots yet. Add your first time slot.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = slots.map((slot, i) => {
    const activeBadge = slot.active !== false
      ? `<span class="status-badge status-completed">Active</span>`
      : `<span class="status-badge status-cancelled">Inactive</span>`;
    const apartmentLabel = slot.societies?.length
      ? `<span style="font-size:0.75rem;color:var(--color-text-muted)">${slot.societies.slice(0, 2).join(', ')}${slot.societies.length > 2 ? ` +${slot.societies.length - 2}` : ''}</span>`
      : `<span style="font-size:0.75rem;color:var(--color-accent-primary)">All apartments</span>`;
    return `
      <tr>
        <td style="color:var(--color-text-muted);font-size:0.82rem">${slot.order ?? i + 1}</td>
        <td style="font-weight:600">${slot.timeSlot || '—'}</td>
        <td>${apartmentLabel}</td>
        <td>${activeBadge}</td>
        <td><button class="action-btn edit-svc-btn slot-edit-btn" data-slot-id="${slot.id}">✎ Edit</button></td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('.slot-edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const slot = allSlots.find((s) => s.id === btn.dataset.slotId);
      if (slot) openSlotModal(slot);
    });
  });
}

/* ================================================================
   SLOT CRUD MODAL
   ================================================================ */
let _editingSlotId = null;

function openSlotModal(slot) {
  _editingSlotId = slot ? slot.id : null;
  const isEdit   = !!slot;
  const selected = new Set(slot?.societies ?? []);

  document.getElementById('slot-modal-title').textContent = isEdit ? 'Edit Slot' : 'Add Slot';
  document.getElementById('slot-order').value             = slot?.order    ?? (allSlots.length + 1);

  // Set select — add custom option if value not in predefined list
  const slotSelect = document.getElementById('slot-label');
  const timeSlotVal = slot?.timeSlot ?? '';
  if (timeSlotVal && !Array.from(slotSelect.options).some((o) => o.value === timeSlotVal)) {
    const customOpt = new Option(timeSlotVal, timeSlotVal);
    slotSelect.appendChild(customOpt);
  }
  slotSelect.value = timeSlotVal;
  document.getElementById('slot-active').value            = String(slot?.active ?? true);
  document.getElementById('slot-error').textContent       = '';
  document.getElementById('slot-delete').style.display   = isEdit ? 'inline-flex' : 'none';
  document.getElementById('slot-save').textContent       = isEdit ? 'Save Changes' : 'Add Slot';

  // Populate apartment checkboxes
  const wrap = document.getElementById('slot-societies-wrap');
  if (!allSocieties.length) {
    wrap.innerHTML = '<p style="font-size:0.78rem;color:var(--color-text-muted)">No apartments configured yet. Add them in the Apartments tab.</p>';
  } else {
    wrap.innerHTML = allSocieties
      .filter((s) => s.active !== false)
      .map((s) => `
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.85rem;color:var(--color-text-secondary)">
          <input type="checkbox" value="${s.name}" ${selected.has(s.name) ? 'checked' : ''}
            style="accent-color:var(--color-accent-primary);width:15px;height:15px;cursor:pointer" />
          ${s.name}${s.area ? `<span style="font-size:0.72rem;color:var(--color-text-muted)"> · ${s.area}</span>` : ''}
        </label>`
      ).join('');
  }

  document.getElementById('slot-overlay').classList.add('open');
}

function closeSlotModal() {
  document.getElementById('slot-overlay').classList.remove('open');
  _editingSlotId = null;
}

document.getElementById('add-slot-btn').addEventListener('click', () => openSlotModal(null));
document.getElementById('slot-close').addEventListener('click', closeSlotModal);
document.getElementById('slot-cancel').addEventListener('click', closeSlotModal);
document.getElementById('slot-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('slot-overlay')) closeSlotModal();
});

document.getElementById('slot-save').addEventListener('click', async () => {
  const timeSlot  = document.getElementById('slot-label').value.trim();
  const order     = parseInt(document.getElementById('slot-order').value, 10) || 1;
  const active    = document.getElementById('slot-active').value === 'true';
  const societies = Array.from(
    document.getElementById('slot-societies-wrap').querySelectorAll('input[type="checkbox"]:checked')
  ).map((cb) => cb.value);
  const errorEl  = document.getElementById('slot-error');
  const saveBtn  = document.getElementById('slot-save');

  if (!timeSlot) { errorEl.textContent = 'Select a time slot.'; return; }

  saveBtn.disabled    = true;
  const origText      = saveBtn.textContent;
  saveBtn.textContent = 'Saving…';
  errorEl.textContent = '';

  const data = { timeSlot, order, active, societies };

  try {
    if (_editingSlotId) {
      await updateDoc(doc(db, 'slots', _editingSlotId), data);
      const idx = allSlots.findIndex((s) => s.id === _editingSlotId);
      if (idx !== -1) Object.assign(allSlots[idx], data);
      showToast('Slot updated');
    } else {
      const ref = await addDoc(collection(db, 'slots'), data);
      allSlots.push({ id: ref.id, ...data });
      showToast('Slot added');
    }
    allSlots.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    closeSlotModal();
    renderSlotsTab(allSlots);
  } catch (err) {
    console.error(err);
    errorEl.textContent = 'Operation failed. Check Firestore permissions.';
  } finally {
    saveBtn.disabled    = false;
    saveBtn.textContent = origText;
  }
});

document.getElementById('slot-delete').addEventListener('click', async () => {
  if (!_editingSlotId) return;
  const slot = allSlots.find((s) => s.id === _editingSlotId);
  if (!confirm(`Delete slot "${slot?.timeSlot}"? This cannot be undone.`)) return;

  const btn = document.getElementById('slot-delete');
  btn.disabled    = true;
  btn.textContent = 'Deleting…';

  try {
    await deleteDoc(doc(db, 'slots', _editingSlotId));
    allSlots = allSlots.filter((s) => s.id !== _editingSlotId);
    closeSlotModal();
    renderSlotsTab(allSlots);
    showToast('Slot deleted');
  } catch (err) {
    console.error(err);
    document.getElementById('slot-error').textContent = 'Delete failed.';
    btn.disabled    = false;
    btn.textContent = '🗑 Delete';
  }
});

/* ================================================================
   PLANS TAB — Bloom Pass subscription plans
   ================================================================ */
function renderPlansTab(plans) {
  const tbody = document.getElementById('plans-tbody');
  if (!tbody) return;
  if (!plans.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="table-empty"><p>No plans yet. Create your first Bloom Pass plan.</p></div></td></tr>`;
    return;
  }

  const sorted = [...plans].sort((a, b) => {
    const ta = a.createdAt?.toDate?.() || new Date(0);
    const tb = b.createdAt?.toDate?.() || new Date(0);
    return tb - ta;
  });

  tbody.innerHTML = sorted.map((p) => {
    const activeBadge = p.active !== false
      ? `<span class="status-badge status-completed">Active</span>`
      : `<span class="status-badge status-cancelled">Inactive</span>`;
    const genderLabel = p.gender === 'women' ? 'Women' : p.gender === 'men' ? 'Men' : 'Both';
    const savings = p.originalPrice
      ? Math.round((1 - p.price / p.originalPrice) * 100)
      : 0;
    const savingsHtml = savings > 0
      ? `<span style="color:var(--color-success);font-weight:600">${savings}%</span>`
      : '—';

    return `
      <tr>
        <td>
          <div style="font-weight:600;color:var(--color-text-primary)">${escHtml(p.name || '—')}</div>
          ${p.tag ? `<span class="service-tag" style="background:var(--color-gold);color:var(--color-accent-ink);font-weight:700">${escHtml(p.tag)}</span>` : ''}
        </td>
        <td style="color:var(--color-text-secondary)">${genderLabel}</td>
        <td style="font-weight:700">${p.credits ?? 0}</td>
        <td style="color:var(--color-text-muted)">${p.durationDays ?? 30} days</td>
        <td style="color:var(--color-text-muted);text-decoration:line-through">${p.originalPrice ? `₹${p.originalPrice.toLocaleString('en-IN')}` : '—'}</td>
        <td style="font-weight:700;color:var(--color-gold)">₹${(p.price || 0).toLocaleString('en-IN')}</td>
        <td>${savingsHtml}</td>
        <td>${activeBadge}</td>
        <td><button class="action-btn edit-svc-btn plan-edit-btn" data-plan-id="${p.id}">✎ Edit</button></td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('.plan-edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const plan = allPlans.find((p) => p.id === btn.dataset.planId);
      if (plan) openPlanModal(plan);
    });
  });
}

/* ================================================================
   PLAN CRUD MODAL
   ================================================================ */
let _editingPlanId = null;

function openPlanModal(plan) {
  _editingPlanId = plan ? plan.id : null;
  const isEdit = !!plan;

  document.getElementById('plan-modal-title').textContent = isEdit ? 'Edit Plan' : 'Create Plan';
  document.getElementById('plan-name').value           = plan?.name   || '';
  document.getElementById('plan-price').value          = plan?.price  ?? '';
  document.getElementById('plan-original-price').value = plan?.originalPrice ?? '';
  document.getElementById('plan-credits').value        = plan?.credits ?? '';
  document.getElementById('plan-duration').value       = plan?.durationDays ?? '30';
  document.getElementById('plan-gender').value         = plan?.gender || 'both';
  document.getElementById('plan-tag').value            = plan?.tag    || '';
  document.getElementById('plan-description').value    = plan?.description || '';
  document.getElementById('plan-features').value       = (plan?.features || []).join('\n');
  document.getElementById('plan-active').value         = String(plan?.active ?? true);

  document.getElementById('plan-error').textContent    = '';
  document.getElementById('plan-delete').style.display = isEdit ? 'inline-flex' : 'none';
  document.getElementById('plan-save').textContent     = isEdit ? 'Save Changes' : 'Create Plan';
  document.getElementById('plan-overlay').classList.add('open');
}

function closePlanModal() {
  document.getElementById('plan-overlay').classList.remove('open');
  _editingPlanId = null;
}

document.getElementById('add-plan-btn').addEventListener('click', () => openPlanModal(null));
document.getElementById('plan-close').addEventListener('click', closePlanModal);
document.getElementById('plan-cancel').addEventListener('click', closePlanModal);
document.getElementById('plan-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('plan-overlay')) closePlanModal();
});

document.getElementById('plan-save').addEventListener('click', async () => {
  const name        = document.getElementById('plan-name').value.trim();
  const price       = parseFloat(document.getElementById('plan-price').value);
  const originalPrice = parseFloat(document.getElementById('plan-original-price').value) || 0;
  const credits     = parseInt(document.getElementById('plan-credits').value, 10);
  const durationDays = parseInt(document.getElementById('plan-duration').value, 10);
  const gender      = document.getElementById('plan-gender').value;
  const tag         = document.getElementById('plan-tag').value.trim();
  const description = document.getElementById('plan-description').value.trim();
  const features    = document.getElementById('plan-features').value.split('\n').map((f) => f.trim()).filter(Boolean);
  const active      = document.getElementById('plan-active').value === 'true';
  const errorEl     = document.getElementById('plan-error');
  const saveBtn     = document.getElementById('plan-save');

  if (!name)                       { errorEl.textContent = 'Plan name is required.'; return; }
  if (isNaN(price) || price <= 0)  { errorEl.textContent = 'Enter a valid price.'; return; }
  if (isNaN(credits) || credits <= 0) { errorEl.textContent = 'Credits must be at least 1.'; return; }
  if (isNaN(durationDays) || durationDays <= 0) { errorEl.textContent = 'Duration must be a positive number of days.'; return; }
  if (originalPrice && originalPrice < price)    { errorEl.textContent = 'Original price should be >= sale price.'; return; }

  const data = {
    name,
    price,
    originalPrice: originalPrice || null,
    credits,
    durationDays,
    gender,
    tag: tag || null,
    description,
    features,
    active,
  };

  saveBtn.disabled    = true;
  const origText      = saveBtn.textContent;
  saveBtn.textContent = 'Saving…';
  errorEl.textContent = '';

  try {
    if (_editingPlanId) {
      await updateDoc(doc(db, 'subscriptionPlans', _editingPlanId), data);
      const idx = allPlans.findIndex((p) => p.id === _editingPlanId);
      if (idx !== -1) Object.assign(allPlans[idx], data);
      showToast('Plan updated');
    } else {
      const newData = { ...data, createdAt: Timestamp.now() };
      const ref = await addDoc(collection(db, 'subscriptionPlans'), newData);
      allPlans.push({ id: ref.id, ...newData });
      showToast(`Plan "${name}" created`);
    }
    closePlanModal();
    renderPlansTab(allPlans);
  } catch (err) {
    console.error(err);
    errorEl.textContent = 'Operation failed. Check Firestore permissions.';
  } finally {
    saveBtn.disabled    = false;
    saveBtn.textContent = origText;
  }
});

document.getElementById('plan-delete').addEventListener('click', async () => {
  if (!_editingPlanId) return;
  const plan = allPlans.find((p) => p.id === _editingPlanId);
  if (!confirm(`Delete plan "${plan?.name}"? This cannot be undone.`)) return;

  const btn = document.getElementById('plan-delete');
  btn.disabled    = true;
  btn.textContent = 'Deleting…';

  try {
    await deleteDoc(doc(db, 'subscriptionPlans', _editingPlanId));
    allPlans = allPlans.filter((p) => p.id !== _editingPlanId);
    closePlanModal();
    renderPlansTab(allPlans);
    showToast('Plan deleted');
  } catch (err) {
    console.error(err);
    document.getElementById('plan-error').textContent = 'Delete failed.';
    btn.disabled    = false;
    btn.textContent = '🗑 Delete';
  }
});

/* ================================================================
   BROADCAST — Send Push Notification
   ================================================================ */
let broadcastHistory = [];

async function renderBroadcastTab() {
  try {
    const snap = await getDocs(
      query(collection(db, 'adminBroadcasts'), orderBy('createdAt', 'desc'))
    );
    broadcastHistory = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const el = document.getElementById('broadcast-history');
    if (broadcastHistory.length === 0) {
      el.innerHTML = '<p>No broadcasts sent yet.</p>';
    } else {
      el.innerHTML = broadcastHistory.map((b) => {
        const statusClass = b.status === 'sent' ? 'color:var(--color-success)' :
                            b.status === 'failed' ? 'color:var(--color-danger)' : 'color:var(--color-accent)';
        const date = b.createdAt?.toDate?.() || new Date();
        const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        return `<div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;padding:12px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <strong style="color:var(--color-text-primary)">${escHtml(b.title)}</strong>
            <span style="${statusClass};font-size:0.75rem;font-weight:500">${b.status}</span>
          </div>
          <p style="color:var(--color-text-secondary);font-size:0.8rem;margin-bottom:2px">${escHtml(b.body)}</p>
          <p style="color:var(--color-text-muted);font-size:0.7rem">${dateStr} · ${b.recipientCount || 0} recipients</p>
        </div>`;
      }).join('');
    }
  } catch (err) {
    console.error('Load broadcast history error:', err);
  }
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

document.getElementById('broadcast-send-btn')?.addEventListener('click', () => {
  const title = document.getElementById('broadcast-title').value.trim();
  const body  = document.getElementById('broadcast-body').value.trim();
  const statusEl = document.getElementById('broadcast-status');

  if (!title || !body) {
    statusEl.textContent = 'Please enter both title and body.';
    statusEl.style.color = 'var(--color-danger)';
    return;
  }

  document.getElementById('broadcast-preview-title').textContent = title;
  document.getElementById('broadcast-preview-body').textContent = body;
  document.getElementById('broadcast-error').textContent = '';
  document.getElementById('broadcast-overlay').style.display = 'flex';
});

document.getElementById('broadcast-cancel')?.addEventListener('click', closeBroadcastModal);
document.getElementById('broadcast-close')?.addEventListener('click', closeBroadcastModal);

function closeBroadcastModal() {
  document.getElementById('broadcast-overlay').style.display = 'none';
}

document.getElementById('broadcast-confirm-send')?.addEventListener('click', async () => {
  const title   = document.getElementById('broadcast-title').value.trim();
  const body    = document.getElementById('broadcast-body').value.trim();
  const btn     = document.getElementById('broadcast-confirm-send');
  const statusEl = document.getElementById('broadcast-status');
  const errorEl = document.getElementById('broadcast-error');

  btn.disabled    = true;
  btn.textContent = 'Sending…';
  errorEl.textContent = '';

  try {
    const docRef = await addDoc(collection(db, 'adminBroadcasts'), {
      title,
      body,
      status: 'pending',
      createdAt: serverTimestamp(),
      recipientCount: 0,
    });

    // Attempt to send via Firebase Functions HTTP endpoint if deployed
    // Otherwise, fallback: write as pending and let Cloud Function process it
    closeBroadcastModal();
    document.getElementById('broadcast-title').value = '';
    document.getElementById('broadcast-body').value  = '';
    statusEl.textContent = '📨 Notification queued for delivery.';
    statusEl.style.color = 'var(--color-success)';
    showToast('Broadcast queued — will be delivered shortly');

    // Immediately write notification to all customer sub-collections as fallback
    try {
      const customersSnap = await getDocs(collection(db, 'customers'));
      const batch = writeBatch(db);
      let count = 0;
      customersSnap.docs.forEach((c) => {
        const notifRef = doc(collection(db, 'customers', c.id, 'notifications'));
        batch.set(notifRef, { title, body, read: false, createdAt: serverTimestamp() });
        count++;
      });
      if (count > 0) {
        await batch.commit();
        await updateDoc(doc(db, 'adminBroadcasts', docRef.id), { recipientCount: count, status: 'sent' });
      }
    } catch (fallbackErr) {
      console.warn('Fallback notification write failed:', fallbackErr);
    }

    renderBroadcastTab();
  } catch (err) {
    console.error('Broadcast send error:', err);
    errorEl.textContent = 'Failed to queue notification.';
    closeBroadcastModal();
    statusEl.textContent = 'Failed to send.';
    statusEl.style.color = 'var(--color-danger)';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Send to All';
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
