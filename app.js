import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAReTBGcVEi6JC0gRZWS110ePOv8kJ_hm0',
  authDomain: 'newreport-89d34.firebaseapp.com',
  projectId: 'newreport-89d34',
  storageBucket: 'newreport-89d34.firebasestorage.app',
  messagingSenderId: '894484318701',
  appId: '1:894484318701:web:9dc4752226de8a47207fe4',
  measurementId: 'G-J463N8284H',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const SUPER_ADMIN_EMAILS = ['k987045762@gmail.com'];

const loginPage = document.getElementById('loginPage');
const appPage = document.getElementById('app');
const loginForm = document.getElementById('loginForm');
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const resetPasswordButton = document.getElementById('resetPassword');
const logoutButton = document.getElementById('logoutButton');
const statusMessage = document.getElementById('statusMessage');
const userEmailDisplay = document.getElementById('userEmail');
const userRoleDisplay = document.getElementById('userRole');
const staffHint = document.getElementById('staffHint');

const announcementForm = document.getElementById('announcementForm');
const announcementList = document.getElementById('announcementList');
const announcementSubmitButton = document.getElementById('announcementSubmit');
const announcementCancelButton = document.getElementById('announcementCancel');

const locationForm = document.getElementById('locationForm');
const locationNameInput = document.getElementById('locationName');
const locationList = document.getElementById('locationList');
const locationOptions = document.getElementById('locationOptions');
const locationSubmitButton = document.getElementById('locationSubmit');
const locationCancelButton = document.getElementById('locationCancel');

const staffForm = document.getElementById('staffForm');
const staffUidInput = document.getElementById('staffUid');
const staffEmailInput = document.getElementById('staffEmail');
const staffNameInput = document.getElementById('staffName');
const staffRoleSelect = document.getElementById('staffRole');
const staffFormReset = document.getElementById('staffFormReset');
const staffDeleteButton = document.getElementById('staffDeleteButton');
const staffTableBody = document.getElementById('staffTableBody');

const reportForm = document.getElementById('reportForm');
const reportDateInput = document.getElementById('reportDate');
const reportLocationInput = document.getElementById('reportLocation');
const reportSalesInput = document.getElementById('reportSales');
const reportNotesInput = document.getElementById('reportNotes');
const reportTableBody = document.getElementById('reportTableBody');
const reportSubmitButton = document.getElementById('reportSubmit');
const reportCancelButton = document.getElementById('reportCancel');

const menuForm = document.getElementById('menuForm');
const menuDateInput = document.getElementById('menuDate');
const menuLocationInput = document.getElementById('menuLocation');
const menuItemInput = document.getElementById('menuItem');
const menuQuantityInput = document.getElementById('menuQuantity');
const menuNotesInput = document.getElementById('menuNotes');
const menuTableBody = document.getElementById('menuTableBody');
const menuSubmitButton = document.getElementById('menuSubmit');
const menuCancelButton = document.getElementById('menuCancel');

const scheduleForm = document.getElementById('scheduleForm');
const scheduleDateInput = document.getElementById('scheduleDate');
const scheduleStaffInput = document.getElementById('scheduleStaff');
const scheduleShiftInput = document.getElementById('scheduleShift');
const scheduleNotesInput = document.getElementById('scheduleNotes');
const scheduleTableBody = document.getElementById('scheduleTableBody');
const scheduleSubmitButton = document.getElementById('scheduleSubmit');
const scheduleCancelButton = document.getElementById('scheduleCancel');

const wishForm = document.getElementById('wishForm');
const wishTitleInput = document.getElementById('wishTitle');
const wishDescriptionInput = document.getElementById('wishDescription');
const wishList = document.getElementById('wishList');
const wishSubmitButton = document.getElementById('wishSubmit');
const wishCancelButton = document.getElementById('wishCancel');

const storeForm = document.getElementById('storeForm');
const storeItemInput = document.getElementById('storeItem');
const storeQuantityInput = document.getElementById('storeQuantity');
const storeNotesInput = document.getElementById('storeNotes');
const storeTableBody = document.getElementById('storeTableBody');
const storeSubmitButton = document.getElementById('storeSubmit');
const storeCancelButton = document.getElementById('storeCancel');

const staffOptionsList = document.getElementById('staffOptions');
const staffFeatureInputs = staffForm
  ? Array.from(staffForm.querySelectorAll('input[name="staffFeature"]'))
  : [];
const featureSections = document.querySelectorAll('[data-feature]');

const statTotalReports = document.getElementById('statTotalReports');
const statMonthlySales = document.getElementById('statMonthlySales');
const statMenuEntries = document.getElementById('statMenuEntries');
const statStaffCount = document.getElementById('statStaffCount');

const FEATURE_LABELS = {
  reports: '戰報',
  menu: '菜單管理',
  schedule: '排班',
  wishes: '許願池',
  store: '點數商城',
};
const ALL_FEATURE_KEYS = Object.keys(FEATURE_LABELS);
const DEFAULT_STAFF_FEATURES = [...ALL_FEATURE_KEYS];

let currentUser = null;
let currentRole = 'guest';
let currentFeatureAccess = [...DEFAULT_STAFF_FEATURES];
let announcementsCache = [];
let locationsCache = [];
let reportsCache = [];
let menuCache = [];
let scheduleCache = [];
let wishCache = [];
let storeCache = [];
let staffCache = [];
let editingStaffId = null;
let editingAnnouncementId = null;
let editingLocationId = null;
let editingReportId = null;
let editingMenuEntryId = null;
let editingScheduleId = null;
let editingWishId = null;
let editingStoreId = null;

let unsubscribeAnnouncements = null;
let unsubscribeLocations = null;
let unsubscribeReports = null;
let unsubscribeMenu = null;
let unsubscribeSchedule = null;
let unsubscribeWishes = null;
let unsubscribeStore = null;
let unsubscribeUsers = null;

function toMillis(value) {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') {
    const date = value.toDate();
    return date instanceof Date ? date.getTime() : null;
  }
  return null;
}

function isSuperAdminUser(user) {
  if (!user || !user.email) return false;
  return SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase());
}

function isAdmin() {
  return currentRole === 'admin' || isSuperAdminUser(currentUser);
}

function sanitizeFeatureAccess(raw, fallback = DEFAULT_STAFF_FEATURES) {
  const list = Array.isArray(raw) ? raw : [];
  const seen = new Set();
  const result = [];
  list.forEach((item) => {
    const key = String(item || '').trim();
    if (key && ALL_FEATURE_KEYS.includes(key) && !seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  });
  if (!result.length && Array.isArray(fallback)) {
    fallback.forEach((item) => {
      const key = String(item || '').trim();
      if (key && ALL_FEATURE_KEYS.includes(key) && !seen.has(key)) {
        seen.add(key);
        result.push(key);
      }
    });
  }
  return result;
}

function computeFeatureAccess(role, requested) {
  if (role === 'admin' || isSuperAdminUser(currentUser)) {
    return [...ALL_FEATURE_KEYS];
  }
  return sanitizeFeatureAccess(requested, DEFAULT_STAFF_FEATURES);
}

function hasFeature(feature) {
  if (!feature) return true;
  return isAdmin() || currentFeatureAccess.includes(feature);
}

function applyFeatureVisibility() {
  featureSections.forEach((section) => {
    const feature = section.dataset.feature;
    section.classList.toggle('hidden', !hasFeature(feature));
  });
}

function setCurrentFeatureAccess(access) {
  if (isAdmin()) {
    currentFeatureAccess = [...ALL_FEATURE_KEYS];
  } else {
    currentFeatureAccess = sanitizeFeatureAccess(access, DEFAULT_STAFF_FEATURES);
  }
  applyFeatureVisibility();
}

function setStatus(message, state = 'info', timeout = 0) {
  if (!statusMessage) return;
  statusMessage.textContent = message || '';
  if (state === 'error') {
    statusMessage.dataset.state = 'error';
  } else {
    delete statusMessage.dataset.state;
  }
  if (timeout > 0 && message) {
    setTimeout(() => {
      if (statusMessage.textContent === message) {
        statusMessage.textContent = '';
        delete statusMessage.dataset.state;
      }
    }, timeout);
  }
}

function mapAuthError(error) {
  if (!error || !error.code) return '登入失敗，請稍後再試。';
  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return '帳號或密碼錯誤。';
    case 'auth/user-not-found':
      return '找不到此帳號，請向管理員確認。';
    case 'auth/too-many-requests':
      return '嘗試次數過多，請稍後再試。';
    case 'auth/network-request-failed':
      return '網路連線異常，請檢查網路後重試。';
    case 'auth/configuration-not-found':
      return '尚未在 Firebase Console 啟用 Email/Password 登入。';
    default:
      return `登入失敗：${error.message}`;
  }
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('zh-TW');
}

