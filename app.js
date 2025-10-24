// Firebase 初始化
const firebaseConfig = {
  apiKey: "AIzaSyAReTBGcVEi6JC0gRZWS110ePOv8kJ_hm0",
  authDomain: "newreport-89d34.firebaseapp.com",
  projectId: "newreport-89d34",
  storageBucket: "newreport-89d34.firebasestorage.app",
  messagingSenderId: "894484318701",
  appId: "1:894484318701:web:9dc4752226de8a47207fe4"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();
auth.useDeviceLanguage();

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAReTBGcVEi6JC0gRZWS110ePOv8kJ_hm0',
  authDomain: 'newreport-89d34.firebaseapp.com',
  projectId: 'newreport-89d34',
  storageBucket: 'newreport-89d34.firebasestorage.app',
  messagingSenderId: '894484318701',
  appId: '1:894484318701:web:9dc4752226de8a47207fe4',
  measurementId: 'G-J463N8284H',
};

const firebaseApp = initializeApp(firebaseConfig);
let analytics;
try {
  analytics = getAnalytics(firebaseApp);
} catch (error) {
  console.info('[firebase] analytics unavailable in this environment', error);
}

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'id-' + Math.random().toString(36).slice(2, 11);
}

const LEVEL_RANGES = [
  { code: 'lv1', name: 'Lv1', min: 0, max: 399 },
  { code: 'lv2', name: 'Lv2', min: 400, max: 549 },
  { code: 'lv3', name: 'Lv3', min: 550, max: 699 },
  { code: 'lv4', name: 'Lv4', min: 700, max: 819 },
  { code: 'lv5', name: 'Lv5', min: 820, max: 899 },
  { code: 'lv6', name: 'Lv6', min: 900, max: 959 },
  { code: 'lv7', name: 'Lv7', min: 960, max: 1000 },
  { code: 'ex', name: 'EX', min: 1001, max: 1100 },
];

const QUICK_LOGIN_PRESETS = {
  admin: { email: 'admin@example.com', password: 'password' },
  manager: { email: 'manager@example.com', password: 'password' },
  staff: { email: 'staff@example.com', password: 'password' },
};

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const DAY_LABELS = {
  monday: '週一',
  tuesday: '週二',
  wednesday: '週三',
  thursday: '週四',
  friday: '週五',
};

const STORAGE_KEYS = {
  MENU_PLANNER: 'war-dashboard-menu-planner',
};

function createDefaultMenuPlanner() {
  const baseItems = [
    {
      id: generateId(),
      name: '經典牛肉堡',
      price: 120,
      defaultQuantity: {},
      deliveryTotal: 0,
    },
    {
      id: generateId(),
      name: '香烤雞腿堡',
      price: 110,
      defaultQuantity: {},
      deliveryTotal: 0,
    },
  ];
  const templates = DAY_KEYS.reduce((acc, key) => {
    acc[key] = {
      items: baseItems.map((item) => ({ ...item, id: generateId() })),
      dailySpecial: { name: key === 'wednesday' ? '限定炸雞拼盤' : '', price: 0 },
      updatedAt: new Date().toISOString(),
    };
    return acc;
  }, {});
  return {
    templates,
    history: [],
    lastSavedAt: null,
  };
}

function loadMenuPlanner() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.MENU_PLANNER) : null;
    if (!raw) return createDefaultMenuPlanner();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return createDefaultMenuPlanner();
    parsed.history = Array.isArray(parsed.history) ? parsed.history : [];
    parsed.templates = parsed.templates && typeof parsed.templates === 'object' ? parsed.templates : {};
    DAY_KEYS.forEach((key) => {
      if (!parsed.templates[key]) {
        parsed.templates[key] = createDefaultMenuPlanner().templates[key];
      }
    });
    return parsed;
  } catch (error) {
    console.warn('[menuPlanner] load failed, use defaults', error);
    return createDefaultMenuPlanner();
  }
}

function persistMenuPlanner(syncRemote = true) {
  try {
    if (typeof localStorage === 'undefined') return;
    const payload = JSON.stringify(state.menuPlanner);
    localStorage.setItem(STORAGE_KEYS.MENU_PLANNER, payload);
  } catch (error) {
    console.warn('[menuPlanner] persist failed', error);
  }
  if (syncRemote) scheduleMenuSave();
}

let menuSaveTimer = null;

function sanitizeMenuPayload(menu) {
  try {
    return JSON.parse(JSON.stringify(menu || {}));
  } catch (error) {
    console.warn('[menuPlanner] sanitize failed', error);
    return {};
  }
}

function scheduleMenuSave() {
  if (menuSaveTimer) clearTimeout(menuSaveTimer);
  menuSaveTimer = setTimeout(async () => {
    const payload = sanitizeMenuPayload(state.menuPlanner);
    try {
      await setDoc(
        doc(db, 'menu', 'data'),
        {
          menu: payload,
          updatedAt: serverTimestamp(),
          updatedBy: state.currentUser?.id ?? null,
        },
        { merge: true },
      );
    } catch (error) {
      console.warn('[menuPlanner] firestore sync failed', error);
    }
  }, 600);
}

const state = {
  currentUser: null,
  currentUserDoc: null,
  announcements: [],
  reports: [],
  locations: [],
  staff: [],
  wishes: [],
  menuPlanner: loadMenuPlanner(),
  incentives: {
    targetAvgBV: 820,
    bonusAmount: 3000,
  },
  points: {
    base: 360,
    monthCap: 40,
  },
  subscriptions: {},
};

const dom = {};

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${formatDate(dateStr)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function getDayKeyFromDate(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDay();
  const mapping = { 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday' };
  return mapping[day] ?? 'monday';
}

function getCurrentMenuDay() {
  return getDayKeyFromDate(new Date().toISOString().slice(0, 10));
}

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString();
}

function toIsoString(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  if (typeof value.toDate === 'function') {
    try {
      return value.toDate().toISOString();
    } catch (error) {
      console.warn('[timestamp] convert failed', error);
    }
  }
  return null;
}

function withTimestamps(data) {
  if (!data || typeof data !== 'object') return data;
  const clone = { ...data };
  if ('createdAt' in clone) clone.createdAt = toIsoString(clone.createdAt);
  if ('updatedAt' in clone) clone.updatedAt = toIsoString(clone.updatedAt);
  return clone;
}

function unsubscribeAll() {
  Object.values(state.subscriptions).forEach((unsubscribe) => {
    if (typeof unsubscribe === 'function') {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('[firebase] unsubscribe failed', error);
      }
    }
  });
  state.subscriptions = {};
}

function cloneMenuData(data) {
  return JSON.parse(JSON.stringify(data));
}

function ensureMenuTemplate(dayKey) {
  if (!state.menuPlanner.templates[dayKey]) {
    state.menuPlanner.templates[dayKey] = createDefaultMenuPlanner().templates[dayKey];
  }
  return state.menuPlanner.templates[dayKey];
}

function computeMenuTotals(template) {
  const totalsByLocation = {};
  let grandTotal = 0;
  let deliveryTotal = 0;
  template.items.forEach((item) => {
    Object.entries(item.defaultQuantity || {}).forEach(([loc, qty]) => {
      totalsByLocation[loc] = (totalsByLocation[loc] ?? 0) + Number(qty || 0);
      grandTotal += Number(qty || 0);
    });
    deliveryTotal += Number(item.deliveryTotal || 0);
    grandTotal += Number(item.deliveryTotal || 0);
  });
  return { totalsByLocation, grandTotal, deliveryTotal };
}

const BADGE_META = {
  TARGET: { text: '達標', className: 'badge-small badge-target' },
  EXCEED: { text: '超標', className: 'badge-small badge-exceed' },
  NEW: { text: '新品', className: 'badge-small badge-new' },
};

function renderBadgeChip(badge) {
  const meta = BADGE_META[badge] || { text: badge, className: 'badge-small badge-new' };
  return `<span class="${meta.className}">${meta.text}</span>`;
}

function renderMenuSnapshotHtml(snapshot) {
  if (!snapshot) {
    return '<div class="text-xs text-gray-400">未附菜單</div>';
  }
  const totals = snapshot.totals || { totalsByLocation: {}, deliveryTotal: 0, grandTotal: 0 };
  const locations = Object.keys(totals.totalsByLocation || {});
  const items = (snapshot.items || [])
    .map((item) => {
      const total = Object.values(item.defaultQuantity || {}).reduce((sum, qty) => sum + Number(qty || 0), 0) + Number(item.deliveryTotal || 0);
      return `<li class="flex justify-between"><span>${item.name}</span><span>${formatNumber(total)}</span></li>`;
    })
    .join('');
  return `
    <div class="space-y-2 text-xs">
      <div class="flex justify-between"><span class="text-gray-500">特餐</span><span>${snapshot.dailySpecial?.name || '—'}</span></div>
      <div class="grid grid-cols-2 gap-2">
        ${locations.length
          ? locations.map((loc) => `<div class="flex justify-between"><span>${loc}</span><span>${formatNumber(totals.totalsByLocation?.[loc] || 0)}</span></div>`).join('')
          : '<div class="text-gray-400 col-span-2">尚無據點數量</div>'}
      </div>
      <div class="flex justify-between text-emerald-600"><span>外送</span><span>${formatNumber(totals.deliveryTotal)}</span></div>
      <div class="flex justify-between font-semibold"><span>總量</span><span>${formatNumber(totals.grandTotal)}</span></div>
      ${items ? `<ul class="divide-y divide-slate-200">${items}</ul>` : ''}
    </div>`;
}

function formatDayLabel(dayKey) {
  return DAY_LABELS[dayKey] ?? dayKey;
}

function buildMenuSnapshot(template, dateStr, dayKey) {
  const copy = cloneMenuData(template);
  const totals = computeMenuTotals(template);
  return {
    id: generateId(),
    date: dateStr,
    dayKey,
    createdAt: new Date().toISOString(),
    items: copy.items || [],
    dailySpecial: copy.dailySpecial || null,
    totals,
  };
}

function addMenuHistoryEntry(snapshot) {
  state.menuPlanner.history.unshift(snapshot);
  state.menuPlanner.lastSavedAt = new Date().toISOString();
  persistMenuPlanner();
}

function updateCurrentUserFromDoc(docData = {}) {
  if (!state.currentUser) {
    state.currentUser = { id: null, email: '', displayName: '', role: 'staff', bv: 360 };
  }
  const role = (docData.role || state.currentUser.role || 'staff').toString().toLowerCase();
  const displayName = docData.displayName || docData.name || state.currentUser.displayName || state.currentUser.email || '';
  const bv = typeof docData.bv === 'number' ? docData.bv : state.currentUser.bv ?? 360;
  state.currentUser = {
    ...state.currentUser,
    displayName,
    role,
    bv,
  };
  state.currentUserDoc = docData;
  refreshCurrentUserUi();
}

function subscribeToCollections(uid) {
  unsubscribeAll();

  if (!uid) return;

  state.subscriptions.userDoc = onSnapshot(doc(db, 'users', uid), (snapshot) => {
    const data = snapshot.exists() ? snapshot.data() : {};
    updateCurrentUserFromDoc(data || {});
  });

  state.subscriptions.announcements = onSnapshot(
    query(collection(db, 'announcements'), orderBy('createdAt', 'desc')),
    (snapshot) => {
      state.announcements = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...withTimestamps(docSnap.data()) }));
      renderAnnouncements();
      renderAnnouncementManage();
      renderTodaySummary();
    },
  );

  state.subscriptions.locations = onSnapshot(collection(db, 'locations'), (snapshot) => {
    state.locations = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...withTimestamps(docSnap.data()) }));
    populateLocationFilter();
    renderTodaySummary();
  });

  state.subscriptions.staff = onSnapshot(collection(db, 'users'), (snapshot) => {
    state.staff = snapshot.docs.map((docSnap) => {
      const data = withTimestamps(docSnap.data());
      return {
        id: docSnap.id,
        ...data,
        role: (data.role || '').toString().toLowerCase(),
      };
    });
    renderReports();
  });

  state.subscriptions.reports = onSnapshot(
    query(collection(db, 'reports'), orderBy('date', 'desc'), limit(200)),
    (snapshot) => {
      state.reports = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...withTimestamps(docSnap.data()) }));
      renderReports();
      renderTodaySummary();
    },
  );

  state.subscriptions.wishes = onSnapshot(collection(db, 'wishes'), (snapshot) => {
    state.wishes = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...withTimestamps(docSnap.data()) }));
    renderWishList();
    renderTodaySummary();
  });

  state.subscriptions.menu = onSnapshot(doc(db, 'menu', 'data'), (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    if (data?.menu) {
      state.menuPlanner = {
        ...state.menuPlanner,
        ...data.menu,
        templates: { ...state.menuPlanner.templates, ...(data.menu.templates || {}) },
        history: Array.isArray(data.menu.history) ? data.menu.history : state.menuPlanner.history,
      };
      persistMenuPlanner(false);
    }
  });
}

