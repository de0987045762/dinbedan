// ✅ 正確的 Firebase CDN 版本 import（可直接用在瀏覽器 GitHub Pages）
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

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
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

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

const locationForm = document.getElementById('locationForm');
const locationNameInput = document.getElementById('locationName');
const locationList = document.getElementById('locationList');
const locationOptions = document.getElementById('locationOptions');

const reportForm = document.getElementById('reportForm');
const reportDateInput = document.getElementById('reportDate');
const reportLocationInput = document.getElementById('reportLocation');
const reportSalesInput = document.getElementById('reportSales');
const reportNotesInput = document.getElementById('reportNotes');
const reportTableBody = document.getElementById('reportTableBody');

const menuForm = document.getElementById('menuForm');
const menuDateInput = document.getElementById('menuDate');
const menuLocationInput = document.getElementById('menuLocation');
const menuItemInput = document.getElementById('menuItem');
const menuQuantityInput = document.getElementById('menuQuantity');
const menuNotesInput = document.getElementById('menuNotes');
const menuTableBody = document.getElementById('menuTableBody');

const scheduleForm = document.getElementById('scheduleForm');
const scheduleDateInput = document.getElementById('scheduleDate');
const scheduleStaffInput = document.getElementById('scheduleStaff');
const scheduleShiftInput = document.getElementById('scheduleShift');
const scheduleNotesInput = document.getElementById('scheduleNotes');
const scheduleTableBody = document.getElementById('scheduleTableBody');

const wishForm = document.getElementById('wishForm');
const wishTitleInput = document.getElementById('wishTitle');
const wishDescriptionInput = document.getElementById('wishDescription');
const wishList = document.getElementById('wishList');

const storeForm = document.getElementById('storeForm');
const storeItemInput = document.getElementById('storeItem');
const storeQuantityInput = document.getElementById('storeQuantity');
const storeNotesInput = document.getElementById('storeNotes');
const storeTableBody = document.getElementById('storeTableBody');

let currentUser = null;
let currentRole = 'guest';
let locationsCache = [];
let reportsCache = [];
let menuCache = [];
let scheduleCache = [];
let wishCache = [];
let storeCache = [];

let unsubscribeAnnouncements = null;
let unsubscribeLocations = null;
let unsubscribeReports = null;
let unsubscribeMenu = null;
let unsubscribeSchedule = null;
let unsubscribeWishes = null;
let unsubscribeStore = null;

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

async function ensureUserProfile(user) {
  const ref = doc(db, 'users', user.uid);
  const snapshot = await getDoc(ref);
  const shouldBeAdmin = isSuperAdminUser(user);

  if (!snapshot.exists()) {
    const payload = {
      email: user.email || '',
      displayName: user.displayName || '',
      role: shouldBeAdmin ? 'admin' : 'staff',
      featureAccess: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, payload, { merge: true });
    return { role: payload.role, ...payload };
  }

  const data = snapshot.data() || {};
  if (shouldBeAdmin && data.role !== 'admin') {
    await updateDoc(ref, {
      role: 'admin',
      updatedAt: serverTimestamp(),
    });
    data.role = 'admin';
  }
  if (!data.role) {
    data.role = shouldBeAdmin ? 'admin' : 'staff';
  }
  return data;
}

function showLogin() {
  loginPage.classList.remove('hidden');
  appPage.classList.add('hidden');
  loginForm.reset();
  reportsCache = [];
  locationsCache = [];
  menuCache = [];
  scheduleCache = [];
  wishCache = [];
  storeCache = [];
  clearLists();
}

function showApp(profile) {
  loginPage.classList.add('hidden');
  appPage.classList.remove('hidden');
  userEmailDisplay.textContent = currentUser.email || '';
  userRoleDisplay.textContent = profile.role || 'staff';
  staffHint.textContent = isAdmin()
    ? '目前為管理員，可新增、刪除所有資料。'
    : '目前為員工，可新增戰報、菜單、排班、許願與商城申請。';
  toggleAdminSections();
  ensureDefaultDates();
}

function toggleAdminSections() {
  const adminOnlyNodes = document.querySelectorAll('[data-admin-only]');
  adminOnlyNodes.forEach((node) => {
    node.classList.toggle('hidden', !isAdmin());
  });
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
}