async function ensureUserProfile(user) {
  const ref = doc(db, 'users', user.uid);
  const snapshot = await getDoc(ref);
  const shouldBeAdmin = isSuperAdminUser(user);

  if (!snapshot.exists()) {
    const payload = {
      email: user.email || '',
      displayName: user.displayName || '',
      role: shouldBeAdmin ? 'admin' : 'staff',
      featureAccess: shouldBeAdmin ? [...ALL_FEATURE_KEYS] : [...DEFAULT_STAFF_FEATURES],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, payload, { merge: true });
    return { role: payload.role, featureAccess: payload.featureAccess, ...payload };
  }

  const data = snapshot.data() || {};
  const updates = {};

  let role = (data.role || '').toString().toLowerCase();
  if (!['admin', 'manager', 'staff'].includes(role)) {
    role = shouldBeAdmin ? 'admin' : 'staff';
  }
  if (shouldBeAdmin && role !== 'admin') {
    role = 'admin';
    updates.role = 'admin';
  }

  const fallbackFeatures = role === 'admin' ? ALL_FEATURE_KEYS : DEFAULT_STAFF_FEATURES;
  let featureAccess = sanitizeFeatureAccess(data.featureAccess, fallbackFeatures);

  if (role === 'admin' && featureAccess.length !== ALL_FEATURE_KEYS.length) {
    featureAccess = [...ALL_FEATURE_KEYS];
    updates.featureAccess = featureAccess;
  } else if (!Array.isArray(data.featureAccess) || !data.featureAccess.length) {
    updates.featureAccess = featureAccess;
  }

  if (!data.email && user.email) {
    updates.email = user.email;
  }
  if (!data.displayName && user.displayName) {
    updates.displayName = user.displayName;
  }

  if (Object.keys(updates).length) {
    updates.updatedAt = serverTimestamp();
    await updateDoc(ref, updates);
    Object.assign(data, updates);
  }

  data.role = role;
  data.featureAccess = featureAccess;
  return data;
}

function showLogin() {
  loginPage.classList.remove('hidden');
  appPage.classList.add('hidden');
  loginForm.reset();
  announcementsCache = [];
  reportsCache = [];
  locationsCache = [];
  menuCache = [];
  scheduleCache = [];
  wishCache = [];
  storeCache = [];
  staffCache = [];
  currentFeatureAccess = [...DEFAULT_STAFF_FEATURES];
  editingStaffId = null;
  clearLists();
  resetStaffForm(true);
  resetAnnouncementForm();
  resetLocationForm();
  resetReportForm();
  resetMenuForm();
  resetScheduleForm();
  resetWishForm();
  resetStoreForm();
  applyFeatureVisibility();
  updateStats();
}

function showApp(profile) {
  loginPage.classList.add('hidden');
  appPage.classList.remove('hidden');
  userEmailDisplay.textContent = currentUser.email || '';
  userRoleDisplay.textContent = profile.role || 'staff';
  staffHint.textContent = isAdmin()
    ? '目前為管理員，可新增、刪除所有資料。'
    : '目前為員工，可新增戰報、菜單、排班、許願與商城申請。';
  setCurrentFeatureAccess(computeFeatureAccess(currentRole, profile.featureAccess));
  toggleAdminSections();
  ensureDefaultDates();
  updateStats();
}

function toggleAdminSections() {
  const adminOnlyNodes = document.querySelectorAll('[data-admin-only]');
  adminOnlyNodes.forEach((node) => {
    node.classList.toggle('hidden', !isAdmin());
  });
  applyFeatureVisibility();
}

function ensureDefaultDates() {
  const today = new Date().toISOString().slice(0, 10);
  if (reportDateInput && !reportDateInput.value) {
    reportDateInput.value = today;
  }
  if (menuDateInput && !menuDateInput.value) {
    menuDateInput.value = today;
  }
  if (scheduleDateInput && !scheduleDateInput.value) {
    scheduleDateInput.value = today;
  }
}

function clearLists() {
  if (announcementList) announcementList.innerHTML = '';
  if (locationList) locationList.innerHTML = '';
  if (reportTableBody) reportTableBody.innerHTML = '';
  if (locationOptions) locationOptions.innerHTML = '';
  if (menuTableBody) menuTableBody.innerHTML = '';
  if (scheduleTableBody) scheduleTableBody.innerHTML = '';
  if (wishList) wishList.innerHTML = '';
  if (storeTableBody) storeTableBody.innerHTML = '';
  if (staffTableBody) staffTableBody.innerHTML = '';
  if (staffOptionsList) staffOptionsList.innerHTML = '';
}

function cleanupListeners() {
  if (unsubscribeAnnouncements) unsubscribeAnnouncements();
  if (unsubscribeLocations) unsubscribeLocations();
  if (unsubscribeReports) unsubscribeReports();
  if (unsubscribeMenu) unsubscribeMenu();
  if (unsubscribeSchedule) unsubscribeSchedule();
  if (unsubscribeWishes) unsubscribeWishes();
  if (unsubscribeStore) unsubscribeStore();
  if (unsubscribeUsers) unsubscribeUsers();
  unsubscribeAnnouncements = null;
  unsubscribeLocations = null;
  unsubscribeReports = null;
  unsubscribeMenu = null;
  unsubscribeSchedule = null;
  unsubscribeWishes = null;
  unsubscribeStore = null;
  unsubscribeUsers = null;
}

function renderAnnouncements(items) {
  announcementsCache = items;
  if (!announcementList) return;
  if (!items.length) {
    announcementList.innerHTML = '<li class="meta">目前沒有公告。</li>';
    return;
  }
  announcementList.innerHTML = items
    .map((item) => {
      const createdAt = item.createdAt ? new Date(item.createdAt).toLocaleString() : '';
      const manageButtons = isAdmin()
        ? `
          <button data-action="edit-announcement" data-id="${item.id}" class="secondary">編輯</button>
          <button data-action="delete-announcement" data-id="${item.id}" class="danger">刪除</button>
        `
        : '';
      return `
        <li>
          <div><strong>${item.title}</strong></div>
          <div>${item.content || ''}</div>
          <div class="meta">${createdAt}</div>
          <div class="actions">${manageButtons}</div>
        </li>`;
    })
    .join('');
}