function filterMenuHistory({ start, end }) {
  const begin = start ? new Date(start) : null;
  const finish = end ? new Date(end) : null;
  return state.menuPlanner.history
    .slice()
    .filter((entry) => {
      const date = new Date(entry.date);
      if (begin && date < begin) return false;
      if (finish && date > finish) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function computeHistoryAggregates(entries) {
  const totalsByLocation = {};
  let grandTotal = 0;
  let deliveryTotal = 0;
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const weeklyTotals = {};
  let weeklyGrand = 0;
  const monthlyTotals = {};
  let monthlyGrand = 0;

  entries.forEach((entry) => {
    Object.entries(entry.totals.totalsByLocation || {}).forEach(([loc, qty]) => {
      totalsByLocation[loc] = (totalsByLocation[loc] ?? 0) + Number(qty || 0);
    });
    grandTotal += Number(entry.totals.grandTotal || 0);
    deliveryTotal += Number(entry.totals.deliveryTotal || 0);

    const entryDate = new Date(entry.date);
    if (entryDate >= weekAgo && entryDate <= now) {
      Object.entries(entry.totals.totalsByLocation || {}).forEach(([loc, qty]) => {
        weeklyTotals[loc] = (weeklyTotals[loc] ?? 0) + Number(qty || 0);
      });
      weeklyGrand += Number(entry.totals.grandTotal || 0);
    }
    if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
      Object.entries(entry.totals.totalsByLocation || {}).forEach(([loc, qty]) => {
        monthlyTotals[loc] = (monthlyTotals[loc] ?? 0) + Number(qty || 0);
      });
      monthlyGrand += Number(entry.totals.grandTotal || 0);
    }
  });

  return {
    totalsByLocation,
    grandTotal,
    deliveryTotal,
    weeklyTotals,
    weeklyGrand,
    monthlyTotals,
    monthlyGrand,
  };
}

function printMenuSnapshot(snapshot) {
  const w = window.open('', '_blank');
  if (!w) {
    Swal.fire('無法開啟列印視窗', '', 'error');
    return;
  }
  const totals = snapshot.totals || { totalsByLocation: {}, grandTotal: 0, deliveryTotal: 0 };
  const locations = Object.keys(totals.totalsByLocation);
  w.document.write(`
    <html>
      <head>
        <title>菜單列印 ${snapshot.date}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 24px; }
          h1 { font-size: 20px; margin-bottom: 8px; }
          table { border-collapse: collapse; width: 100%; margin-top: 16px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 12px; }
          th { background: #f3f4f6; }
          tfoot th { background: #fef3c7; }
        </style>
      </head>
      <body>
        <h1>${snapshot.date} ${formatDayLabel(snapshot.dayKey)} 菜單</h1>
        ${snapshot.dailySpecial?.name ? `<div>特餐：${snapshot.dailySpecial.name}</div>` : ''}
        <table>
          <thead>
            <tr>
              <th>品項</th>
              <th>單價</th>
              ${locations.map((loc) => `<th>${loc}</th>`).join('')}
              <th>外送</th>
              <th>合計</th>
            </tr>
          </thead>
          <tbody>
            ${snapshot.items
              .map((item) => {
                const rowTotal = Object.values(item.defaultQuantity || {}).reduce((sum, qty) => sum + Number(qty || 0), 0) + Number(item.deliveryTotal || 0);
                return `
                  <tr>
                    <td>${item.name}</td>
                    <td class="text-right">${formatNumber(item.price || 0)}</td>
                    ${locations
                      .map((loc) => `<td class="text-right">${formatNumber(item.defaultQuantity?.[loc] || 0)}</td>`)
                      .join('')}
                    <td class="text-right">${formatNumber(item.deliveryTotal || 0)}</td>
                    <td class="text-right">${formatNumber(rowTotal)}</td>
                  </tr>`;
              })
              .join('')}
          </tbody>
          <tfoot>
            <tr>
              <th colspan="2">各據點總數</th>
              ${locations
                .map((loc) => `<th class="text-right">${formatNumber(totals.totalsByLocation?.[loc] || 0)}</th>`)
                .join('')}
              <th class="text-right">${formatNumber(totals.deliveryTotal)}</th>
              <th class="text-right">${formatNumber(totals.grandTotal)}</th>
            </tr>
          </tfoot>
        </table>
        <p style="margin-top:12px;font-size:12px;color:#6b7280;">列印時間：${formatDateTime(new Date().toISOString())}</p>
      </body>
    </html>
  `);
  w.document.close();
  w.focus();
  w.print();
}

function createModal({ title, subtitle = '', content, wide = false }) {
  const template = document.getElementById('modalShellTemplate');
  const node = template.content.firstElementChild.cloneNode(true);
  const container = node.querySelector('div');
  if (wide) {
    container.classList.remove('max-w-3xl');
    container.classList.add('max-w-5xl');
  }

  const header = document.createElement('div');
  header.className = 'flex items-start justify-between gap-4';
  const titleWrapper = document.createElement('div');
  const titleEl = document.createElement('h2');
  titleEl.className = 'modal-title';
  titleEl.textContent = title;
  titleWrapper.appendChild(titleEl);
  if (subtitle) {
    const sub = document.createElement('div');
    sub.className = 'modal-subtitle';
    sub.textContent = subtitle;
    titleWrapper.appendChild(sub);
  }
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.className = 'text-2xl text-gray-400 hover:text-gray-600';
  closeBtn.addEventListener('click', () => closeModal(node));
  header.appendChild(titleWrapper);
  header.appendChild(closeBtn);
  container.appendChild(header);

  if (typeof content === 'string') {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = content;
    container.appendChild(wrapper);
  } else if (content instanceof Node) {
    container.appendChild(content);
  } else if (Array.isArray(content)) {
    content.forEach((child) => container.appendChild(child));
  }

  node.addEventListener('click', (evt) => {
    if (evt.target === node) {
      closeModal(node);
    }
  });

  document.getElementById('modalBackdrops').appendChild(node);
  return node;
}

function closeModal(modalEl) {
  modalEl.dispatchEvent(new CustomEvent('modal:close'));
  modalEl.remove();
}

function setFeatureVisibility() {
  const isAdmin = state.currentUser?.role === 'admin';
  const isManager = isAdmin || state.currentUser?.role === 'manager';

  dom.btnStaffManage?.classList.toggle('hidden', !(isAdmin || isManager));
  dom.btnReportManage?.classList.toggle('hidden', !isManager);
  dom.btnAnnManage?.classList.toggle('hidden', !isManager);
  dom.addAnnBtn?.classList.toggle('hidden', !isManager);
  dom.btnMenuManage?.classList.toggle('hidden', !isManager);
  dom.btnLocationManage?.classList.toggle('hidden', !isManager);
}

function findLevel(bv) {
  for (const range of LEVEL_RANGES) {
    if (bv >= range.min && bv <= range.max) return range;
  }
  return LEVEL_RANGES[0];
}

function nextLevel(code) {
  if (code === 'ex') return null;
  const index = LEVEL_RANGES.findIndex((range) => range.code === code);
  if (index === -1 || index === LEVEL_RANGES.length - 1) return null;
  return LEVEL_RANGES[index + 1];
}

function renderLevelInfo() {
  if (!state.currentUser) {
    dom.levelDisplay.innerHTML = '';
    return;
  }
  const bv = state.currentUser.bv ?? 360;
  const level = findLevel(bv);
  const next = nextLevel(level.code);
  const ratio = !next
    ? 1
    : Math.min(1, Math.max(0, (bv - level.min) / (next.min - level.min)));
  dom.levelDisplay.innerHTML = `
    <div class="flex flex-col items-center leading-tight text-xs">
      <div class="font-bold">${level.name}</div>
      <div class="text-gray-500">${bv}</div>
      <div class="w-24 mt-1">
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${ratio * 100}%"></div></div>
        <div class="text-[10px] mt-1 text-center">${next ? `差 ${Math.max(0, next.min - bv)}` : 'MAX'}</div>
      </div>
    </div>`;
}

function renderQuarterIncentive() {
  if (!state.currentUser) {
    dom.quarterIncentivePanel.textContent = '--';
    dom.quarterIncentiveBadge.textContent = '';
    return;
  }
  const target = state.incentives.targetAvgBV;
  const current = state.currentUser.bv ?? 0;
  const badge = document.createElement('span');
  const reached = current >= target;
  badge.className = `incentive-badge ${reached ? 'incentive-ok' : 'incentive-progress'}`;
  badge.textContent = reached ? '已達標' : `差 ${Math.max(0, target - current)} BV 達標`;
  dom.quarterIncentivePanel.textContent = `本季平均 BV 目標：${target}，獎金 ${state.incentives.bonusAmount} 元`;
  dom.quarterIncentiveBadge.innerHTML = '';
  dom.quarterIncentiveBadge.appendChild(badge);
}

function renderUserSummary() {
  dom.currentUserName.textContent = state.currentUser?.displayName ?? '';
  dom.currentUserRoleBadge.textContent = state.currentUser?.role ?? '';
}

function renderAnnouncements(list = state.announcements) {
  const container = dom.announcementsArea;
  container.innerHTML = '';
  if (!list.length) {
    container.innerHTML = '<div class="text-gray-400 text-xs">尚無公告</div>';
    return;
  }

  list
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .forEach((ann) => {
      const card = document.createElement('article');
      card.className = 'announcement-item cursor-pointer';
      card.innerHTML = `
        <div class="flex justify-between items-start gap-3">
          <div>
            <div class="text-xs text-gray-400 mb-1">${formatAnnType(ann.type)} · ${formatDateTime(ann.updatedAt ?? ann.createdAt)}</div>
            <h3 class="font-semibold">${ann.title}</h3>
          </div>
          <span class="text-xs bg-slate-100 border border-slate-200 rounded px-2 py-0.5">${ann.type}</span>
        </div>
        <p class="text-sm text-gray-600 mt-2 line-clamp-3">${ann.content}</p>
      `;
      card.addEventListener('click', () => openAnnouncementDetail(ann.id));
      container.appendChild(card);
    });
}

function formatAnnType(type) {
  const map = {
    important: '重要',
    adjustment: '調整',
    sharing: '趣事',
  };
  return map[type] ?? type;
}

function openAnnouncementDetail(id) {
  const ann = state.announcements.find((item) => item.id === id);
  if (!ann) return;
  const content = document.createElement('div');
  content.className = 'space-y-4 text-sm';
  content.innerHTML = `
    <div class="text-xs text-gray-400">${formatAnnType(ann.type)} · ${formatDateTime(ann.updatedAt ?? ann.createdAt)}</div>
    <div class="whitespace-pre-line">${ann.content}</div>
    ${ann.imageUrl ? `<img src="${ann.imageUrl}" alt="公告圖片" class="max-h-64 object-cover rounded border" />` : ''}
  `;

  const modal = createModal({
    title: ann.title,
    content,
  });

  const isManager = ['admin', 'manager'].includes(state.currentUser?.role);
  if (isManager) {
    const actions = document.createElement('div');
    actions.className = 'flex gap-2 justify-end';
    const editBtn = document.createElement('button');
    editBtn.className = 'px-3 py-2 bg-blue-600 text-white rounded text-sm';
    editBtn.textContent = '編輯';
    editBtn.addEventListener('click', () => {
      closeModal(modal);
      openAnnouncementModal(ann.id);
    });
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'px-3 py-2 bg-red-600 text-white rounded text-sm';
    deleteBtn.textContent = '刪除';
    deleteBtn.addEventListener('click', () => {
      closeModal(modal);
      deleteAnnouncement(ann.id);
    });
    actions.append(editBtn, deleteBtn);
    content.appendChild(actions);
  }
}

function openAnnouncementModal(id = null) {
  const template = document.getElementById('announcementFormTemplate');
  const form = template.content.firstElementChild.cloneNode(true);
  const ann = id ? state.announcements.find((item) => item.id === id) : null;
  if (ann) {
    form.id.value = ann.id;
    form.type.value = ann.type;
    form.title.value = ann.title;
    form.content.value = ann.content;
    form.imageUrl.value = ann.imageUrl ?? '';
  }

  const modal = createModal({
    title: ann ? '編輯公告' : '新增公告',
    content: form,
  });

  form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const payload = {
      type: data.type,
      title: data.title.trim(),
      content: data.content.trim(),
      imageUrl: data.imageUrl.trim(),
    };
    if (!payload.title || !payload.content) {
      Swal.fire('請完整填寫', '', 'warning');
      return;
    }

    (async () => {
      try {
        if (ann) {
          await updateDoc(doc(db, 'announcements', ann.id), {
            ...payload,
            updatedAt: serverTimestamp(),
            updatedBy: state.currentUser?.id ?? null,
          });
          Swal.fire('公告已更新', '', 'success');
        } else {
          await addDoc(collection(db, 'announcements'), {
            ...payload,
            createdAt: serverTimestamp(),
            updatedAt: null,
            createdBy: state.currentUser?.id ?? null,
          });
          Swal.fire('公告已新增', '', 'success');
        }
        closeModal(modal);
      } catch (error) {
        Swal.fire('儲存失敗', mapFirebaseError(error), 'error');
      }
    })();
  });

  form.querySelector('[data-role="cancel"]').addEventListener('click', () => closeModal(modal));
}