function cleanupListeners() {
  if (unsubscribeAnnouncements) unsubscribeAnnouncements();
  if (unsubscribeLocations) unsubscribeLocations();
  if (unsubscribeReports) unsubscribeReports();
  if (unsubscribeMenu) unsubscribeMenu();
  if (unsubscribeSchedule) unsubscribeSchedule();
  if (unsubscribeWishes) unsubscribeWishes();
  if (unsubscribeStore) unsubscribeStore();
  unsubscribeAnnouncements = null;
  unsubscribeLocations = null;
  unsubscribeReports = null;
  unsubscribeMenu = null;
  unsubscribeSchedule = null;
  unsubscribeWishes = null;
  unsubscribeStore = null;
}

function renderAnnouncements(items) {
  if (!announcementList) return;
  if (!items.length) {
    announcementList.innerHTML = '<li class="meta">目前沒有公告。</li>';
    return;
  }
  announcementList.innerHTML = items
    .map((item) => {
      const createdAt = item.createdAt ? new Date(item.createdAt).toLocaleString() : '';
      const deleteButton = isAdmin()
        ? `<button data-action="delete-announcement" data-id="${item.id}" class="danger">刪除</button>`
        : '';
      return `
        <li>
          <div><strong>${item.title}</strong></div>
          <div>${item.content || ''}</div>
          <div class="meta">${createdAt}</div>
          <div class="actions">${deleteButton}</div>
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
      const deleteButton = isAdmin()
        ? `<button data-action="delete-location" data-id="${loc.id}" class="danger">刪除</button>`
        : '';
      return `
        <li>
          <div><strong>${loc.name}</strong></div>
          <div class="meta">建立者：${loc.createdByEmail || '未知'}</div>
          <div class="actions">${deleteButton}</div>
        </li>`;
    })
    .join('');
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
      const canDelete = isAdmin() || (currentUser && report.ownerId === currentUser.uid);
      const deleteButton = canDelete
        ? `<button data-action="delete-report" data-id="${report.id}" class="danger">刪除</button>`
        : '';
      return `
        <tr>
          <td>${report.date || ''}</td>
          <td>${report.location || ''}</td>
          <td>${typeof report.salesAmount === 'number' ? report.salesAmount.toLocaleString() : ''}</td>
          <td>${report.createdByEmail || ''}<div class="meta">${createdAt}</div></td>
          <td>${report.notes || ''}</td>
          <td class="actions">${deleteButton}</td>
        </tr>`;
    })
    .join('');
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
      const canDelete = isAdmin() || (currentUser && entry.ownerId === currentUser.uid);
      const deleteButton = canDelete
        ? `<button data-action="delete-menu" data-id="${entry.id}" class="danger">刪除</button>`
        : '';
      return `
        <tr>
          <td>${entry.date || ''}</td>
          <td>${entry.location || ''}</td>
          <td>${entry.itemName || ''}</td>
          <td>${Number.isFinite(entry.quantity) ? entry.quantity : ''}</td>
          <td>${entry.notes || ''}</td>
          <td class="actions">${deleteButton}</td>
        </tr>`;
    })
    .join('');
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
      const canDelete = isAdmin() || (currentUser && entry.ownerId === currentUser.uid);
      const deleteButton = canDelete
        ? `<button data-action="delete-schedule" data-id="${entry.id}" class="danger">刪除</button>`
        : '';
      return `
        <tr>
          <td>${entry.date || ''}</td>
          <td>${entry.staffName || ''}</td>
          <td>${entry.shift || ''}</td>
          <td>${entry.notes || ''}</td>
          <td class="actions">${deleteButton}</td>
        </tr>`;
    })
    .join('');
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
      const canDelete = isAdmin() || (currentUser && wish.ownerId === currentUser.uid);
      const deleteButton = canDelete
        ? `<button data-action="delete-wish" data-id="${wish.id}" class="danger">刪除</button>`
        : '';
      return `
        <li>
          <div><strong>${wish.title || ''}</strong></div>
          <div>${wish.description || ''}</div>
          <div class="meta">${createdAt}</div>
          <div class="actions">${deleteButton}</div>
        </li>`;
    })
    .join('');
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
      const canDelete = isAdmin() || (currentUser && order.ownerId === currentUser.uid);
      const deleteButton = canDelete
        ? `<button data-action="delete-store" data-id="${order.id}" class="danger">刪除</button>`
        : '';
      return `
        <tr>
          <td>${order.itemName || ''}</td>
          <td>${Number.isFinite(order.quantity) ? order.quantity : ''}</td>
          <td>${order.createdByEmail || ''}</td>
          <td>${order.notes || ''}</td>
          <td class="actions">${deleteButton}</td>
        </tr>`;
    })
    .join('');
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

if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    await signOut(auth);
  });
}

if (announcementForm) {
  announcementForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!isAdmin()) {
      setStatus('僅管理員可以新增公告。', 'error');
      return;
    }
    const formData = new FormData(announcementForm);
    const title = formData.get('title').toString().trim();
    const content = formData.get('content').toString().trim();
    if (!title || !content) {
      setStatus('請填寫公告標題與內容。', 'error');
      return;
    }
    try {
      await addDoc(collection(db, 'announcements'), {
        title,
        content,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        createdByEmail: currentUser.email || '',
      });
      announcementForm.reset();
      setStatus('公告已新增。', 'info', 3000);
    } catch (error) {
      setStatus(`新增公告失敗：${error.message}`, 'error');
    }
  });
}

if (announcementList) {
  announcementList.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
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
      setStatus('僅管理員可以新增據點。', 'error');
      return;
    }
    const name = locationNameInput.value.trim();
    if (!name) {
      setStatus('請輸入據點名稱。', 'error');
      return;
    }
    try {
      await addDoc(collection(db, 'locations'), {
        name,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        createdByEmail: currentUser.email || '',
      });
      locationForm.reset();
      setStatus('據點已新增。', 'info', 3000);
    } catch (error) {
      setStatus(`新增據點失敗：${error.message}`, 'error');
    }
  });
}

if (locationList) {
  locationList.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
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
      reportNotesInput.value = '';
      reportSalesInput.value = '0';
      ensureDefaultDates();
      setStatus('戰報已新增。', 'info', 3000);
    } catch (error) {
      setStatus(`新增戰報失敗：${error.message}`, 'error');
    }
  });
}

if (reportTableBody) {
  reportTableBody.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
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
      menuItemInput.value = '';
      menuQuantityInput.value = '0';
      menuNotesInput.value = '';
      ensureDefaultDates();
      setStatus('菜單紀錄已新增。', 'info', 3000);
    } catch (error) {
      setStatus(`新增菜單紀錄失敗：${error.message}`, 'error');
    }
  });
}

if (menuTableBody) {
  menuTableBody.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
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
      await addDoc(collection(db, 'scheduleEntries'), {
        ownerId: currentUser.uid,
        date,
        staffName,
        shift,
        notes,
        createdAt: serverTimestamp(),
        createdByEmail: currentUser.email || '',
      });
      scheduleNotesInput.value = '';
      scheduleStaffInput.value = '';
      ensureDefaultDates();
      setStatus('班表已新增。', 'info', 3000);
    } catch (error) {
      setStatus(`新增班表失敗：${error.message}`, 'error');
    }
  });
}

if (scheduleTableBody) {
  scheduleTableBody.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
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
      await addDoc(collection(db, 'wishes'), {
        ownerId: currentUser.uid,
        title,
        description,
        createdAt: serverTimestamp(),
        createdByEmail: currentUser.email || '',
      });
      wishTitleInput.value = '';
      wishDescriptionInput.value = '';
      setStatus('願望已送出。', 'info', 3000);
    } catch (error) {
      setStatus(`新增願望失敗：${error.message}`, 'error');
    }
  });
}

if (wishList) {
  wishList.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
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
      await addDoc(collection(db, 'storeOrders'), {
        ownerId: currentUser.uid,
        itemName,
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        notes,
        createdAt: serverTimestamp(),
        createdByEmail: currentUser.email || '',
      });
      storeItemInput.value = '';
      storeQuantityInput.value = '1';
      storeNotesInput.value = '';
      setStatus('兌換申請已送出。', 'info', 3000);
    } catch (error) {
      setStatus(`送出兌換申請失敗：${error.message}`, 'error');
    }
  });
}

if (storeTableBody) {
  storeTableBody.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
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