function renderLocations(items) {
  locationsCache = items;
  if (locationOptions) {
    locationOptions.innerHTML = items
      .map((loc) => `<option value="${loc.name}"></option>`)
      .join('');
  }
  if (!locationList) return;
  if (!items.length) {
    locationList.innerHTML = '<li class="meta">尚未新增據點。</li>';
    return;
  }
  locationList.innerHTML = items
    .map((loc) => {
      const manageButtons = isAdmin()
        ? `
          <button data-action="edit-location" data-id="${loc.id}" class="secondary">編輯</button>
          <button data-action="delete-location" data-id="${loc.id}" class="danger">刪除</button>
        `
        : '';
      return `
        <li>
          <div><strong>${loc.name}</strong></div>
          <div class="meta">建立者：${loc.createdByEmail || '未知'}</div>
          <div class="actions">${manageButtons}</div>
        </li>`;
    })
    .join('');
}

function renderUsers(items) {
  staffCache = items;

  if (staffOptionsList) {
    staffOptionsList.innerHTML = items
      .map((user) => `<option value="${user.displayName || user.email || ''}"></option>`)
      .join('');
  }

  if (staffTableBody) {
    if (!items.length) {
      staffTableBody.innerHTML = '<tr><td colspan="5" class="meta">尚未建立人員資料。</td></tr>';
    } else {
      staffTableBody.innerHTML = items
        .map((user) => {
          const roleDisplay = user.isSuper
            ? '超級管理員'
            : user.role === 'admin'
              ? '管理員'
              : user.role === 'manager'
                ? '主管'
                : '員工';
          const featureBadges = user.featureAccess && user.featureAccess.length
            ? user.featureAccess
                .map((key) => `<span class="chip">${FEATURE_LABELS[key] || key}</span>`)
                .join(' ')
            : '--';
          return `
            <tr>
              <td>${user.displayName || user.email || user.id}</td>
              <td>${user.email || ''}</td>
              <td>${roleDisplay}</td>
              <td>${featureBadges}</td>
              <td class="actions"><button class="primary" data-action="edit-staff" data-id="${user.id}">編輯</button></td>
            </tr>`;
        })
        .join('');
    }
  }

  if (currentUser) {
    const ownRecord = items.find((user) => user.id === currentUser.uid);
    if (ownRecord) {
      const normalizedRole = ownRecord.role || 'staff';
      if (!isSuperAdminUser(currentUser) && currentRole !== normalizedRole) {
        currentRole = normalizedRole;
        if (userRoleDisplay) {
          userRoleDisplay.textContent = normalizedRole;
        }
      }
      setCurrentFeatureAccess(ownRecord.featureAccess);
      staffHint.textContent = isAdmin()
        ? '目前為管理員，可新增、刪除所有資料。'
        : '目前為員工，可新增戰報、菜單、排班、許願與商城申請。';
    }
  }

  updateStats();
}

function resetStaffForm(silent = false) {
  if (!staffForm) return;
  staffForm.reset();
  staffFeatureInputs.forEach((input) => {
    input.checked = DEFAULT_STAFF_FEATURES.includes(input.value);
    input.disabled = false;
  });
  editingStaffId = null;
  if (staffDeleteButton) staffDeleteButton.classList.add('hidden');
  if (staffRoleSelect) staffRoleSelect.disabled = false;
  if (!silent && staffUidInput) {
    staffUidInput.focus();
  }
}

function resetAnnouncementForm() {
  if (!announcementForm) return;
  announcementForm.reset();
  editingAnnouncementId = null;
  if (announcementSubmitButton) announcementSubmitButton.textContent = '新增公告';
  if (announcementCancelButton) announcementCancelButton.classList.add('hidden');
}

function populateAnnouncementForm(item) {
  if (!announcementForm || !item) return;
  editingAnnouncementId = item.id;
  const titleInput = announcementForm.querySelector('input[name="title"]');
  const contentInput = announcementForm.querySelector('textarea[name="content"]');
  if (titleInput) titleInput.value = item.title || '';
  if (contentInput) contentInput.value = item.content || '';
  if (announcementSubmitButton) announcementSubmitButton.textContent = '更新公告';
  if (announcementCancelButton) announcementCancelButton.classList.remove('hidden');
}

function resetLocationForm() {
  if (!locationForm) return;
  locationForm.reset();
  editingLocationId = null;
  if (locationSubmitButton) locationSubmitButton.textContent = '新增據點';
  if (locationCancelButton) locationCancelButton.classList.add('hidden');
}

function populateLocationForm(location) {
  if (!locationForm || !location) return;
  editingLocationId = location.id;
  if (locationNameInput) locationNameInput.value = location.name || '';
  if (locationSubmitButton) locationSubmitButton.textContent = '更新據點';
  if (locationCancelButton) locationCancelButton.classList.remove('hidden');
}

function resetReportForm(options = {}) {
  if (!reportForm) return;
  editingReportId = null;
  if (!options.keepLocation && reportLocationInput) {
    reportLocationInput.value = '';
  }
  if (reportSalesInput) reportSalesInput.value = '0';
  if (reportNotesInput) reportNotesInput.value = '';
  ensureDefaultDates();
  if (reportSubmitButton) reportSubmitButton.textContent = '新增戰報';
  if (reportCancelButton) reportCancelButton.classList.add('hidden');
}

function populateReportForm(report) {
  if (!reportForm || !report) return;
  editingReportId = report.id;
  if (reportDateInput) reportDateInput.value = report.date || '';
  if (reportLocationInput) reportLocationInput.value = report.location || '';
  if (reportSalesInput) {
    const value = Number.isFinite(report.salesAmount) ? report.salesAmount : 0;
    reportSalesInput.value = value.toString();
  }
  if (reportNotesInput) reportNotesInput.value = report.notes || '';
  if (reportSubmitButton) reportSubmitButton.textContent = '更新戰報';
  if (reportCancelButton) reportCancelButton.classList.remove('hidden');
}

function resetMenuForm(options = {}) {
  if (!menuForm) return;
  editingMenuEntryId = null;
  if (!options.keepLocation && menuLocationInput) {
    menuLocationInput.value = '';
  }
  if (menuItemInput) menuItemInput.value = '';
  if (menuQuantityInput) menuQuantityInput.value = '0';
  if (menuNotesInput) menuNotesInput.value = '';
  ensureDefaultDates();
  if (menuSubmitButton) menuSubmitButton.textContent = '新增菜單紀錄';
  if (menuCancelButton) menuCancelButton.classList.add('hidden');
}

function populateMenuForm(entry) {
  if (!menuForm || !entry) return;
  editingMenuEntryId = entry.id;
  if (menuDateInput) menuDateInput.value = entry.date || '';
  if (menuLocationInput) menuLocationInput.value = entry.location || '';
  if (menuItemInput) menuItemInput.value = entry.itemName || '';
  if (menuQuantityInput) {
    const quantity = Number.isFinite(entry.quantity) ? entry.quantity : 0;
    menuQuantityInput.value = quantity.toString();
  }
  if (menuNotesInput) menuNotesInput.value = entry.notes || '';
  if (menuSubmitButton) menuSubmitButton.textContent = '更新菜單紀錄';
  if (menuCancelButton) menuCancelButton.classList.remove('hidden');
}

function resetScheduleForm() {
  if (!scheduleForm) return;
  editingScheduleId = null;
  if (scheduleStaffInput) scheduleStaffInput.value = '';
  if (scheduleShiftInput) scheduleShiftInput.value = '早班';
  if (scheduleNotesInput) scheduleNotesInput.value = '';
  ensureDefaultDates();
  if (scheduleSubmitButton) scheduleSubmitButton.textContent = '新增班表';
  if (scheduleCancelButton) scheduleCancelButton.classList.add('hidden');
}