function deleteAnnouncement(id) {
  Swal.fire({
    title: '確定刪除？',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '刪除',
    confirmButtonColor: '#d33',
  }).then(async (result) => {
    if (!result.isConfirmed) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
      Swal.fire('已刪除', '', 'success');
    } catch (error) {
      Swal.fire('刪除失敗', mapFirebaseError(error), 'error');
    }
  });
}

function renderAnnouncementManage(list = state.announcements) {
  if (!dom.annManageList) return;
  dom.annManageList.innerHTML = '';
  if (!list.length) {
    dom.annManageList.innerHTML = '<div class="text-xs text-gray-400">無公告</div>';
    return;
  }

  list
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .forEach((ann) => {
      const row = document.createElement('div');
      row.className = 'border rounded p-3 bg-white space-y-2';
      row.innerHTML = `
        <div class="flex justify-between items-start gap-3">
          <div>
            <div class="font-semibold text-sm">${ann.title}</div>
            <div class="text-[11px] text-gray-400">${formatAnnType(ann.type)} · ${formatDateTime(ann.updatedAt ?? ann.createdAt)}</div>
          </div>
          <div class="flex gap-2">
            <button class="px-2 py-1 text-[11px] bg-blue-600 text-white rounded">編輯</button>
            <button class="px-2 py-1 text-[11px] bg-red-600 text-white rounded">刪除</button>
          </div>
        </div>
        <div class="text-xs text-gray-500 line-clamp-2">${ann.content.replace(/\n/g, ' ')}</div>
      `;
      const [editBtn, deleteBtn] = row.querySelectorAll('button');
      editBtn.addEventListener('click', () => openAnnouncementModal(ann.id));
      deleteBtn.addEventListener('click', () => deleteAnnouncement(ann.id));
      dom.annManageList.appendChild(row);
    });
}

function showAnnouncementManageModal() {
  if (!['admin', 'manager'].includes(state.currentUser?.role)) return;
  const content = document.createElement('div');
  content.className = 'space-y-4';
  const controls = document.createElement('div');
  controls.className = 'flex flex-col md:flex-row gap-2';
  controls.innerHTML = `
    <input type="text" id="annSearch" placeholder="搜尋標題或內容" class="flex-1 border rounded px-3 py-2 text-sm" />
    <select id="annTypeFilter" class="border rounded px-3 py-2 text-sm">
      <option value="">全部類型</option>
      <option value="important">重要</option>
      <option value="adjustment">調整</option>
      <option value="sharing">趣事</option>
    </select>`;
  content.appendChild(controls);
  const list = document.createElement('div');
  list.id = 'annManageList';
  list.className = 'space-y-3';
  content.appendChild(list);

  const modal = createModal({ title: '公告管理', content, wide: true });
  dom.annManageList = list;
  modal.addEventListener('modal:close', () => {
    dom.annManageList = null;
  });

  controls.querySelector('#annSearch').addEventListener('input', () => filterAnnouncementManage(modal));
  controls.querySelector('#annTypeFilter').addEventListener('change', () => filterAnnouncementManage(modal));

  renderAnnouncementManage();
}

function filterAnnouncementManage(modal) {
  const search = modal.querySelector('#annSearch').value.trim().toLowerCase();
  const type = modal.querySelector('#annTypeFilter').value;
  const filtered = state.announcements.filter((ann) => {
    const matchesType = !type || ann.type === type;
    const matchesSearch =
      !search ||
      ann.title.toLowerCase().includes(search) ||
      ann.content.toLowerCase().includes(search);
    return matchesType && matchesSearch;
  });
  renderAnnouncementManage(filtered);
}

function renderReports() {
  const container = dom.reportsContainer;
  const empty = dom.reportsEmpty;
  const data = applyReportFilters();
  container.innerHTML = '';
  renderReportAggregates(data);
  if (!data.length) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  data.forEach((report) => {
    const card = document.createElement('article');
    card.className = 'report-card';
    const badges = (report.badges || []).map((badge) => renderBadgeChip(badge)).join(' ');
    const amountText = report.finalTotal ? `NT$ ${formatNumber(report.finalTotal)}` : '';
    const deliveryText = report.deliveryNotes ? `<div class="mt-2 text-xs text-amber-600">外送：${report.deliveryNotes}</div>` : '';
    card.innerHTML = `
      <button class="edit-btn-report">編輯</button>
      <div class="flex justify-between items-start gap-3">
        <div>
          <div class="text-xs text-gray-400">${formatDate(report.date)} · ${report.location}</div>
          <h3 class="font-semibold mt-1">${report.summary}</h3>
          ${badges ? `<div class="mt-2 flex flex-wrap gap-1">${badges}</div>` : ''}
          ${deliveryText}
        </div>
        <div class="text-right text-sm font-semibold text-emerald-600">${amountText}</div>
      </div>
      <div class="flex justify-between items-center mt-3 text-xs text-gray-500">
        <span>狀態：${report.status}</span>
        <span>負責人：${getStaffName(report.owner)}</span>
      </div>
      <div class="actions flex gap-2 mt-3 text-xs">
        <button class="px-2 py-1 bg-blue-100 text-blue-600 rounded">查看</button>
        <button class="px-2 py-1 bg-red-100 text-red-600 rounded">刪除</button>
      </div>`;
    const [editBtn] = card.getElementsByClassName('edit-btn-report');
    editBtn.addEventListener('click', (evt) => {
      evt.stopPropagation();
      openReportModal(report.id);
    });
    const [viewBtn, deleteBtn] = card.querySelectorAll('.actions button');
    viewBtn.addEventListener('click', () => viewReport(report.id));
    deleteBtn.addEventListener('click', () => deleteReport(report.id));
    container.appendChild(card);
  });
}

function getStaffName(id) {
  return state.staff.find((user) => user.id === id)?.name ?? '未知成員';
}

function renderReportAggregates(reports) {
  const container = dom.reportAggregates;
  const total = reports.length;
  const byStatus = reports.reduce((acc, report) => {
    acc[report.status] = (acc[report.status] ?? 0) + 1;
    return acc;
  }, {});
  const totalAmount = reports.reduce((sum, report) => sum + Number(report.finalTotal || 0), 0);
  container.innerHTML = `
    <span>共 ${total} 筆</span>
    <span>總實收 $${formatNumber(totalAmount)}</span>
    ${Object.entries(byStatus)
      .map(([status, count]) => `<span>${status}: ${count}</span>`)
      .join(' · ')}`;
}

function openReportManageModal() {
  if (!['admin', 'manager'].includes(state.currentUser?.role)) return;
  const today = new Date().toISOString().slice(0, 10);
  const monthFirst = `${today.slice(0, 8)}01`;

  const content = document.createElement('div');
  content.className = 'space-y-4';
  content.innerHTML = `
    <div class="border rounded-lg p-4 bg-gray-50 grid md:grid-cols-6 gap-3 text-xs">
      <div>
        <label class="block mb-1 text-gray-600">開始日期</label>
        <input type="date" data-filter="start" value="${monthFirst}" class="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label class="block mb-1 text-gray-600">結束日期</label>
        <input type="date" data-filter="end" value="${today}" class="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label class="block mb-1 text-gray-600">據點</label>
        <select data-filter="location" class="w-full border rounded px-2 py-1">
          <option value="">全部</option>
          ${state.locations.map((loc) => `<option value="${loc.name}">${loc.name}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="block mb-1 text-gray-600">員工</label>
        <select data-filter="staff" class="w-full border rounded px-2 py-1">
          <option value="">全部</option>
          ${state.staff.map((staff) => `<option value="${staff.id}">${staff.name}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="block mb-1 text-gray-600">狀態</label>
        <select data-filter="status" class="w-full border rounded px-2 py-1">
          <option value="">全部</option>
          <option value="正常營業">正常營業</option>
          <option value="提早結束">提早結束</option>
          <option value="延後開始">延後開始</option>
          <option value="暫停營業">暫停營業</option>
        </select>
      </div>
      <div class="md:col-span-2">
        <label class="block mb-1 text-gray-600">關鍵字 (摘要 / 備註 / 反饋)</label>
        <input type="text" data-filter="kw" placeholder="輸入關鍵字..." class="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label class="block mb-1 text-gray-600">最低實收</label>
        <input type="number" data-filter="minAmt" class="w-full border rounded px-2 py-1" placeholder=">= 0" />
      </div>
      <div>
        <label class="block mb-1 text-gray-600">最高實收</label>
        <input type="number" data-filter="maxAmt" class="w-full border rounded px-2 py-1" placeholder="<= ..." />
      </div>
      <div class="flex items-end gap-2">
        <button data-action="apply" class="flex-1 px-3 py-1.5 bg-emerald-600 text-white rounded">套用</button>
        <button data-action="reset" class="flex-1 px-3 py-1.5 bg-gray-300 text-gray-700 rounded">重置</button>
      </div>
      <div class="md:col-span-3 text-[11px] text-gray-500 flex items-end">提示：可輸入多組關鍵字，以空白分隔 (AND)，金額範圍為前端過濾。</div>
    </div>
    <div id="reportManageStats" class="text-xs text-gray-600">統計載入中...</div>
    <div class="border rounded-lg overflow-hidden">
      <table class="w-full text-[12px]">
        <thead class="bg-slate-100 text-gray-700">
          <tr>
            <th class="p-2 text-center"><input type="checkbox" data-role="select-all" /></th>
            <th class="p-2 text-left">日期</th>
            <th class="p-2 text-left">據點</th>
            <th class="p-2 text-left">負責人</th>
            <th class="p-2 text-right">實收</th>
            <th class="p-2 text-right">售出</th>
            <th class="p-2 text-right">剩餘</th>
            <th class="p-2 text-left">狀態</th>
            <th class="p-2 text-left">徽章</th>
            <th class="p-2 text-left">建立時間</th>
            <th class="p-2 text-left">摘要/備註</th>
            <th class="p-2 text-center">操作</th>
          </tr>
        </thead>
        <tbody id="reportManageTbody">
          <tr><td colspan="12" class="text-center p-6 text-gray-400 text-xs">尚未載入</td></tr>
        </tbody>
      </table>
    </div>
    <div class="flex justify-between items-center text-xs">
      <div class="flex gap-2">
        <button data-action="reload" class="px-3 py-1.5 bg-slate-500 text-white rounded">重載</button>
        <button data-action="export" class="px-3 py-1.5 bg-indigo-600 text-white rounded">匯出 CSV</button>
        <button data-action="bulk-delete" class="px-3 py-1.5 bg-rose-600 text-white rounded">批次刪除</button>
      </div>
      <button data-action="close" class="px-3 py-1.5 bg-gray-200 text-gray-700 rounded">關閉</button>
    </div>
  `;

  const modal = createModal({ title: '戰報管理總覽', content, wide: true });
  const filters = {
    start: monthFirst,
    end: today,
    location: '',
    staff: '',
    status: '',
    kw: '',
    minAmt: '',
    maxAmt: '',
  };
  let reportManageData = [];
  let searchTimer = null;

  const tbody = content.querySelector('#reportManageTbody');
  const statsEl = content.querySelector('#reportManageStats');
  const selectAll = content.querySelector('[data-role="select-all"]');

  function applyFilters() {
    const startDate = filters.start || '0000-00-00';
    const endDate = filters.end || '9999-12-31';
    const minAmt = filters.minAmt ? Number(filters.minAmt) : null;
    const maxAmt = filters.maxAmt ? Number(filters.maxAmt) : null;
    const keywords = filters.kw
      .split(/\s+/)
      .map((kw) => kw.trim().toLowerCase())
      .filter(Boolean);

    reportManageData = state.reports
      .filter((report) => {
        if (report.date < startDate || report.date > endDate) return false;
        if (filters.location && report.location !== filters.location) return false;
        if (filters.staff && report.owner !== filters.staff) return false;
        if (filters.status && report.status !== filters.status) return false;
        const amount = Number(report.finalTotal ?? 0);
        if (minAmt !== null && amount < minAmt) return false;
        if (maxAmt !== null && amount > maxAmt) return false;
        if (keywords.length) {
          const haystack = [
            report.summary,
            report.notes,
            report.customerFeedback,
            report.myResponse,
            report.deliveryNotes,
            getStaffName(report.owner),
            report.location,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          const matched = keywords.every((kw) => haystack.includes(kw));
          if (!matched) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date);
        if (dateDiff !== 0) return dateDiff;
        return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
      });
    renderTable();
    renderStats();
  }

  function renderTable() {
    if (!reportManageData.length) {
      tbody.innerHTML = '<tr><td colspan="12" class="text-center p-6 text-gray-400 text-xs">無符合資料</td></tr>';
      selectAll.checked = false;
      return;
    }
    tbody.innerHTML = reportManageData
      .map((report) => {
        const badges = (report.badges || []).map((badge) => renderBadgeChip(badge)).join(' ');
        const createdAtText = report.createdAt ? formatDateTime(report.createdAt) : '';
        const snippet = [report.summary, report.notes, report.customerFeedback]
          .filter(Boolean)
          .join(' / ')
          .slice(0, 60);
        return `
          <tr class="border-b hover:bg-indigo-50/40">
            <td class="p-2 text-center"><input type="checkbox" data-role="row-check" value="${report.id}" /></td>
            <td class="p-2">${report.date}</td>
            <td class="p-2">${report.location}</td>
            <td class="p-2">${getStaffName(report.owner)}</td>
            <td class="p-2 text-right">${formatNumber(report.finalTotal || 0)}</td>
            <td class="p-2 text-right">${formatNumber(report.totalSold || 0)}</td>
            <td class="p-2 text-right">${formatNumber(report.totalRemaining || 0)}</td>
            <td class="p-2">${report.status}</td>
            <td class="p-2">${badges || '<span class="text-gray-400">—</span>'}</td>
            <td class="p-2">${createdAtText}</td>
            <td class="p-2">${snippet || '—'}</td>
            <td class="p-2">
              <div class="flex gap-1">
                <button data-action="view" data-id="${report.id}" class="px-2 py-0.5 bg-blue-600 text-white rounded text-[11px]">查看</button>
                <button data-action="edit" data-id="${report.id}" class="px-2 py-0.5 bg-slate-600 text-white rounded text-[11px]">編輯</button>
                <button data-action="delete" data-id="${report.id}" class="px-2 py-0.5 bg-red-600 text-white rounded text-[11px]">刪</button>
              </div>
            </td>
          </tr>`;
      })
      .join('');
    selectAll.checked = false;
  }

  function renderStats() {
    if (!reportManageData.length) {
      statsEl.textContent = '統計：無資料';
      return;
    }
    const totalAmount = reportManageData.reduce((sum, report) => sum + Number(report.finalTotal || 0), 0);
    const totalSold = reportManageData.reduce((sum, report) => sum + Number(report.totalSold || 0), 0);
    const totalRemain = reportManageData.reduce((sum, report) => sum + Number(report.totalRemaining || 0), 0);
    statsEl.innerHTML = `統計：筆數 <b>${reportManageData.length}</b> ｜ 總實收 <b>$${formatNumber(totalAmount)}</b> ｜ 總售出 <b>${formatNumber(totalSold)}</b> ｜ 總剩餘 <b>${formatNumber(totalRemain)}</b>`;
  }

  function getSelectedIds() {
    return Array.from(content.querySelectorAll('[data-role="row-check"]:checked')).map((input) => input.value);
  }

  function exportCsv() {
    if (!reportManageData.length) {
      Swal.fire('無資料', '請先套用篩選條件取得資料。', 'info');
      return;
    }
    const header = ['日期', '據點', '負責人', '狀態', '實收', '售出', '剩餘', '折扣', '電子支付', '未入帳', '徽章', '摘要'];
    const rows = reportManageData.map((report) => [
      report.date,
      report.location,
      getStaffName(report.owner),
      report.status,
      report.finalTotal ?? 0,
      report.totalSold ?? 0,
      report.totalRemaining ?? 0,
      report.totalDiscount ?? 0,
      report.electronicPayment ?? 0,
      report.notYetPaid ?? 0,
      (report.badges || []).join('|'),
      [report.summary, report.notes, report.customerFeedback].filter(Boolean).join(' / ').replace(/"/g, '""'),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reports_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function bulkDelete() {
    const ids = getSelectedIds();
    if (!ids.length) {
      Swal.fire('未選擇', '請先勾選要刪除的戰報', 'info');
      return;
    }
    Swal.fire({
      title: `刪除 ${ids.length} 筆戰報？`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '刪除',
      confirmButtonColor: '#dc2626',
    }).then((res) => {
      if (!res.isConfirmed) return;
      state.reports = state.reports.filter((report) => !ids.includes(report.id));
      renderReports();
      renderTodaySummary();
      applyFilters();
      Swal.fire('已刪除', '選定的戰報已刪除。', 'success');
    });
  }

  content.addEventListener('change', (evt) => {
    const filterKey = evt.target.dataset.filter;
    if (!filterKey) return;
    filters[filterKey] = evt.target.value;
    if (filterKey !== 'kw') {
      applyFilters();
    }
  });

  content.addEventListener('input', (evt) => {
    const filterKey = evt.target.dataset.filter;
    if (!filterKey) return;
    filters[filterKey] = evt.target.value;
    if (['kw', 'minAmt', 'maxAmt'].includes(filterKey)) {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(applyFilters, 300);
    }
  });

  content.addEventListener('click', (evt) => {
    const action = evt.target.dataset.action;
    if (!action) return;
    if (action === 'apply') {
      applyFilters();
    } else if (action === 'reset') {
      filters.start = monthFirst;
      filters.end = today;
      filters.location = '';
      filters.staff = '';
      filters.status = '';
      filters.kw = '';
      filters.minAmt = '';
      filters.maxAmt = '';
      content.querySelectorAll('[data-filter]').forEach((input) => {
        if (input.type === 'checkbox') input.checked = false;
        else if (input.dataset.filter === 'start') input.value = monthFirst;
        else if (input.dataset.filter === 'end') input.value = today;
        else input.value = '';
      });
      applyFilters();
    } else if (action === 'reload') {
      applyFilters();
    } else if (action === 'export') {
      exportCsv();
    } else if (action === 'bulk-delete') {
      bulkDelete();
    } else if (action === 'close') {
      closeModal(modal);
    } else if (['view', 'edit', 'delete'].includes(action)) {
      const id = evt.target.dataset.id;
      if (!id) return;
      if (action === 'view') {
        viewReport(id);
      } else if (action === 'edit') {
        closeModal(modal);
        openReportModal(id);
      } else if (action === 'delete') {
        deleteReport(id).then((removed) => {
          if (removed) applyFilters();
        });
      }
    }
  });

  content.addEventListener('change', (evt) => {
    if (evt.target.dataset.role === 'select-all') {
      const checked = evt.target.checked;
      content.querySelectorAll('[data-role="row-check"]').forEach((checkbox) => {
        checkbox.checked = checked;
      });
    }
  });

  applyFilters();
}


function openReportModal(id = null) {
  const template = document.getElementById('reportFormTemplate');
  const form = template.content.firstElementChild.cloneNode(true);
  const report = id ? state.reports.find((item) => item.id === id) : null;

  const locationSelect = form.querySelector('select[name="location"]');
  state.locations.forEach((loc) => {
    const option = document.createElement('option');
    option.value = loc.name;
    option.textContent = loc.name;
    locationSelect.appendChild(option);
  });

  const ownerSelect = form.querySelector('select[name="owner"]');
  state.staff.forEach((staff) => {
    const option = document.createElement('option');
    option.value = staff.id;
    option.textContent = staff.name;
    ownerSelect.appendChild(option);
  });

  const menuSelect = form.querySelector('select[name="menuTemplate"]');
  menuSelect.innerHTML = '<option value="">未指定</option>' + DAY_KEYS.map((day) => `<option value="${day}">${DAY_LABELS[day]} 預設</option>`).join('');
  const menuPreview = form.querySelector('[data-role="menu-preview"]');
  const badgeInputs = Array.from(form.querySelectorAll('input[name="badges"]'));

  const todayStr = new Date().toISOString().slice(0, 10);
  let menuManuallyChanged = false;
  let currentMenuSnapshot = report?.menuSnapshot ? cloneMenuData(report.menuSnapshot) : null;

  const assignNumber = (inputName, value) => {
    const input = form.querySelector(`[name="${inputName}"]`);
    if (!input) return;
    input.value = value ?? '';
  };

  if (report) {
    form.id.value = report.id;
    form.date.value = report.date;
    form.location.value = report.location;
    form.status.value = report.status;
    form.owner.value = report.owner;
    assignNumber('finalTotal', report.finalTotal ?? '');
    assignNumber('totalSold', report.totalSold ?? '');
    assignNumber('totalRemaining', report.totalRemaining ?? '');
    assignNumber('totalDiscount', report.totalDiscount ?? '');
    assignNumber('electronicPayment', report.electronicPayment ?? '');
    assignNumber('notYetPaid', report.notYetPaid ?? '');
    form.summary.value = report.summary ?? '';
    form.notes.value = report.notes ?? '';
    form.customerFeedback.value = report.customerFeedback ?? '';
    form.myResponse.value = report.myResponse ?? '';
    form.deliveryNotes.value = report.deliveryNotes ?? '';
    if (report.menuTemplate) {
      menuSelect.value = report.menuTemplate;
    }
    badgeInputs.forEach((input) => {
      input.checked = report.badges?.includes(input.value) ?? false;
    });
    if (currentMenuSnapshot) {
      renderSnapshot(currentMenuSnapshot);
    } else if (report.menuTemplate) {
      updateMenuSnapshot(report.menuTemplate);
    } else {
      menuPreview.textContent = '未選擇菜單';
    }
  } else {
    form.date.value = todayStr;
    form.summary.value = '';
    const defaultDay = getDayKeyFromDate(todayStr);
    menuSelect.value = defaultDay;
    updateMenuSnapshot(defaultDay);
  }

  function updateMenuSnapshot(dayKey) {
    if (!dayKey) {
      currentMenuSnapshot = null;
      menuPreview.textContent = '未選擇菜單';
      return;
    }
    const templateData = ensureMenuTemplate(dayKey);
    currentMenuSnapshot = buildMenuSnapshot(templateData, form.date.value || todayStr, dayKey);
    renderSnapshot(currentMenuSnapshot);
  }

  function renderSnapshot(snapshot) {
    if (!snapshot) {
      menuPreview.textContent = '未選擇菜單';
      return;
    }
    const totals = snapshot.totals || { totalsByLocation: {}, deliveryTotal: 0, grandTotal: 0 };
    const locations = Object.keys(totals.totalsByLocation || {});
    const itemsPreview = (snapshot.items || [])
      .slice(0, 4)
      .map((item) => {
        const total = Object.values(item.defaultQuantity || {}).reduce((sum, qty) => sum + Number(qty || 0), 0) + Number(item.deliveryTotal || 0);
        return `<li class="flex justify-between"><span>${item.name}</span><span>${formatNumber(total)}</span></li>`;
      })
      .join('');
    menuPreview.innerHTML = `
      <div class="text-[11px] text-gray-500 mb-1">特餐：${snapshot.dailySpecial?.name || '—'}</div>
      <div class="grid grid-cols-2 gap-2 text-xs">
        ${locations.length
          ? locations.map((loc) => `<div class="flex justify-between"><span>${loc}</span><span>${formatNumber(totals.totalsByLocation?.[loc] || 0)}</span></div>`).join('')
          : '<div class="text-gray-400 col-span-2">尚無據點數量</div>'}
      </div>
      <div class="mt-2 text-[11px] text-gray-500">外送 ${formatNumber(totals.deliveryTotal)} · 總量 ${formatNumber(totals.grandTotal)}</div>
      ${itemsPreview ? `<ul class="mt-2 space-y-1 text-[11px]">${itemsPreview}</ul>` : ''}`;
  }

  form.date.addEventListener('change', () => {
    const dayKey = getDayKeyFromDate(form.date.value || todayStr);
    if (!menuManuallyChanged) {
      menuSelect.value = dayKey;
    }
    if (menuSelect.value) {
      updateMenuSnapshot(menuSelect.value);
    }
  });

  menuSelect.addEventListener('change', () => {
    menuManuallyChanged = true;
    updateMenuSnapshot(menuSelect.value);
  });

  const modal = createModal({
    title: report ? '編輯戰報' : '新增戰報',
    content: form,
  });

  form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const formData = new FormData(form);
    const toNumber = (value) => {
      const num = Number(value);
      return Number.isFinite(num) && num >= 0 ? num : 0;
    };
    const badges = badgeInputs.filter((input) => input.checked).map((input) => input.value);
    const menuTemplate = formData.get('menuTemplate') || '';
    let snapshot = currentMenuSnapshot;
    if (menuTemplate) {
      snapshot = buildMenuSnapshot(ensureMenuTemplate(menuTemplate), formData.get('date'), menuTemplate);
    } else if (report?.menuSnapshot && !snapshot) {
      snapshot = cloneMenuData(report.menuSnapshot);
    }

    const payload = {
      date: formData.get('date'),
      location: formData.get('location'),
      status: formData.get('status'),
      owner: formData.get('owner'),
      summary: (formData.get('summary') || '').trim(),
      finalTotal: toNumber(formData.get('finalTotal')),
      totalSold: toNumber(formData.get('totalSold')),
      totalRemaining: toNumber(formData.get('totalRemaining')),
      totalDiscount: toNumber(formData.get('totalDiscount')),
      electronicPayment: toNumber(formData.get('electronicPayment')),
      notYetPaid: toNumber(formData.get('notYetPaid')),
      badges,
      notes: (formData.get('notes') || '').trim(),
      customerFeedback: (formData.get('customerFeedback') || '').trim(),
      myResponse: (formData.get('myResponse') || '').trim(),
      deliveryNotes: (formData.get('deliveryNotes') || '').trim(),
      menuTemplate,
    };

    const docPayload = {
      ...payload,
      menuSnapshot: snapshot ? cloneMenuData(snapshot) : null,
    };

    (async () => {
      try {
        if (report) {
          await updateDoc(doc(db, 'reports', report.id), {
            ...docPayload,
            updatedAt: serverTimestamp(),
            updatedBy: state.currentUser?.id ?? null,
          });
          Swal.fire('戰報已更新', '', 'success');
        } else {
          await addDoc(collection(db, 'reports'), {
            ...docPayload,
            createdAt: serverTimestamp(),
            createdBy: state.currentUser?.id ?? null,
          });
          Swal.fire('戰報已建立', '', 'success');
        }
        closeModal(modal);
      } catch (error) {
        Swal.fire('儲存失敗', mapFirebaseError(error), 'error');
      }
    })();
  });

  form.querySelector('[data-role="cancel"]').addEventListener('click', () => closeModal(modal));
}


function viewReport(id) {
  const report = state.reports.find((item) => item.id === id);
  if (!report) return;
  const badges = (report.badges || []).map((badge) => renderBadgeChip(badge)).join(' ');
  createModal({
    title: `${formatDate(report.date)} ${report.location}`,
    content: `
      <div class="space-y-3 text-sm">
        <div class="flex justify-between items-center">
          <span>狀態：${report.status}</span>
          <span>負責人：${getStaffName(report.owner)}</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-slate-50 border rounded p-3">
          <div>實收：$${formatNumber(report.finalTotal || 0)}</div>
          <div>售出：${formatNumber(report.totalSold || 0)}</div>
          <div>剩餘：${formatNumber(report.totalRemaining || 0)}</div>
          <div>折扣：$${formatNumber(report.totalDiscount || 0)}</div>
          <div>電子支付：$${formatNumber(report.electronicPayment || 0)}</div>
          <div>未入帳：$${formatNumber(report.notYetPaid || 0)}</div>
        </div>
        ${badges ? `<div class="flex flex-wrap gap-1 text-xs">${badges}</div>` : ''}
        ${report.deliveryNotes ? `<div class="text-xs text-amber-600">外送：${report.deliveryNotes}</div>` : ''}
        <div class="whitespace-pre-line">${report.summary}</div>
        ${report.notes ? `<div class="text-xs text-gray-600">備註：${report.notes}</div>` : ''}
        ${report.customerFeedback ? `<div class="text-xs text-gray-600">顧客反饋：${report.customerFeedback}</div>` : ''}
        ${report.myResponse ? `<div class="text-xs text-gray-600">回應：${report.myResponse}</div>` : ''}
        <div>
          <div class="text-sm font-semibold mb-1">菜單</div>
          ${renderMenuSnapshotHtml(report.menuSnapshot)}
        </div>
      </div>`,
  });
}

function deleteReport(id) {
  return Swal.fire({
    title: '確定刪除戰報？',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '刪除',
    confirmButtonColor: '#d33',
  }).then(async (result) => {
    if (!result.isConfirmed) return false;
    try {
      await deleteDoc(doc(db, 'reports', id));
      Swal.fire('已刪除', '', 'success');
      return true;
    } catch (error) {
      Swal.fire('刪除失敗', mapFirebaseError(error), 'error');
      return false;
    }
  });
}

function applyReportFilters() {
  const start = dom.filterStart.value;
  const end = dom.filterEnd.value;
  const location = dom.filterLocation.value;
  const status = dom.filterStatus.value;

  return state.reports.filter((report) => {
    const date = report.date;
    const matchesStart = !start || date >= start;
    const matchesEnd = !end || date <= end;
    const matchesLocation = !location || report.location === location;
    const matchesStatus = !status || report.status === status;
    return matchesStart && matchesEnd && matchesLocation && matchesStatus;
  });
}

function resetReportFilters() {
  dom.filterStart.value = '';
  dom.filterEnd.value = '';
  dom.filterLocation.value = '';
  dom.filterStatus.value = '';
  renderReports();
}

function populateLocationFilter() {
  dom.filterLocation.innerHTML = '<option value="">全部</option>';
  state.locations.forEach((loc) => {
    const option = document.createElement('option');
    option.value = loc.name;
    option.textContent = loc.name;
    dom.filterLocation.appendChild(option);
  });
}

function showLocationManageModal() {
  if (!['admin', 'manager'].includes(state.currentUser?.role)) return;
  const content = document.createElement('div');
  content.className = 'space-y-4';
  const list = document.createElement('div');
  list.className = 'space-y-3';
  list.innerHTML = renderLocationListHTML();
  content.appendChild(list);
  const addBtn = document.createElement('button');
  addBtn.className = 'px-3 py-2 bg-violet-500 text-white rounded text-sm';
  addBtn.textContent = '新增據點';
  addBtn.addEventListener('click', () => openLocationForm());
  content.appendChild(addBtn);

  const modal = createModal({ title: '據點管理', content, wide: true });

  function render() {
    list.innerHTML = renderLocationListHTML();
    populateLocationFilter();
    renderTodaySummary();
  }

  function renderLocationListHTML() {
    if (!state.locations.length) return '<div class="text-xs text-gray-400">尚無據點</div>';
    return state.locations
      .map(
        (loc) => `
          <div class="bg-white border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <div class="font-semibold text-sm">${loc.name}</div>
              <div class="text-xs text-gray-500">${loc.description || '—'}</div>
            </div>
            <div class="flex gap-2 text-xs">
              <button class="px-3 py-1 bg-blue-600 text-white rounded" data-action="edit" data-id="${loc.id}">編輯</button>
              <button class="px-3 py-1 bg-red-600 text-white rounded" data-action="delete" data-id="${loc.id}">刪除</button>
            </div>
          </div>`
      )
      .join('');
  }

  list.addEventListener('click', (evt) => {
    const button = evt.target.closest('button[data-action]');
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === 'edit') {
      openLocationForm(id, render);
    } else if (action === 'delete') {
      deleteLocation(id, render);
    }
  });

  function openLocationForm(id = null, onChange = render) {
    const template = document.getElementById('simpleListTemplate');
    const form = template.content.firstElementChild.cloneNode(true);
    const location = id ? state.locations.find((item) => item.id === id) : null;
    if (location) {
      form.id.value = location.id;
      form.name.value = location.name;
      form.description.value = location.description ?? '';
      form.querySelector('[data-role="delete"]').classList.remove('hidden');
    }
    const modal = createModal({ title: location ? '編輯據點' : '新增據點', content: form });
    form.addEventListener('submit', (evt) => {
      evt.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const payload = {
        name: data.name.trim(),
        description: data.description.trim(),
      };
      if (!payload.name) {
        Swal.fire('請輸入名稱', '', 'warning');
        return;
      }

      (async () => {
        try {
          if (location) {
            await updateDoc(doc(db, 'locations', location.id), {
              ...payload,
              updatedAt: serverTimestamp(),
              updatedBy: state.currentUser?.id ?? null,
            });
            Object.assign(location, payload);
            Swal.fire('據點已更新', '', 'success');
          } else {
            const docRef = await addDoc(collection(db, 'locations'), {
              ...payload,
              createdAt: serverTimestamp(),
              createdBy: state.currentUser?.id ?? null,
            });
            state.locations.push({ id: docRef.id, ...payload });
            Swal.fire('據點已新增', '', 'success');
          }
          closeModal(modal);
          onChange();
        } catch (error) {
          Swal.fire('儲存失敗', mapFirebaseError(error), 'error');
        }
      })();
    });
    form.querySelector('[data-role="cancel"]').addEventListener('click', () => closeModal(modal));
    form.querySelector('[data-role="delete"]').addEventListener('click', () => {
      closeModal(modal);
      deleteLocation(id, onChange);
    });
  }

  function deleteLocation(id, onChange = render) {
    Swal.fire({
      title: '確定刪除據點？',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '刪除',
      confirmButtonColor: '#d33',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await deleteDoc(doc(db, 'locations', id));
        state.locations = state.locations.filter((item) => item.id !== id);
        onChange();
        populateLocationFilter();
        renderReports();
        renderTodaySummary();
        Swal.fire('已刪除', '', 'success');
      } catch (error) {
        Swal.fire('刪除失敗', mapFirebaseError(error), 'error');
      }
    });
  }
}

function showMenuEditModal() {
  if (!['admin', 'manager'].includes(state.currentUser?.role)) return;
  const content = document.createElement('div');
  content.className = 'space-y-4';

  const tabBar = document.createElement('div');
  tabBar.className = 'flex gap-2 flex-wrap';
  tabBar.innerHTML = `
    <button data-tab="templates" class="px-3 py-1.5 rounded text-sm bg-indigo-600 text-white">預設菜單</button>
    <button data-tab="history" class="px-3 py-1.5 rounded text-sm bg-gray-200 text-gray-700">歷史紀錄 / 統計</button>`;
  content.appendChild(tabBar);

  const templateView = document.createElement('div');
  const historyView = document.createElement('div');
  historyView.classList.add('hidden');

  content.appendChild(templateView);
  content.appendChild(historyView);

  const modal = createModal({ title: '菜單管理', content, wide: true });

  let activeTab = 'templates';
  let activeDay = window.__menuActiveDay || getCurrentMenuDay();
  const historyFilters = { start: '', end: '' };
  let recordDateValue = new Date().toISOString().slice(0, 10);

  const getLocationNames = () => state.locations.map((loc) => loc.name || loc.id);

  function updateTabButtons() {
    tabBar.querySelectorAll('button[data-tab]').forEach((btn) => {
      const isActive = btn.dataset.tab === activeTab;
      btn.className = `px-3 py-1.5 rounded text-sm ${isActive ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`;
    });
  }

  function switchTab(tab) {
    activeTab = tab;
    updateTabButtons();
    templateView.classList.toggle('hidden', tab !== 'templates');
    historyView.classList.toggle('hidden', tab !== 'history');
    if (tab === 'templates') {
      renderTemplateView();
    } else {
      renderHistoryView();
    }
  }

  tabBar.addEventListener('click', (evt) => {
    const btn = evt.target.closest('button[data-tab]');
    if (!btn) return;
    switchTab(btn.dataset.tab);
  });

  function renderTemplateView() {
    const template = ensureMenuTemplate(activeDay);
    const locations = getLocationNames();
    if (!locations.length) {
      templateView.innerHTML = '<div class="border border-amber-200 bg-amber-50 text-amber-700 text-sm rounded p-4">請先於據點管理新增據點，再設定預設菜單。</div>';
      return;
    }
    const dayButtons = DAY_KEYS.map((day) => {
      const active = day === activeDay ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700';
      return `<button data-day="${day}" class="px-3 py-1 text-xs border rounded ${active}">${DAY_LABELS[day]}</button>`;
    }).join('');

    const rows = template.items
      .map((item, index) => {
        const rowTotal = Object.values(item.defaultQuantity || {}).reduce((sum, qty) => sum + Number(qty || 0), 0) + Number(item.deliveryTotal || 0);
        const locationCells = locations
          .map((loc, locIndex) => {
            const value = item.defaultQuantity?.[loc] ?? 0;
            return `
              <td class="p-0 border">
                <input type="number" min="0" step="1" value="${value}"
                  data-field="qty" data-index="${index}" data-loc-index="${locIndex}"
                  class="w-full px-2 py-1 text-xs text-right border-0 focus:ring-1 focus:ring-blue-500" />
              </td>`;
          })
          .join('');
        return `
          <tr data-index="${index}">
            <td class="p-1 border align-top">
              <input data-field="name" data-index="${index}" value="${item.name || ''}" class="w-full px-2 py-1 text-xs border rounded" />
            </td>
            <td class="p-1 border align-top">
              <input type="number" min="0" step="1" data-field="price" data-index="${index}" value="${item.price ?? 0}"
                class="w-full px-2 py-1 text-xs text-right border rounded" />
            </td>
            ${locationCells}
            <td class="p-1 border align-top">
              <input type="number" min="0" step="1" data-field="delivery" data-index="${index}" value="${item.deliveryTotal ?? 0}"
                class="w-full px-2 py-1 text-xs text-right border rounded" />
            </td>
            <td class="p-1 border text-right font-semibold">
              <span data-role="row-total">${formatNumber(rowTotal)}</span>
            </td>
            <td class="p-1 border text-center">
              <div class="flex gap-1 justify-center">
                <button data-action="move-up" data-index="${index}" class="px-2 py-1 text-[11px] bg-slate-200 rounded">↑</button>
                <button data-action="move-down" data-index="${index}" class="px-2 py-1 text-[11px] bg-slate-200 rounded">↓</button>
              </div>
            </td>
            <td class="p-1 border text-center">
              <button data-action="remove-item" data-index="${index}" class="px-2 py-1 text-[11px] bg-red-100 text-red-600 rounded">刪除</button>
            </td>
          </tr>`;
      })
      .join('');

    const totals = computeMenuTotals(template);
    templateView.innerHTML = `
      <div class="flex flex-wrap justify-between items-center gap-3">
        <div class="flex flex-wrap gap-2">${dayButtons}</div>
        <div class="flex flex-wrap gap-2 items-center text-xs">
          <label class="flex items-center gap-2">
            <span>記錄日期</span>
            <input type="date" value="${recordDateValue}" data-field="record-date" class="border rounded px-2 py-1 text-xs" />
          </label>
          <button data-action="record-day" class="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs">記錄今日菜單</button>
          <button data-action="print-day" class="px-3 py-1.5 bg-slate-600 text-white rounded text-xs">列印</button>
        </div>
      </div>
      <div class="bg-slate-50 border rounded p-3 flex flex-wrap justify-between gap-3">
        <label class="flex-1 min-w-[220px]">
          <span class="block text-[11px] text-gray-500 mb-1">特餐名稱 (${DAY_LABELS[activeDay]})</span>
          <input type="text" data-field="daily-special" value="${template.dailySpecial?.name || ''}" class="w-full px-2 py-1 text-sm border rounded" placeholder="例如：限量蔥抓餅" />
        </label>
        <div class="flex items-end gap-2">
          <button data-action="add-item" class="px-3 py-1.5 bg-orange-500 text-white rounded text-xs">+ 新增品項</button>
        </div>
      </div>
      <div class="border rounded overflow-auto">
        <table class="w-full text-[12px]">
          <thead class="bg-slate-100 sticky top-0 z-10">
            <tr>
              <th class="p-2 border text-left">名稱</th>
              <th class="p-2 border text-right">單價</th>
              ${locations.map((loc) => `<th class="p-2 border text-center">${loc}</th>`).join('')}
              <th class="p-2 border text-right">外送</th>
              <th class="p-2 border text-right">合計</th>
              <th class="p-2 border text-center">排序</th>
              <th class="p-2 border text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="${locations.length + 5}" class="text-center text-gray-400 py-6">尚無品項</td></tr>`}
          </tbody>
          <tfoot class="bg-slate-50">
            <tr>
              <th class="p-2 border text-right" colspan="2">各據點總數</th>
              ${locations
                .map((_, idx) => `<th class="p-2 border text-right"><span data-role="loc-total" data-loc-index="${idx}">${formatNumber(totals.totalsByLocation[locations[idx]] || 0)}</span></th>`)
                .join('')}
              <th class="p-2 border text-right"><span data-role="delivery-total">${formatNumber(totals.deliveryTotal)}</span></th>
              <th class="p-2 border text-right"><span data-role="grand-total">${formatNumber(totals.grandTotal)}</span></th>
              <th class="p-2 border"></th>
              <th class="p-2 border"></th>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="grid md:grid-cols-2 gap-3 text-xs">
        <div class="border rounded p-3 bg-white">
          <div class="font-semibold mb-2 text-sm">當日統計</div>
          <ul class="space-y-1">
            ${locations
              .map((loc, idx) => `<li class="flex justify-between"><span>${loc}</span><span data-role="loc-total" data-loc-index="${idx}">${formatNumber(totals.totalsByLocation[loc] || 0)}</span></li>`)
              .join('')}
            <li class="flex justify-between text-emerald-600"><span>外送</span><span data-role="delivery-total">${formatNumber(totals.deliveryTotal)}</span></li>
            <li class="flex justify-between font-semibold"><span>總計</span><span data-role="grand-total">${formatNumber(totals.grandTotal)}</span></li>
          </ul>
        </div>
        <div class="border rounded p-3 bg-white space-y-2">
          <div class="font-semibold text-sm">使用提示</div>
          <p class="text-[11px] text-gray-500 leading-relaxed">輸入數量後會即時儲存；可使用 ↑ / ↓ 調整品項排序，點擊「記錄今日菜單」將目前設定存入歷史。</p>
        </div>
      </div>`;

    updateTemplateSummaries(template);
  }

  function updateTemplateSummaries(template) {
    const locations = getLocationNames();
    templateView.querySelectorAll('tr[data-index]').forEach((row) => {
      const index = Number(row.dataset.index);
      const item = template.items[index];
      if (!item) return;
      const rowTotal = Object.values(item.defaultQuantity || {}).reduce((sum, qty) => sum + Number(qty || 0), 0) + Number(item.deliveryTotal || 0);
      const target = row.querySelector('[data-role="row-total"]');
      if (target) target.textContent = formatNumber(rowTotal);
    });
    const totals = computeMenuTotals(template);
    locations.forEach((loc, idx) => {
      templateView.querySelectorAll(`[data-role="loc-total"][data-loc-index="${idx}"]`).forEach((el) => {
        el.textContent = formatNumber(totals.totalsByLocation[loc] || 0);
      });
    });
    templateView.querySelectorAll('[data-role="delivery-total"]').forEach((el) => {
      el.textContent = formatNumber(totals.deliveryTotal);
    });
    templateView.querySelectorAll('[data-role="grand-total"]').forEach((el) => {
      el.textContent = formatNumber(totals.grandTotal);
    });
  }

  function handleTemplateClick(evt) {
    const dayBtn = evt.target.closest('button[data-day]');
    if (dayBtn) {
      activeDay = dayBtn.dataset.day;
      window.__menuActiveDay = activeDay;
      renderTemplateView();
      return;
    }
    const actionBtn = evt.target.closest('button[data-action]');
    if (!actionBtn) return;
    const template = ensureMenuTemplate(activeDay);
    const { action } = actionBtn.dataset;
    if (action === 'add-item') {
      template.items.push({ id: generateId(), name: `新商品 ${template.items.length + 1}`, price: 0, defaultQuantity: {}, deliveryTotal: 0 });
      template.updatedAt = new Date().toISOString();
      persistMenuPlanner();
      renderTemplateView();
    } else if (action === 'move-up' || action === 'move-down') {
      const index = Number(actionBtn.dataset.index);
      const delta = action === 'move-up' ? -1 : 1;
      const targetIndex = index + delta;
      if (targetIndex < 0 || targetIndex >= template.items.length) return;
      const [item] = template.items.splice(index, 1);
      template.items.splice(targetIndex, 0, item);
      template.updatedAt = new Date().toISOString();
      persistMenuPlanner();
      renderTemplateView();
    } else if (action === 'remove-item') {
      const index = Number(actionBtn.dataset.index);
      Swal.fire({
        title: '刪除此品項？',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '刪除',
        confirmButtonColor: '#dc2626',
      }).then((res) => {
        if (!res.isConfirmed) return;
        template.items.splice(index, 1);
        template.updatedAt = new Date().toISOString();
        persistMenuPlanner();
        renderTemplateView();
      });
    } else if (action === 'record-day') {
      if (!template.items.length) {
        Swal.fire('尚無品項', '請先新增菜單品項再記錄。', 'info');
        return;
      }
      const snapshot = buildMenuSnapshot(template, recordDateValue || new Date().toISOString().slice(0, 10), activeDay);
      addMenuHistoryEntry(snapshot);
      Swal.fire('已記錄', `${snapshot.date} ${formatDayLabel(activeDay)} 菜單已存入歷史。`, 'success');
      renderHistoryView();
    } else if (action === 'print-day') {
      const snapshot = buildMenuSnapshot(template, recordDateValue || new Date().toISOString().slice(0, 10), activeDay);
      printMenuSnapshot(snapshot);
    }
  }

  function handleTemplateChange(evt) {
    const template = ensureMenuTemplate(activeDay);
    const target = evt.target;
    if (target.dataset.field === 'record-date') {
      recordDateValue = target.value || recordDateValue;
      return;
    }
    if (target.dataset.field === 'daily-special') {
      const name = target.value.trim();
      if (!template.dailySpecial) template.dailySpecial = {};
      template.dailySpecial.name = name;
      template.updatedAt = new Date().toISOString();
      persistMenuPlanner();
      return;
    }
    if (target.dataset.field === 'name') {
      const index = Number(target.dataset.index);
      if (!template.items[index]) return;
      template.items[index].name = target.value.trim();
      template.updatedAt = new Date().toISOString();
      persistMenuPlanner();
    } else if (target.dataset.field === 'price') {
      const index = Number(target.dataset.index);
      if (!template.items[index]) return;
      const value = Number(target.value);
      template.items[index].price = Number.isFinite(value) && value >= 0 ? value : 0;
      target.value = template.items[index].price;
      template.updatedAt = new Date().toISOString();
      persistMenuPlanner();
    }
    updateTemplateSummaries(template);
  }

  function handleTemplateInput(evt) {
    const target = evt.target;
    const template = ensureMenuTemplate(activeDay);
    if (!['qty', 'delivery'].includes(target.dataset.field)) return;
    const index = Number(target.dataset.index);
    if (!template.items[index]) return;
    const value = Number(target.value);
    const safeValue = Number.isFinite(value) && value >= 0 ? value : 0;
    target.value = safeValue;
    if (target.dataset.field === 'qty') {
      const locIndex = Number(target.dataset.locIndex);
      const locations = getLocationNames();
      const loc = locations[locIndex];
      if (!loc) return;
      if (!template.items[index].defaultQuantity) template.items[index].defaultQuantity = {};
      template.items[index].defaultQuantity[loc] = safeValue;
    } else if (target.dataset.field === 'delivery') {
      template.items[index].deliveryTotal = safeValue;
    }
    template.updatedAt = new Date().toISOString();
    persistMenuPlanner();
    updateTemplateSummaries(template);
  }

  templateView.addEventListener('click', handleTemplateClick);
  templateView.addEventListener('change', handleTemplateChange);
  templateView.addEventListener('input', handleTemplateInput);

  function renderHistoryView() {
    const allEntries = state.menuPlanner.history.slice();
    const filteredEntries = filterMenuHistory(historyFilters);
    const filteredStats = computeHistoryAggregates(filteredEntries);
    const globalStats = computeHistoryAggregates(allEntries);

    const currentLocations = getLocationNames();
    const locationSet = new Set(currentLocations);
    filteredEntries.forEach((entry) => {
      Object.keys(entry.totals.totalsByLocation || {}).forEach((loc) => locationSet.add(loc));
    });
    const locations = Array.from(locationSet);

    const rows = filteredEntries
      .map((entry) => {
        const locationCells = locations
          .map((loc) => `<td class="p-2 text-right">${formatNumber(entry.totals.totalsByLocation?.[loc] || 0)}</td>`)
          .join('');
        return `
          <tr data-id="${entry.id}" class="border-b hover:bg-indigo-50/40">
            <td class="p-2">${entry.date}</td>
            <td class="p-2">${formatDayLabel(entry.dayKey)}</td>
            ${locationCells}
            <td class="p-2 text-right">${formatNumber(entry.totals.deliveryTotal)}</td>
            <td class="p-2 text-right font-semibold">${formatNumber(entry.totals.grandTotal)}</td>
            <td class="p-2 text-center">
              <div class="flex gap-1 justify-center">
                <button data-action="history-view" data-id="${entry.id}" class="px-2 py-1 text-xs bg-blue-600 text-white rounded">查看</button>
                <button data-action="history-print" data-id="${entry.id}" class="px-2 py-1 text-xs bg-slate-600 text-white rounded">列印</button>
                <button data-action="history-restore" data-id="${entry.id}" class="px-2 py-1 text-xs bg-emerald-600 text-white rounded">套用</button>
                <button data-action="history-delete" data-id="${entry.id}" class="px-2 py-1 text-xs bg-red-600 text-white rounded">刪除</button>
              </div>
            </td>
          </tr>`;
      })
      .join('');

    historyView.innerHTML = `
      <div class="flex flex-wrap gap-3 items-end">
        <div>
          <label class="block text-[11px] text-gray-500">開始日期</label>
          <input type="date" data-field="history-start" value="${historyFilters.start || ''}" class="border rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label class="block text-[11px] text-gray-500">結束日期</label>
          <input type="date" data-field="history-end" value="${historyFilters.end || ''}" class="border rounded px-2 py-1 text-sm" />
        </div>
        <button data-action="history-reset" class="px-3 py-1.5 bg-gray-300 text-sm rounded">重置</button>
      </div>
      <div class="grid md:grid-cols-2 gap-3 text-xs">
        <div class="border rounded p-3 bg-white">
          <div class="font-semibold text-sm mb-2">篩選結果 (${filteredEntries.length} 筆)</div>
          <ul class="space-y-1">
            ${locations
              .map((loc) => `<li class="flex justify-between"><span>${loc}</span><span>${formatNumber(filteredStats.totalsByLocation[loc] || 0)}</span></li>`)
              .join('')}
            <li class="flex justify-between text-emerald-600"><span>外送</span><span>${formatNumber(filteredStats.deliveryTotal)}</span></li>
            <li class="flex justify-between font-semibold"><span>總計</span><span>${formatNumber(filteredStats.grandTotal)}</span></li>
          </ul>
        </div>
        <div class="border rounded p-3 bg-white">
          <div class="font-semibold text-sm mb-2">本週 / 本月累計</div>
          <div class="space-y-2">
            <div>
              <div class="text-[11px] text-gray-500">近 7 日</div>
              <div class="flex justify-between text-sm font-semibold">總量 <span>${formatNumber(globalStats.weeklyGrand)}</span></div>
            </div>
            <div>
              <div class="text-[11px] text-gray-500">本月累積</div>
              <div class="flex justify-between text-sm font-semibold">總量 <span>${formatNumber(globalStats.monthlyGrand)}</span></div>
            </div>
          </div>
        </div>
      </div>
      <div class="border rounded overflow-auto">
        <table class="w-full text-[12px]">
          <thead class="bg-slate-100">
            <tr>
              <th class="p-2 text-left">日期</th>
              <th class="p-2 text-left">週別</th>
              ${locations.map((loc) => `<th class="p-2 text-right">${loc}</th>`).join('')}
              <th class="p-2 text-right">外送</th>
              <th class="p-2 text-right">合計</th>
              <th class="p-2 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="${locations.length + 4}" class="text-center text-gray-400 py-6">尚無歷史紀錄</td></tr>`}
          </tbody>
        </table>
      </div>`;
  }

  function handleHistoryChange(evt) {
    if (evt.target.dataset.field === 'history-start') {
      historyFilters.start = evt.target.value || '';
      renderHistoryView();
    } else if (evt.target.dataset.field === 'history-end') {
      historyFilters.end = evt.target.value || '';
      renderHistoryView();
    }
  }

  function showHistoryDetail(id) {
    const entry = state.menuPlanner.history.find((item) => item.id === id);
    if (!entry) return;
    const locations = Array.from(new Set([...getLocationNames(), ...Object.keys(entry.totals.totalsByLocation || {})]));
    const table = document.createElement('table');
    table.className = 'w-full text-xs border';
    table.innerHTML = `
      <thead class="bg-slate-100">
        <tr>
          <th class="p-2 border">品項</th>
          <th class="p-2 border text-right">單價</th>
          ${locations.map((loc) => `<th class="p-2 border text-right">${loc}</th>`).join('')}
          <th class="p-2 border text-right">外送</th>
          <th class="p-2 border text-right">合計</th>
        </tr>
      </thead>
      <tbody>
        ${entry.items
          .map((item) => {
            const rowTotal = Object.values(item.defaultQuantity || {}).reduce((sum, qty) => sum + Number(qty || 0), 0) + Number(item.deliveryTotal || 0);
            return `
              <tr>
                <td class="p-2 border">${item.name}</td>
                <td class="p-2 border text-right">${formatNumber(item.price || 0)}</td>
                ${locations.map((loc) => `<td class="p-2 border text-right">${formatNumber(item.defaultQuantity?.[loc] || 0)}</td>`).join('')}
                <td class="p-2 border text-right">${formatNumber(item.deliveryTotal || 0)}</td>
                <td class="p-2 border text-right">${formatNumber(rowTotal)}</td>
              </tr>`;
          })
          .join('')}
      </tbody>
    `;
    createModal({
      title: `${entry.date} ${formatDayLabel(entry.dayKey)} 菜單`,
      content: table,
      wide: true,
    });
  }

  function handleHistoryClick(evt) {
    const actionBtn = evt.target.closest('button[data-action]');
    if (!actionBtn) return;
    const { action, id } = actionBtn.dataset;
    if (action === 'history-reset') {
      historyFilters.start = '';
      historyFilters.end = '';
      renderHistoryView();
    } else if (action === 'history-view') {
      showHistoryDetail(id);
    } else if (action === 'history-print') {
      const entry = state.menuPlanner.history.find((item) => item.id === id);
      if (entry) printMenuSnapshot(entry);
    } else if (action === 'history-restore') {
      const entry = state.menuPlanner.history.find((item) => item.id === id);
      if (!entry) return;
      const template = ensureMenuTemplate(entry.dayKey);
      template.items = cloneMenuData(entry.items || []);
      template.dailySpecial = entry.dailySpecial ? { ...entry.dailySpecial } : { name: '', price: 0 };
      template.updatedAt = new Date().toISOString();
      persistMenuPlanner();
      activeDay = entry.dayKey;
      window.__menuActiveDay = entry.dayKey;
      Swal.fire('已套用', `${entry.date} 菜單已套用至 ${DAY_LABELS[entry.dayKey]}`, 'success');
      switchTab('templates');
    } else if (action === 'history-delete') {
      const index = state.menuPlanner.history.findIndex((item) => item.id === id);
      if (index === -1) return;
      Swal.fire({
        title: '刪除這筆紀錄？',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '刪除',
        confirmButtonColor: '#dc2626',
      }).then((res) => {
        if (!res.isConfirmed) return;
        state.menuPlanner.history.splice(index, 1);
        persistMenuPlanner();
        renderHistoryView();
      });
    }
  }

  historyView.addEventListener('change', handleHistoryChange);
  historyView.addEventListener('click', handleHistoryClick);

  switchTab(activeTab);
}


function showStaffManageModal() {
  if (!['admin', 'manager'].includes(state.currentUser?.role)) return;
  const content = document.createElement('div');
  content.className = 'space-y-4';
  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>姓名</th>
        <th>角色</th>
        <th>Email</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody></tbody>`;
  const tbody = table.querySelector('tbody');
  content.appendChild(table);
  const addBtn = document.createElement('button');
  addBtn.className = 'px-3 py-2 bg-sky-500 text-white rounded text-sm';
  addBtn.textContent = '新增人員';
  content.appendChild(addBtn);

  const modal = createModal({ title: '人員管理', content, wide: true });

  function render() {
    tbody.innerHTML = '';
    state.staff.forEach((staff) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${staff.name}</td>
        <td><span class="badge badge-${staff.role}">${staff.role}</span></td>
        <td>${staff.email}</td>
        <td class="flex gap-2">
          <button class="px-2 py-1 bg-blue-600 text-white rounded text-xs" data-action="edit" data-id="${staff.id}">編輯</button>
          <button class="px-2 py-1 bg-red-600 text-white rounded text-xs" data-action="delete" data-id="${staff.id}">刪除</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  tbody.addEventListener('click', (evt) => {
    const button = evt.target.closest('button[data-action]');
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === 'edit') {
      openStaffForm(id);
    } else if (action === 'delete') {
      deleteStaff(id);
    }
  });

  addBtn.addEventListener('click', () => openStaffForm());

  function openStaffForm(id = null) {
    const form = document.createElement('form');
    form.className = 'space-y-3';
    form.innerHTML = `
      <input type="hidden" name="id" />
      <div>
        <label class="text-xs text-gray-500">姓名</label>
        <input type="text" name="name" required class="w-full border rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="text-xs text-gray-500">Email</label>
        <input type="email" name="email" required class="w-full border rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="text-xs text-gray-500">角色</label>
        <select name="role" class="w-full border rounded px-3 py-2 text-sm">
          <option value="staff">staff</option>
          <option value="manager">manager</option>
          <option value="admin">admin</option>
        </select>
      </div>
      <div class="flex justify-between items-center">
        <button type="button" data-role="delete" class="px-3 py-2 bg-red-100 text-red-600 rounded hidden">刪除</button>
        <div class="flex gap-2">
          <button type="button" data-role="cancel" class="px-3 py-2 bg-gray-200 rounded">取消</button>
          <button type="submit" class="px-3 py-2 bg-sky-500 text-white rounded">儲存</button>
        </div>
      </div>`;

    const staff = id ? state.staff.find((item) => item.id === id) : null;
    if (staff) {
      form.id.value = staff.id;
      form.name.value = staff.name;
      form.email.value = staff.email;
      form.role.value = staff.role;
      form.querySelector('[data-role="delete"]').classList.remove('hidden');
    }

    const modal = createModal({ title: staff ? '編輯人員' : '新增人員', content: form });

    form.addEventListener('submit', (evt) => {
      evt.preventDefault();
      const formData = Object.fromEntries(new FormData(form).entries());
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
      };
      if (!payload.name) {
        Swal.fire('請輸入姓名', '', 'warning');
        return;
      }

      (async () => {
        try {
          if (staff) {
            await updateDoc(doc(db, 'users', staff.id), {
              ...payload,
              updatedAt: serverTimestamp(),
              updatedBy: state.currentUser?.id ?? null,
            });
            Object.assign(staff, payload);
            Swal.fire('人員已更新', '', 'success');
          } else {
            const docRef = await addDoc(collection(db, 'users'), {
              ...payload,
              createdAt: serverTimestamp(),
              createdBy: state.currentUser?.id ?? null,
            });
            state.staff.push({ id: docRef.id, ...payload });
            Swal.fire('人員已新增', '', 'success');
          }
          closeModal(modal);
          render();
          renderReports();
        } catch (error) {
          Swal.fire('儲存失敗', mapFirebaseError(error), 'error');
        }
      })();
    });

    form.querySelector('[data-role="cancel"]').addEventListener('click', () => closeModal(modal));
    form.querySelector('[data-role="delete"]').addEventListener('click', () => {
      closeModal(modal);
      deleteStaff(id);
    });
  }

  function deleteStaff(id) {
    if (state.currentUser?.id === id) {
      Swal.fire('無法刪除自己', '', 'warning');
      return;
    }
    Swal.fire({
      title: '確定刪除人員？',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '刪除',
      confirmButtonColor: '#d33',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await deleteDoc(doc(db, 'users', id));
        state.staff = state.staff.filter((item) => item.id !== id);
        render();
        Swal.fire('已刪除', '', 'success');
      } catch (error) {
        Swal.fire('刪除失敗', mapFirebaseError(error), 'error');
      }
    });
  }

  render();
}

function openPointsModal() {
  const content = document.createElement('div');
  content.className = 'space-y-3 text-sm';
  content.innerHTML = `
    <div>目前點數：<span class="point-pill">${state.currentUser?.points ?? 120}</span></div>
    <div class="space-y-2">
      <div class="font-semibold text-sm">可兌換獎勵</div>
      <ul class="list-disc pl-5 space-y-1">
        <li>衛生紙一串（5 點）</li>
        <li>咖啡券（6 點）</li>
        <li>按摩券（25 點）</li>
      </ul>
    </div>`;
  createModal({ title: '點數 / 商城', content });
}

function openWishPoolModal() {
  const content = document.createElement('div');
  content.className = 'space-y-4';
  const list = document.createElement('div');
  list.className = 'space-y-3';
  const form = document.createElement('form');
  form.className = 'space-y-3';
  form.innerHTML = `
    <div>
      <label class="text-xs text-gray-500">願望</label>
      <input type="text" name="title" required class="w-full border rounded px-3 py-2 text-sm" placeholder="寫下你的想法" />
    </div>
    <div class="flex justify-end gap-2">
      <button type="submit" class="px-3 py-2 bg-fuchsia-500 text-white rounded">新增願望</button>
    </div>`;
  content.appendChild(form);
  content.appendChild(list);

  const modal = createModal({ title: '許願池', content, wide: true });

  function render() {
    if (!state.wishes.length) {
      list.innerHTML = '<div class="text-xs text-gray-400">還沒有願望，來當第一個吧！</div>';
      return;
    }
    list.innerHTML = state.wishes
      .map(
        (wish) => `
          <div class="wish-card">
            <div class="flex justify-between items-start">
              <div class="font-semibold">${wish.title}</div>
              <span class="wish-status wish-${wish.status}">${wish.status}</span>
            </div>
            <div class="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <button class="vote-btn" data-action="vote" data-id="${wish.id}">👍 ${wish.votes}</button>
              <button class="vote-btn" data-action="toggle" data-id="${wish.id}">切換狀態</button>
              <button class="vote-btn" data-action="delete" data-id="${wish.id}">刪除</button>
            </div>
          </div>`
      )
      .join('');
  }

  list.addEventListener('click', (evt) => {
    const button = evt.target.closest('button[data-action]');
    if (!button) return;
    const { action, id } = button.dataset;
    const wish = state.wishes.find((item) => item.id === id);
    if (!wish) return;
    (async () => {
      try {
        if (action === 'vote') {
          const newVotes = (wish.votes || 0) + 1;
          await updateDoc(doc(db, 'wishes', id), {
            votes: newVotes,
            updatedAt: serverTimestamp(),
            updatedBy: state.currentUser?.id ?? null,
          });
          wish.votes = newVotes;
        } else if (action === 'toggle') {
          const order = ['pending', 'approved', 'fulfilled'];
          const index = order.indexOf(wish.status);
          const nextStatus = order[(index + 1) % order.length];
          await updateDoc(doc(db, 'wishes', id), {
            status: nextStatus,
            updatedAt: serverTimestamp(),
            updatedBy: state.currentUser?.id ?? null,
          });
          wish.status = nextStatus;
        } else if (action === 'delete') {
          await deleteDoc(doc(db, 'wishes', id));
          state.wishes = state.wishes.filter((item) => item.id !== id);
          Swal.fire('已刪除', '', 'success');
        }
        render();
      } catch (error) {
        Swal.fire('操作失敗', mapFirebaseError(error), 'error');
      }
    })();
  });

  form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const title = form.title.value.trim();
    if (!title) {
      Swal.fire('請輸入願望內容', '', 'warning');
      return;
    }
    (async () => {
      try {
        const docRef = await addDoc(collection(db, 'wishes'), {
          title,
          status: 'pending',
          votes: 0,
          createdAt: serverTimestamp(),
          createdBy: state.currentUser?.id ?? null,
        });
        state.wishes.push({ id: docRef.id, title, status: 'pending', votes: 0 });
        form.reset();
        render();
      } catch (error) {
        Swal.fire('新增失敗', mapFirebaseError(error), 'error');
      }
    })();
  });

  render();
}