function populateScheduleForm(entry) {
  if (!scheduleForm || !entry) return;
  editingScheduleId = entry.id;
  if (scheduleDateInput) scheduleDateInput.value = entry.date || '';
  if (scheduleStaffInput) scheduleStaffInput.value = entry.staffName || '';
  if (scheduleShiftInput) scheduleShiftInput.value = entry.shift || '早班';
  if (scheduleNotesInput) scheduleNotesInput.value = entry.notes || '';
  if (scheduleSubmitButton) scheduleSubmitButton.textContent = '更新班表';
  if (scheduleCancelButton) scheduleCancelButton.classList.remove('hidden');
}

function resetWishForm() {
  if (!wishForm) return;
  editingWishId = null;
  if (wishTitleInput) wishTitleInput.value = '';
  if (wishDescriptionInput) wishDescriptionInput.value = '';
  if (wishSubmitButton) wishSubmitButton.textContent = '送出願望';
  if (wishCancelButton) wishCancelButton.classList.add('hidden');
}

function populateWishForm(entry) {
  if (!wishForm || !entry) return;
  editingWishId = entry.id;
  if (wishTitleInput) wishTitleInput.value = entry.title || '';
  if (wishDescriptionInput) wishDescriptionInput.value = entry.description || '';
  if (wishSubmitButton) wishSubmitButton.textContent = '更新願望';
  if (wishCancelButton) wishCancelButton.classList.remove('hidden');
}

function resetStoreForm() {
  if (!storeForm) return;
  editingStoreId = null;
  if (storeItemInput) storeItemInput.value = '';
  if (storeQuantityInput) storeQuantityInput.value = '1';
  if (storeNotesInput) storeNotesInput.value = '';
  if (storeSubmitButton) storeSubmitButton.textContent = '提出兌換申請';
  if (storeCancelButton) storeCancelButton.classList.add('hidden');
}

function populateStoreForm(entry) {
  if (!storeForm || !entry) return;
  editingStoreId = entry.id;
  if (storeItemInput) storeItemInput.value = entry.itemName || '';
  if (storeQuantityInput) {
    const quantity = Number.isFinite(entry.quantity) ? entry.quantity : 1;
    storeQuantityInput.value = quantity.toString();
  }
  if (storeNotesInput) storeNotesInput.value = entry.notes || '';
  if (storeSubmitButton) storeSubmitButton.textContent = '更新兌換申請';
  if (storeCancelButton) storeCancelButton.classList.remove('hidden');
}

function populateStaffForm(user) {
  if (!staffForm || !user) return;
  editingStaffId = user.id;
  if (staffUidInput) staffUidInput.value = user.id;
  if (staffEmailInput) staffEmailInput.value = user.email || '';
  if (staffNameInput) staffNameInput.value = user.displayName || '';
  if (staffRoleSelect) staffRoleSelect.value = user.role || 'staff';
  if (staffRoleSelect) staffRoleSelect.disabled = !!user.isSuper;
  const features = user.role === 'admin'
    ? [...ALL_FEATURE_KEYS]
    : sanitizeFeatureAccess(user.featureAccess, DEFAULT_STAFF_FEATURES);
  staffFeatureInputs.forEach((input) => {
    input.checked = features.includes(input.value);
    input.disabled = !!user.isSuper;
  });
  if (staffDeleteButton) {
    const hideDelete = user.isSuper || (currentUser && user.id === currentUser.uid);
    staffDeleteButton.classList.toggle('hidden', hideDelete);
  }
}

function renderReports(items) {
  reportsCache = items;
  if (!reportTableBody) return;
  if (!items.length) {
    reportTableBody.innerHTML = '<tr><td colspan="6" class="meta">尚未新增戰報。</td></tr>';
    return;
  }
  reportTableBody.innerHTML = items
    .map((report) => {
      const createdAt = report.createdAt ? new Date(report.createdAt).toLocaleString() : '';
      const canManage = isAdmin() || (currentUser && report.ownerId === currentUser.uid);
      const buttons = [];
      if (canManage) {
        buttons.push(`<button data-action="edit-report" data-id="${report.id}" class="secondary">編輯</button>`);
        buttons.push(`<button data-action="delete-report" data-id="${report.id}" class="danger">刪除</button>`);
      }
      return `
        <tr>
          <td>${report.date || ''}</td>
          <td>${report.location || ''}</td>
          <td>${typeof report.salesAmount === 'number' ? report.salesAmount.toLocaleString() : ''}</td>
          <td>${report.createdByEmail || ''}<div class="meta">${createdAt}</div></td>
          <td>${report.notes || ''}</td>
          <td class="actions">${buttons.join('')}</td>
        </tr>`;
    })
    .join('');
  updateStats();
}

function renderMenuEntries(items) {
  menuCache = items;
  if (!menuTableBody) return;
  if (!items.length) {
    menuTableBody.innerHTML = '<tr><td colspan="6" class="meta">尚未新增菜單紀錄。</td></tr>';
    return;
  }
  menuTableBody.innerHTML = items
    .map((entry) => {
      const canManage = isAdmin() || (currentUser && entry.ownerId === currentUser.uid);
      const buttons = [];
      if (canManage) {
        buttons.push(`<button data-action="edit-menu" data-id="${entry.id}" class="secondary">編輯</button>`);
        buttons.push(`<button data-action="delete-menu" data-id="${entry.id}" class="danger">刪除</button>`);
      }
      return `
        <tr>
          <td>${entry.date || ''}</td>
          <td>${entry.location || ''}</td>
          <td>${entry.itemName || ''}</td>
          <td>${Number.isFinite(entry.quantity) ? entry.quantity : ''}</td>
          <td>${entry.notes || ''}</td>
          <td class="actions">${buttons.join('')}</td>
        </tr>`;
    })
    .join('');
  updateStats();
}

function renderScheduleEntries(items) {
  scheduleCache = items;
  if (!scheduleTableBody) return;
  if (!items.length) {
    scheduleTableBody.innerHTML = '<tr><td colspan="5" class="meta">尚未新增班表。</td></tr>';
    return;
  }
  scheduleTableBody.innerHTML = items
    .map((entry) => {
      const canManage = isAdmin() || (currentUser && entry.ownerId === currentUser.uid);
      const buttons = [];
      if (canManage) {
        buttons.push(`<button data-action="edit-schedule" data-id="${entry.id}" class="secondary">編輯</button>`);
        buttons.push(`<button data-action="delete-schedule" data-id="${entry.id}" class="danger">刪除</button>`);
      }
      return `
        <tr>
          <td>${entry.date || ''}</td>
          <td>${entry.staffName || ''}</td>
          <td>${entry.shift || ''}</td>
          <td>${entry.notes || ''}</td>
          <td class="actions">${buttons.join('')}</td>
        </tr>`;
    })
    .join('');
  updateStats();
}

function renderWishes(items) {
  wishCache = items;
  if (!wishList) return;
  if (!items.length) {
    wishList.innerHTML = '<li class="meta">尚未新增願望。</li>';
    return;
  }
  wishList.innerHTML = items
    .map((wish) => {
      const createdAt = wish.createdAt ? new Date(wish.createdAt).toLocaleString() : '';
      const canManage = isAdmin() || (currentUser && wish.ownerId === currentUser.uid);
      const buttons = [];
      if (canManage) {
        buttons.push(`<button data-action="edit-wish" data-id="${wish.id}" class="secondary">編輯</button>`);
        buttons.push(`<button data-action="delete-wish" data-id="${wish.id}" class="danger">刪除</button>`);
      }
      return `
        <li>
          <div><strong>${wish.title || ''}</strong></div>
          <div>${wish.description || ''}</div>
          <div class="meta">${createdAt}</div>
          <div class="actions">${buttons.join('')}</div>
        </li>`;
    })
    .join('');
  updateStats();
}