function openScheduleModal() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
  const days = Array.from({ length: 7 }, (_, idx) => {
    const date = new Date(start);
    date.setDate(start.getDate() + idx);
    return date;
  });
  const schedule = document.createElement('div');
  schedule.className = 'schedule-calendar';
  days.forEach((day) => {
    const dateStr = formatDate(day.toISOString());
    const cell = document.createElement('div');
    cell.className = 'schedule-day';
    if (formatDate(day.toISOString()) === formatDate(today.toISOString())) {
      cell.classList.add('schedule-today');
    }
    cell.innerHTML = `
      <header><span>${day.getMonth() + 1}/${day.getDate()}</span><button class="text-xs text-indigo-500" data-date="${dateStr}">新增班表</button></header>
      <div class="schedule-empty">尚未排班</div>`;
    schedule.appendChild(cell);
  });

  const modal = createModal({ title: '本週班表', content: schedule, wide: true });

  schedule.addEventListener('click', (evt) => {
    const button = evt.target.closest('button[data-date]');
    if (!button) return;
    const date = button.dataset.date;
    openShiftForm(date, () => {
      closeModal(modal);
      openScheduleModal();
    });
  });
}

function openShiftForm(date, onSave) {
  const form = document.createElement('form');
  form.className = 'space-y-3';
  form.innerHTML = `
    <div class="text-sm text-gray-600">日期：${date}</div>
    <div>
      <label class="text-xs text-gray-500">班別</label>
      <select name="shift" class="w-full border rounded px-3 py-2 text-sm">
        <option value="MORNING">早班</option>
        <option value="LUNCH">午班</option>
        <option value="FULL">全日</option>
        <option value="REST">休假</option>
      </select>
    </div>
    <div>
      <label class="text-xs text-gray-500">人員</label>
      <select name="staff" class="w-full border rounded px-3 py-2 text-sm">
        ${state.staff.map((user) => `<option value="${user.id}">${user.name}</option>`).join('')}
      </select>
    </div>
    <div class="flex justify-end gap-2">
      <button type="button" data-role="cancel" class="px-3 py-2 bg-gray-200 rounded">取消</button>
      <button type="submit" class="px-3 py-2 bg-teal-500 text-white rounded">儲存</button>
    </div>`;

  const modal = createModal({ title: '新增班表', content: form });

  form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    Swal.fire('班表已儲存', '', 'success');
    closeModal(modal);
    onSave?.();
  });
  form.querySelector('[data-role="cancel"]').addEventListener('click', () => closeModal(modal));
}

function mapFirebaseError(error) {
  if (!error || typeof error !== 'object') return '未知錯誤';
  const { code, message } = error;
  const map = {
    'auth/invalid-email': '電子郵件格式錯誤',
    'auth/user-disabled': '帳號已停用',
    'auth/user-not-found': '找不到使用者',
    'auth/wrong-password': '密碼錯誤',
    'auth/too-many-requests': '嘗試次數過多，請稍後再試',
  };
  return map[code] || message || code || '未知錯誤';
}

async function handleLogin(evt) {
  evt.preventDefault();
  const email = dom.email.value.trim();
  const password = dom.password.value;
  if (!email || !password) {
    Swal.fire('請輸入帳號與密碼', '', 'warning');
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    Swal.fire('登入失敗', mapFirebaseError(error), 'error');
  }
}

function refreshCurrentUserUi() {
  setFeatureVisibility();
  renderLevelInfo();
  renderQuarterIncentive();
  renderUserSummary();
}

function renderAfterLogin() {
  refreshCurrentUserUi();
  renderAnnouncements();
  populateLocationFilter();
  renderReports();
  renderTodaySummary();
  renderWishList();
}

async function loadCurrentUserProfile(uid) {
  try {
    const snapshot = await getDoc(doc(db, 'users', uid));
    if (snapshot.exists()) {
      updateCurrentUserFromDoc(snapshot.data());
    } else {
      updateCurrentUserFromDoc({});
    }
  } catch (error) {
    console.warn('[auth] load profile failed', error);
    updateCurrentUserFromDoc({});
  }
}