function renderStoreOrders(items) {
  storeCache = items;
  if (!storeTableBody) return;
  if (!items.length) {
    storeTableBody.innerHTML = '<tr><td colspan="5" class="meta">尚未有兌換申請。</td></tr>';
    return;
  }
  storeTableBody.innerHTML = items
    .map((order) => {
      const canManage = isAdmin() || (currentUser && order.ownerId === currentUser.uid);
      const buttons = [];
      if (canManage) {
        buttons.push(`<button data-action="edit-store" data-id="${order.id}" class="secondary">編輯</button>`);
        buttons.push(`<button data-action="delete-store" data-id="${order.id}" class="danger">刪除</button>`);
      }
      return `
        <tr>
          <td>${order.itemName || ''}</td>
          <td>${Number.isFinite(order.quantity) ? order.quantity : ''}</td>
          <td>${order.createdByEmail || ''}</td>
          <td>${order.notes || ''}</td>
          <td class="actions">${buttons.join('')}</td>
        </tr>`;
    })
    .join('');
  updateStats();
}

function updateStats() {
  const monthKey = new Date().toISOString().slice(0, 7);
  let monthlySales = 0;

  reportsCache.forEach((report) => {
    if (
      typeof report.salesAmount === 'number' &&
      report.date &&
      report.date.startsWith(monthKey)
    ) {
      monthlySales += report.salesAmount;
    }
  });

  if (statTotalReports) {
    statTotalReports.textContent = formatNumber(reportsCache.length);
  }
  if (statMonthlySales) {
    statMonthlySales.textContent = formatNumber(monthlySales);
  }
  if (statMenuEntries) {
    statMenuEntries.textContent = formatNumber(menuCache.length);
  }
  if (statStaffCount) {
    statStaffCount.textContent = formatNumber(staffCache.length);
  }
}

function startListeners() {
  const announcementsRef = query(
    collection(db, 'announcements'),
    orderBy('createdAt', 'desc'),
    limit(20),
  );
  unsubscribeAnnouncements = onSnapshot(announcementsRef, (snapshot) => {
    const items = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() || {};
      return {
        id: docSnap.id,
        title: data.title || '(未命名公告)',
        content: data.content || '',
        createdAt: toMillis(data.createdAt),
      };
    });
    renderAnnouncements(items);
  });

  const locationsRef = query(collection(db, 'locations'), orderBy('name'));
  unsubscribeLocations = onSnapshot(locationsRef, (snapshot) => {
    const items = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() || {};
      return {
        id: docSnap.id,
        name: data.name || '(未命名據點)',
        createdByEmail: data.createdByEmail || '',
      };
    });
    renderLocations(items);
  });

  const usersRef = collection(db, 'users');
  unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
    const items = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() || {};
      return {
        id: docSnap.id,
        email: (data.email || '').toString(),
        displayName: (data.displayName || data.name || '').toString(),
        role: (data.role || 'staff').toString().toLowerCase(),
        featureAccess: sanitizeFeatureAccess(data.featureAccess, []),
        isSuper: SUPER_ADMIN_EMAILS.includes(((data.email || '').toString()).toLowerCase()),
      };
    });
    items.sort((a, b) => {
      const left = (a.displayName || a.email || a.id).toString();
      const right = (b.displayName || b.email || b.id).toString();
      return left.localeCompare(right, 'zh-Hant');
    });
    renderUsers(items);
  });

  const reportsRef = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(20));
  unsubscribeReports = onSnapshot(reportsRef, (snapshot) => {
    const items = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() || {};
      return {
        id: docSnap.id,
        date: data.date || '',
        location: data.location || '',
        salesAmount: typeof data.salesAmount === 'number' ? data.salesAmount : data.finalTotal ?? 0,
        notes: data.notes || '',
        ownerId: data.ownerId || '',
        createdByEmail: data.createdByEmail || '',
        createdAt: toMillis(data.createdAt),
      };
    });
    renderReports(items);
  });

  const menuRef = query(collection(db, 'menuEntries'), orderBy('date', 'desc'), limit(50));
  unsubscribeMenu = onSnapshot(menuRef, (snapshot) => {
    const items = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() || {};
      return {
        id: docSnap.id,
        date: data.date || '',
        location: data.location || '',
        itemName: data.itemName || '',
        quantity: typeof data.quantity === 'number' ? data.quantity : Number(data.quantity) || 0,
        notes: data.notes || '',
        ownerId: data.ownerId || '',
      };
    });
    renderMenuEntries(items);
  });

  const scheduleRef = query(collection(db, 'scheduleEntries'), orderBy('date', 'desc'), limit(50));
  unsubscribeSchedule = onSnapshot(scheduleRef, (snapshot) => {
    const items = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() || {};
      return {
        id: docSnap.id,
        date: data.date || '',
        staffName: data.staffName || '',
        shift: data.shift || '',
        notes: data.notes || '',
        ownerId: data.ownerId || '',
      };
    });
    renderScheduleEntries(items);
  });

  const wishesRef = query(collection(db, 'wishes'), orderBy('createdAt', 'desc'), limit(50));
  unsubscribeWishes = onSnapshot(wishesRef, (snapshot) => {
    const items = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() || {};
      return {
        id: docSnap.id,
        title: data.title || '',
        description: data.description || '',
        ownerId: data.ownerId || '',
        createdAt: toMillis(data.createdAt),
      };
    });
    renderWishes(items);
  });

  const storeRef = query(collection(db, 'storeOrders'), orderBy('createdAt', 'desc'), limit(50));
  unsubscribeStore = onSnapshot(storeRef, (snapshot) => {
    const items = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() || {};
      return {
        id: docSnap.id,
        itemName: data.itemName || '',
        quantity: typeof data.quantity === 'number' ? data.quantity : Number(data.quantity) || 0,
        notes: data.notes || '',
        ownerId: data.ownerId || '',
        createdByEmail: data.createdByEmail || '',
      };
    });
    renderStoreOrders(items);
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;
    if (!email || !password) {
      setStatus('請輸入帳號與密碼。', 'error');
      return;
    }
    setStatus('登入中，請稍候...');
    const submitButton = loginForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setStatus(mapAuthError(error), 'error');
      submitButton.disabled = false;
    }
  });
}

if (resetPasswordButton) {
  resetPasswordButton.addEventListener('click', async () => {
    const email = loginEmailInput.value.trim();
    if (!email) {
      setStatus('請先輸入電子郵件，再點選寄送重設連結。', 'error');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setStatus('已寄出重設密碼信，請檢查信箱。', 'info', 4000);
    } catch (error) {
      setStatus(`寄送失敗：${error.message}`, 'error');
    }
  });
}