function cleanupAfterLogout() {
  unsubscribeAll();
  state.currentUser = null;
  state.currentUserDoc = null;
  state.announcements = [];
  state.reports = [];
  state.locations = [];
  state.staff = [];
  state.wishes = [];
  dom.loginForm.reset();
  dom.mainSystem.classList.add('hidden');
  dom.loginPage.classList.remove('hidden');
  renderAnnouncements();
  renderReports();
  renderTodaySummary();
  renderWishList();
  refreshCurrentUserUi();
  dom.quarterIncentivePanel.textContent = '--';
  dom.quarterIncentiveBadge.textContent = '';
  dom.todaySummary.textContent = '--';
  dom.quickTodayStats.textContent = '--';
}

function renderTodaySummary() {
  const todaySummary = dom.todaySummary;
  if (!state.locations.length) {
    todaySummary.textContent = '--';
    return;
  }
  todaySummary.innerHTML = state.locations
    .map((loc) => {
      const report = state.reports.find((item) => item.location === loc.name);
      return `<div class="summary-tile">
        <div class="text-sm font-semibold">${loc.name}</div>
        <div class="text-xs text-gray-500">${report ? report.status : '尚無戰報'}</div>
      </div>`;
    })
    .join('');

  dom.quickTodayStats.textContent = `今日戰報 ${state.reports.length} 筆 · 公告 ${state.announcements.length} 則 · 願望 ${state.wishes.length} 則`;
}

function renderWishList() {
  // 主畫面目前無願望列表，保留函式供資料更新時觸發其他視覺同步需求。
}

async function handleLogout() {
  try {
    await signOut(auth);
  } catch (error) {
    Swal.fire('登出失敗', mapFirebaseError(error), 'error');
  }
}

function showRegisterHint() {
  Swal.fire('提示', '請聯絡管理員建立帳號。', 'info');
}

async function showResetPassword() {
  const email = dom.email.value.trim();
  if (!email) {
    Swal.fire('請先輸入 Email', '', 'warning');
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    Swal.fire('已寄出重設信', `${email} 請至信箱確認`, 'success');
  } catch (error) {
    Swal.fire('寄送失敗', mapFirebaseError(error), 'error');
  }
}

function quickLogin(role) {
  const preset = QUICK_LOGIN_PRESETS[role] || QUICK_LOGIN_PRESETS.staff;
  if (!preset) return;
  dom.email.value = preset.email;
  dom.password.value = preset.password;
}

function exportReportsCsv() {
  const data = applyReportFilters();
  if (!data.length) {
    Swal.fire('沒有資料可匯出', '', 'info');
    return;
  }
  const header = ['日期', '據點', '狀態', '負責人', '摘要'];
  const rows = data.map((report) => [report.date, report.location, report.status, getStaffName(report.owner), report.summary]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `reports_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportReportsExcel() {
  Swal.fire('提示', 'Excel 匯出示範僅產生 CSV，請使用 CSV 檔案。', 'info');
  exportReportsCsv();
}

function printReports() {
  window.print();
}

function initDomRefs() {
  dom.loginPage = qs('#loginPage');
  dom.mainSystem = qs('#mainSystem');
  dom.loginForm = qs('#loginForm');
  dom.email = qs('#email');
  dom.password = qs('#password');
  dom.levelDisplay = qs('#levelDisplay');
  dom.currentUserName = qs('#currentUserName');
  dom.currentUserRoleBadge = qs('#currentUserRoleBadge');
  dom.quarterIncentiveBadge = qs('#quarterIncentiveBadge');
  dom.quarterIncentivePanel = qs('#quarterIncentivePanel');
  dom.todaySummary = qs('#todaySummary');
  dom.quickTodayStats = qs('#quickTodayStats');
  dom.announcementsArea = qs('#announcementsArea');
  dom.btnStaffManage = qs('#btnStaffManage');
  dom.btnReportManage = qs('#btnReportManage');
  dom.btnAnnManage = qs('#btnAnnManage');
  dom.addAnnBtn = qs('#addAnnBtn');
  dom.btnMenuManage = qs('#btnMenuManage');
  dom.btnLocationManage = qs('#btnLocationManage');
  dom.reportsContainer = qs('#reportsContainer');
  dom.reportsEmpty = qs('#reportsEmpty');
  dom.reportAggregates = qs('#reportAggregates');
  dom.filterStart = qs('#filterStart');
  dom.filterEnd = qs('#filterEnd');
  dom.filterLocation = qs('#filterLocation');
  dom.filterStatus = qs('#filterStatus');
}

function initEventBindings() {
  dom.loginForm.addEventListener('submit', handleLogin);
  qs('#btnLogout').addEventListener('click', handleLogout);
  qs('#btnRegisterHint').addEventListener('click', showRegisterHint);
  qs('#btnResetPassword').addEventListener('click', showResetPassword);
  qsa('[data-quick]').forEach((btn) => btn.addEventListener('click', () => quickLogin(btn.dataset.quick)));
  qs('#btnPoints').addEventListener('click', openPointsModal);
  qs('#btnWishPool').addEventListener('click', openWishPoolModal);
  qs('#btnSchedule').addEventListener('click', openScheduleModal);
  dom.btnStaffManage.addEventListener('click', showStaffManageModal);
  qs('#btnCreateReport').addEventListener('click', () => openReportModal());
  qs('#btnScrollReports').addEventListener('click', () => qs('#reportsSection').scrollIntoView({ behavior: 'smooth' }));
  dom.btnReportManage.addEventListener('click', openReportManageModal);
  dom.btnAnnManage.addEventListener('click', showAnnouncementManageModal);
  dom.addAnnBtn.addEventListener('click', () => openAnnouncementModal());
  dom.btnMenuManage.addEventListener('click', showMenuEditModal);
  dom.btnLocationManage.addEventListener('click', showLocationManageModal);
  qs('#btnApplyReportFilters').addEventListener('click', () => renderReports());
  qs('#btnResetReportFilters').addEventListener('click', resetReportFilters);
  qs('#btnExportReportsCsv').addEventListener('click', exportReportsCsv);
  qs('#btnExportReportsExcel').addEventListener('click', exportReportsExcel);
  qs('#btnPrintReports').addEventListener('click', printReports);
}

function bootstrap() {
  initDomRefs();
  initEventBindings();
  renderAnnouncements();

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      state.currentUser = {
        id: user.uid,
        email: user.email ?? '',
        displayName: user.displayName || user.email || '',
        role: state.currentUser?.role ?? 'staff',
        bv: state.currentUser?.bv ?? 360,
      };
      dom.loginPage.classList.add('hidden');
      dom.mainSystem.classList.remove('hidden');
      renderAfterLogin();
      await loadCurrentUserProfile(user.uid);
      subscribeToCollections(user.uid);
    } else {
      cleanupAfterLogout();
    }
  });
}

document.addEventListener('DOMContentLoaded', bootstrap);