if (staffForm) {
  staffForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!isAdmin()) {
      setStatus('僅管理員可以編輯人員資料。', 'error');
      return;
    }
    const uid = staffUidInput.value.trim();
    const email = staffEmailInput.value.trim().toLowerCase();
    const name = staffNameInput.value.trim();
    const role = (staffRoleSelect.value || 'staff').toLowerCase();
    if (!uid || !email) {
      setStatus('請輸入 UID 與電子郵件。', 'error');
      return;
    }

    const selectedFeatures = staffFeatureInputs
      .filter((input) => input.checked)
      .map((input) => input.value);
    const existing = staffCache.find((item) => item.id === uid);
    const targetIsSuper = (existing && existing.isSuper) || SUPER_ADMIN_EMAILS.includes(email);
    const finalRole = targetIsSuper ? 'admin' : role;
    const featureAccess = targetIsSuper
      ? [...ALL_FEATURE_KEYS]
      : finalRole === 'admin'
        ? [...ALL_FEATURE_KEYS]
        : sanitizeFeatureAccess(selectedFeatures, DEFAULT_STAFF_FEATURES);

    if (targetIsSuper && role !== 'admin') {
      setStatus('超級管理員必須保持管理員角色，已自動調整。', 'info', 3000);
    }

    const payload = {
      email,
      displayName: name,
      name,
      role: finalRole,
      featureAccess,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser.uid,
    };
    if (!existing) {
      payload.createdAt = serverTimestamp();
    }

    try {
      await setDoc(doc(db, 'users', uid), payload, { merge: true });
      setStatus('人員資料已儲存。', 'info', 3000);
      editingStaffId = uid;
      if (!existing) {
        resetStaffForm(true);
      }
    } catch (error) {
      setStatus(`儲存人員資料失敗：${error.message}`, 'error');
    }
  });
}

if (staffFormReset) {
  staffFormReset.addEventListener('click', () => {
    resetStaffForm();
  });
}

if (staffDeleteButton) {
  staffDeleteButton.addEventListener('click', async () => {
    if (!isAdmin()) {
      setStatus('僅管理員可以刪除人員資料。', 'error');
      return;
    }
    if (!editingStaffId) {
      setStatus('請先選擇要刪除的人員。', 'error');
      return;
    }
    const record = staffCache.find((item) => item.id === editingStaffId);
    if (record && (record.isSuper || (currentUser && record.id === currentUser.uid))) {
      setStatus('無法刪除超級管理員或自己的帳號。', 'error');
      return;
    }
    const confirmed = window.confirm('確定要刪除此人員資料嗎？');
    if (!confirmed) return;
    try {
      await deleteDoc(doc(db, 'users', editingStaffId));
      setStatus('人員資料已刪除。', 'info', 3000);
      resetStaffForm(true);
    } catch (error) {
      setStatus(`刪除人員資料失敗：${error.message}`, 'error');
    }
  });
}

if (staffTableBody) {
  staffTableBody.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.action === 'edit-staff') {
      const id = target.dataset.id;
      const record = staffCache.find((item) => item.id === id);
      if (record) {
        populateStaffForm(record);
        setStatus(`正在編輯 ${record.displayName || record.email}`, 'info', 2000);
      }
    }
  });
}

if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    await signOut(auth);
  });
}

if (announcementForm) {
  announcementForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!isAdmin()) {
      setStatus('僅管理員可以管理公告。', 'error');
      return;
    }
    const titleInput = announcementForm.querySelector('input[name="title"]');
    const contentInput = announcementForm.querySelector('textarea[name="content"]');
    const title = titleInput ? titleInput.value.trim() : '';
    const content = contentInput ? contentInput.value.trim() : '';
    if (!title || !content) {
      setStatus('請填寫公告標題與內容。', 'error');
      return;
    }
    try {
      if (editingAnnouncementId) {
        await updateDoc(doc(db, 'announcements', editingAnnouncementId), {
          title,
          content,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.uid,
        });
        setStatus('公告已更新。', 'info', 3000);
      } else {
        await addDoc(collection(db, 'announcements'), {
          title,
          content,
          createdAt: serverTimestamp(),
          createdBy: currentUser.uid,
          createdByEmail: currentUser.email || '',
        });
        setStatus('公告已新增。', 'info', 3000);
      }
      resetAnnouncementForm();
    } catch (error) {
      setStatus(`儲存公告失敗：${error.message}`, 'error');
    }
  });
}

if (announcementCancelButton) {
  announcementCancelButton.addEventListener('click', () => {
    resetAnnouncementForm();
    setStatus('已取消公告編輯。', 'info', 2000);
  });
}

if (announcementList) {
  announcementList.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.action === 'edit-announcement') {
      if (!isAdmin()) {
        setStatus('僅管理員可以編輯公告。', 'error');
        return;
      }
      const id = target.dataset.id;
      if (!id) return;
      const record = announcementsCache.find((item) => item.id === id);
      if (!record) {
        setStatus('找不到要編輯的公告。', 'error');
        return;
      }
      populateAnnouncementForm(record);
      setStatus(`正在編輯公告：${record.title || ''}`, 'info', 2000);
      return;
    }
    if (target.dataset.action === 'delete-announcement') {
      if (!isAdmin()) {
        setStatus('僅管理員可以刪除公告。', 'error');
        return;
      }
      const id = target.dataset.id;
      if (!id) return;
      const confirmed = window.confirm('確定要刪除此公告嗎？');
      if (!confirmed) return;
      try {
        await deleteDoc(doc(db, 'announcements', id));
        setStatus('公告已刪除。', 'info', 3000);
      } catch (error) {
        setStatus(`刪除公告失敗：${error.message}`, 'error');
      }
    }
  });
}

if (locationForm) {
  locationForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!isAdmin()) {
      setStatus('僅管理員可以管理據點。', 'error');
      return;
    }
    const name = locationNameInput.value.trim();
    if (!name) {
      setStatus('請輸入據點名稱。', 'error');
      return;
    }
    try {
      if (editingLocationId) {
        await updateDoc(doc(db, 'locations', editingLocationId), {
          name,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.uid,
        });
        setStatus('據點已更新。', 'info', 3000);
      } else {
        await addDoc(collection(db, 'locations'), {
          name,
          createdAt: serverTimestamp(),
          createdBy: currentUser.uid,
          createdByEmail: currentUser.email || '',
        });
        setStatus('據點已新增。', 'info', 3000);
      }
      resetLocationForm();
    } catch (error) {
      setStatus(`儲存據點失敗：${error.message}`, 'error');
    }
  });
}

if (locationCancelButton) {
  locationCancelButton.addEventListener('click', () => {
    resetLocationForm();
    setStatus('已取消據點編輯。', 'info', 2000);
  });
}

if (locationList) {
  locationList.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.action === 'edit-location') {
      if (!isAdmin()) {
        setStatus('僅管理員可以編輯據點。', 'error');
        return;
      }
      const id = target.dataset.id;
      if (!id) return;
      const record = locationsCache.find((item) => item.id === id);
      if (!record) {
        setStatus('找不到要編輯的據點。', 'error');
        return;
      }
      populateLocationForm(record);
      setStatus(`正在編輯據點：${record.name || ''}`, 'info', 2000);
      return;
    }
    if (target.dataset.action === 'delete-location') {
      if (!isAdmin()) {
        setStatus('僅管理員可以刪除據點。', 'error');
        return;
      }
      const id = target.dataset.id;
      if (!id) return;
      const confirmed = window.confirm('確定要刪除此據點嗎？');
      if (!confirmed) return;
      try {
        await deleteDoc(doc(db, 'locations', id));
        setStatus('據點已刪除。', 'info', 3000);
      } catch (error) {
        setStatus(`刪除據點失敗：${error.message}`, 'error');
      }
    }
  });
}

if (reportForm) {
  reportForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser) {
      setStatus('請先登入。', 'error');
      return;
    }
    const date = reportDateInput.value;
    const location = reportLocationInput.value.trim();
    const sales = Number(reportSalesInput.value || '0');
    const notes = reportNotesInput.value.trim();
    if (!date || !location) {
      setStatus('請填寫日期與據點。', 'error');
      return;
    }
    try {
      if (editingReportId) {
        const record = reportsCache.find((item) => item.id === editingReportId);
        const canEdit = isAdmin() || (currentUser && record && record.ownerId === currentUser.uid);
        if (!canEdit) {
          setStatus('僅能編輯自己的戰報或需管理員權限。', 'error');
          return;
        }
        await updateDoc(doc(db, 'reports', editingReportId), {
          date,
          location,
          salesAmount: Number.isFinite(sales) ? sales : 0,
          notes,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.uid,
        });
        setStatus('戰報已更新。', 'info', 3000);
      } else {
        await addDoc(collection(db, 'reports'), {
          ownerId: currentUser.uid,
          date,
          location,
          salesAmount: Number.isFinite(sales) ? sales : 0,
          notes,
          createdAt: serverTimestamp(),
          createdBy: currentUser.uid,
          createdByEmail: currentUser.email || '',
        });
        setStatus('戰報已新增。', 'info', 3000);
      }
      resetReportForm({ keepLocation: true });
    } catch (error) {
      setStatus(`儲存戰報失敗：${error.message}`, 'error');
    }
  });
}

if (reportCancelButton) {
  reportCancelButton.addEventListener('click', () => {
    resetReportForm({ keepLocation: true });
    setStatus('已取消戰報編輯。', 'info', 2000);
  });
}

if (reportTableBody) {
  reportTableBody.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.action === 'edit-report') {
      const id = target.dataset.id;
      if (!id) return;
      const record = reportsCache.find((item) => item.id === id);
      const canEdit = isAdmin() || (currentUser && record && record.ownerId === currentUser.uid);
      if (!canEdit) {
        setStatus('僅能編輯自己的戰報或需管理員權限。', 'error');
        return;
      }
      populateReportForm(record);
      setStatus(`正在編輯戰報：${record.date || ''} ${record.location || ''}`, 'info', 2000);
      return;
    }
    if (target.dataset.action === 'delete-report') {
      const id = target.dataset.id;
      if (!id) return;
      const report = reportsCache.find((item) => item.id === id);
      const canDelete = isAdmin() || (currentUser && report && report.ownerId === currentUser.uid);
      if (!canDelete) {
        setStatus('僅能刪除自己的戰報或需管理員權限。', 'error');
        return;
      }
      const confirmed = window.confirm('確定要刪除此戰報嗎？');
      if (!confirmed) return;
      try {
        await deleteDoc(doc(db, 'reports', id));
        setStatus('戰報已刪除。', 'info', 3000);
      } catch (error) {
        setStatus(`刪除戰報失敗：${error.message}`, 'error');
      }
    }
  });
}

if (menuForm) {
  menuForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser) {
      setStatus('請先登入。', 'error');
      return;
    }
    const date = menuDateInput.value;
    const location = menuLocationInput.value.trim();
    const itemName = menuItemInput.value.trim();
    const quantity = Number(menuQuantityInput.value || '0');
    const notes = menuNotesInput.value.trim();
    if (!date || !location || !itemName) {
      setStatus('請填寫日期、據點與品項。', 'error');
      return;
    }
    try {
      if (editingMenuEntryId) {
        const record = menuCache.find((item) => item.id === editingMenuEntryId);
        const canEdit = isAdmin() || (currentUser && record && record.ownerId === currentUser.uid);
        if (!canEdit) {
          setStatus('僅能編輯自己的菜單紀錄或需管理員權限。', 'error');
          return;
        }
        await updateDoc(doc(db, 'menuEntries', editingMenuEntryId), {
          date,
          location,
          itemName,
          quantity: Number.isFinite(quantity) ? quantity : 0,
          notes,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.uid,
        });
        setStatus('菜單紀錄已更新。', 'info', 3000);
      } else {
        await addDoc(collection(db, 'menuEntries'), {
          ownerId: currentUser.uid,
          date,
          location,
          itemName,
          quantity: Number.isFinite(quantity) ? quantity : 0,
          notes,
          createdAt: serverTimestamp(),
          createdByEmail: currentUser.email || '',
        });
        setStatus('菜單紀錄已新增。', 'info', 3000);
      }
      resetMenuForm({ keepLocation: true });
    } catch (error) {
      setStatus(`儲存菜單紀錄失敗：${error.message}`, 'error');
    }
  });
}

if (menuCancelButton) {
  menuCancelButton.addEventListener('click', () => {
    resetMenuForm({ keepLocation: true });
    setStatus('已取消菜單紀錄編輯。', 'info', 2000);
  });
}

if (menuTableBody) {
  menuTableBody.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.action === 'edit-menu') {
      const id = target.dataset.id;
      if (!id) return;
      const entry = menuCache.find((item) => item.id === id);
      const canEdit = isAdmin() || (currentUser && entry && entry.ownerId === currentUser.uid);
      if (!canEdit) {
        setStatus('僅能編輯自己的菜單紀錄或需管理員權限。', 'error');
        return;
      }
      populateMenuForm(entry);
      setStatus(`正在編輯菜單：${entry.date || ''} ${entry.location || ''}`, 'info', 2000);
      return;
    }
    if (target.dataset.action === 'delete-menu') {
      const id = target.dataset.id;
      if (!id) return;
      const entry = menuCache.find((item) => item.id === id);
      const canDelete = isAdmin() || (currentUser && entry && entry.ownerId === currentUser.uid);
      if (!canDelete) {
        setStatus('僅能刪除自己的菜單紀錄或需管理員權限。', 'error');
        return;
      }
      const confirmed = window.confirm('確定要刪除此菜單紀錄嗎？');
      if (!confirmed) return;
      try {
        await deleteDoc(doc(db, 'menuEntries', id));
        setStatus('菜單紀錄已刪除。', 'info', 3000);
      } catch (error) {
        setStatus(`刪除菜單紀錄失敗：${error.message}`, 'error');
      }
    }
  });
}

if (scheduleForm) {
  scheduleForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser) {
      setStatus('請先登入。', 'error');
      return;
    }
    const date = scheduleDateInput.value;
    const staffName = scheduleStaffInput.value.trim();
    const shift = scheduleShiftInput.value;
    const notes = scheduleNotesInput.value.trim();
    if (!date || !staffName || !shift) {
      setStatus('請填寫日期、姓名與班別。', 'error');
      return;
    }
    try {
      if (editingScheduleId) {
        const entry = scheduleCache.find((item) => item.id === editingScheduleId);
        const canEdit = isAdmin() || (currentUser && entry && entry.ownerId === currentUser.uid);
        if (!canEdit) {
          setStatus('僅能編輯自己的班表或需管理員權限。', 'error');
          return;
        }
        await updateDoc(doc(db, 'scheduleEntries', editingScheduleId), {
          date,
          staffName,
          shift,
          notes,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.uid,
        });
        setStatus('班表已更新。', 'info', 3000);
      } else {
        await addDoc(collection(db, 'scheduleEntries'), {
          ownerId: currentUser.uid,
          date,
          staffName,
          shift,
          notes,
          createdAt: serverTimestamp(),
          createdByEmail: currentUser.email || '',
        });
        setStatus('班表已新增。', 'info', 3000);
      }
      resetScheduleForm();
    } catch (error) {
      setStatus(`儲存班表失敗：${error.message}`, 'error');
    }
  });
}

if (scheduleCancelButton) {
  scheduleCancelButton.addEventListener('click', () => {
    resetScheduleForm();
    setStatus('已取消班表編輯。', 'info', 2000);
  });
}

if (scheduleTableBody) {
  scheduleTableBody.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.action === 'edit-schedule') {
      const id = target.dataset.id;
      if (!id) return;
      const entry = scheduleCache.find((item) => item.id === id);
      const canEdit = isAdmin() || (currentUser && entry && entry.ownerId === currentUser.uid);
      if (!canEdit) {
        setStatus('僅能編輯自己的班表或需管理員權限。', 'error');
        return;
      }
      populateScheduleForm(entry);
      setStatus(`正在編輯班表：${entry.date || ''} ${entry.staffName || ''}`, 'info', 2000);
      return;
    }
    if (target.dataset.action === 'delete-schedule') {
      const id = target.dataset.id;
      if (!id) return;
      const entry = scheduleCache.find((item) => item.id === id);
      const canDelete = isAdmin() || (currentUser && entry && entry.ownerId === currentUser.uid);
      if (!canDelete) {
        setStatus('僅能刪除自己的班表或需管理員權限。', 'error');
        return;
      }
      const confirmed = window.confirm('確定要刪除此班表嗎？');
      if (!confirmed) return;
      try {
        await deleteDoc(doc(db, 'scheduleEntries', id));
        setStatus('班表已刪除。', 'info', 3000);
      } catch (error) {
        setStatus(`刪除班表失敗：${error.message}`, 'error');
      }
    }
  });
}

if (wishForm) {
  wishForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser) {
      setStatus('請先登入。', 'error');
      return;
    }
    const title = wishTitleInput.value.trim();
    const description = wishDescriptionInput.value.trim();
    if (!title || !description) {
      setStatus('請填寫願望標題與內容。', 'error');
      return;
    }
    try {
      if (editingWishId) {
        const entry = wishCache.find((item) => item.id === editingWishId);
        const canEdit = isAdmin() || (currentUser && entry && entry.ownerId === currentUser.uid);
        if (!canEdit) {
          setStatus('僅能編輯自己的願望或需管理員權限。', 'error');
          return;
        }
        await updateDoc(doc(db, 'wishes', editingWishId), {
          title,
          description,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.uid,
        });
        setStatus('願望已更新。', 'info', 3000);
      } else {
        await addDoc(collection(db, 'wishes'), {
          ownerId: currentUser.uid,
          title,
          description,
          createdAt: serverTimestamp(),
          createdByEmail: currentUser.email || '',
        });
        setStatus('願望已送出。', 'info', 3000);
      }
      resetWishForm();
    } catch (error) {
      setStatus(`儲存願望失敗：${error.message}`, 'error');
    }
  });
}

if (wishCancelButton) {
  wishCancelButton.addEventListener('click', () => {
    resetWishForm();
    setStatus('已取消願望編輯。', 'info', 2000);
  });
}

if (wishList) {
  wishList.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.action === 'edit-wish') {
      const id = target.dataset.id;
      if (!id) return;
      const entry = wishCache.find((item) => item.id === id);
      const canEdit = isAdmin() || (currentUser && entry && entry.ownerId === currentUser.uid);
      if (!canEdit) {
        setStatus('僅能編輯自己的願望或需管理員權限。', 'error');
        return;
      }
      populateWishForm(entry);
      setStatus(`正在編輯願望：${entry.title || ''}`, 'info', 2000);
      return;
    }
    if (target.dataset.action === 'delete-wish') {
      const id = target.dataset.id;
      if (!id) return;
      const entry = wishCache.find((item) => item.id === id);
      const canDelete = isAdmin() || (currentUser && entry && entry.ownerId === currentUser.uid);
      if (!canDelete) {
        setStatus('僅能刪除自己的願望或需管理員權限。', 'error');
        return;
      }
      const confirmed = window.confirm('確定要刪除此願望嗎？');
      if (!confirmed) return;
      try {
        await deleteDoc(doc(db, 'wishes', id));
        setStatus('願望已刪除。', 'info', 3000);
      } catch (error) {
        setStatus(`刪除願望失敗：${error.message}`, 'error');
      }
    }
  });
}

if (storeForm) {
  storeForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser) {
      setStatus('請先登入。', 'error');
      return;
    }
    const itemName = storeItemInput.value.trim();
    const quantity = Number(storeQuantityInput.value || '1');
    const notes = storeNotesInput.value.trim();
    if (!itemName) {
      setStatus('請填寫兌換品項。', 'error');
      return;
    }
    try {
      if (editingStoreId) {
        const entry = storeCache.find((item) => item.id === editingStoreId);
        const canEdit = isAdmin() || (currentUser && entry && entry.ownerId === currentUser.uid);
        if (!canEdit) {
          setStatus('僅能編輯自己的兌換申請或需管理員權限。', 'error');
          return;
        }
        await updateDoc(doc(db, 'storeOrders', editingStoreId), {
          itemName,
          quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
          notes,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.uid,
        });
        setStatus('兌換申請已更新。', 'info', 3000);
      } else {
        await addDoc(collection(db, 'storeOrders'), {
          ownerId: currentUser.uid,
          itemName,
          quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
          notes,
          createdAt: serverTimestamp(),
          createdByEmail: currentUser.email || '',
        });
        setStatus('兌換申請已送出。', 'info', 3000);
      }
      resetStoreForm();
    } catch (error) {
      setStatus(`儲存兌換申請失敗：${error.message}`, 'error');
    }
  });
}

if (storeCancelButton) {
  storeCancelButton.addEventListener('click', () => {
    resetStoreForm();
    setStatus('已取消兌換申請編輯。', 'info', 2000);
  });
}

if (storeTableBody) {
  storeTableBody.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.action === 'edit-store') {
      const id = target.dataset.id;
      if (!id) return;
      const entry = storeCache.find((item) => item.id === id);
      const canEdit = isAdmin() || (currentUser && entry && entry.ownerId === currentUser.uid);
      if (!canEdit) {
        setStatus('僅能編輯自己的兌換申請或需管理員權限。', 'error');
        return;
      }
      populateStoreForm(entry);
      setStatus(`正在編輯兌換申請：${entry.itemName || ''}`, 'info', 2000);
      return;
    }
    if (target.dataset.action === 'delete-store') {
      const id = target.dataset.id;
      if (!id) return;
      const entry = storeCache.find((item) => item.id === id);
      const canDelete = isAdmin() || (currentUser && entry && entry.ownerId === currentUser.uid);
      if (!canDelete) {
        setStatus('僅能刪除自己的兌換申請或需管理員權限。', 'error');
        return;
      }
      const confirmed = window.confirm('確定要刪除此兌換申請嗎？');
      if (!confirmed) return;
      try {
        await deleteDoc(doc(db, 'storeOrders', id));
        setStatus('兌換申請已刪除。', 'info', 3000);
      } catch (error) {
        setStatus(`刪除兌換申請失敗：${error.message}`, 'error');
      }
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  cleanupListeners();
  clearLists();
  if (!user) {
    currentUser = null;
    currentRole = 'guest';
    showLogin();
    const submitButton = loginForm?.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = false;
    return;
  }

  currentUser = user;
  setStatus('載入使用者資料中...');
  try {
    const profile = await ensureUserProfile(user);
    currentRole = profile.role || 'staff';
    showApp(profile);
    startListeners();
    setStatus('登入成功。', 'info', 3000);
  } catch (error) {
    setStatus(`載入資料失敗：${error.message}`, 'error');
    await signOut(auth);
  }
  const submitButton = loginForm?.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = false;
});
