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
const salesStartDateInput = document.getElementById('salesStartDate');
const salesEndDateInput = document.getElementById('salesEndDate');
const salesLocationInput = document.getElementById('salesLocation');
const salesApplyButton = document.getElementById('salesApply');
const salesClearButton = document.getElementById('salesClear');
const salesTotalAmount = document.getElementById('salesTotalAmount');
const salesReportCount = document.getElementById('salesReportCount');
const salesMenuCount = document.getElementById('salesMenuCount');
const salesAverageAmount = document.getElementById('salesAverageAmount');
const salesLocationSummary = document.getElementById('salesLocationSummary');
const salesReportTableBody = document.getElementById('salesReportTableBody');
const salesMenuTableBody = document.getElementById('salesMenuTableBody');

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
@@ -373,50 +385,66 @@ function showApp(profile) {
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
  setDefaultSalesRange();
}

function setDefaultSalesRange() {
  if (!salesStartDateInput || !salesEndDateInput) return;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  if (!salesStartDateInput.value) {
    salesStartDateInput.value = startOfMonth;
  }
  if (!salesEndDateInput.value) {
    salesEndDateInput.value = today;
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
@@ -857,76 +885,194 @@ function renderStoreOrders(items) {
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

function isWithinRange(dateStr, start, end) {
  if (!start && !end) return true;
  if (!dateStr) return false;
  if (start && dateStr < start) return false;
  if (end && dateStr > end) return false;
  return true;
}

function matchesLocation(value, filterText) {
  if (!filterText) return true;
  return (value || '').toLowerCase().includes(filterText);
}

function renderSalesReportTable(reports) {
  if (!salesReportTableBody) return;
  if (!reports.length) {
    salesReportTableBody.innerHTML = '<tr><td colspan="4" class="meta">篩選條件下沒有戰報。</td></tr>';
    return;
  }
  salesReportTableBody.innerHTML = reports
    .map((report) => {
      const amount = Number.isFinite(report.salesAmount) ? formatNumber(report.salesAmount) : '';
      return `
        <tr>
          <td>${report.date || ''}</td>
          <td>${report.location || ''}</td>
          <td>${amount}</td>
          <td>${report.notes || ''}</td>
        </tr>`;
    })
    .join('');
}

function renderSalesMenuTable(menuItems) {
  if (!salesMenuTableBody) return;
  if (!menuItems.length) {
    salesMenuTableBody.innerHTML = '<tr><td colspan="4" class="meta">目前沒有符合條件的菜單紀錄。</td></tr>';
    return;
  }
  const aggregates = new Map();
  menuItems.forEach((entry) => {
    const key = entry.itemName || '未命名品項';
    const aggregate = aggregates.get(key) || {
      itemName: key,
      totalQuantity: 0,
      records: 0,
      locations: new Set(),
    };
    aggregate.totalQuantity += Number.isFinite(entry.quantity) ? entry.quantity : 0;
    aggregate.records += 1;
    if (entry.location) {
      aggregate.locations.add(entry.location);
    }
    aggregates.set(key, aggregate);
  });

  const sorted = Array.from(aggregates.values()).sort((a, b) => {
    if (b.totalQuantity !== a.totalQuantity) return b.totalQuantity - a.totalQuantity;
    if (b.records !== a.records) return b.records - a.records;
    return a.itemName.localeCompare(b.itemName);
  });

  salesMenuTableBody.innerHTML = sorted
    .map((item) => {
      return `
        <tr>
          <td>${item.itemName}</td>
          <td>${formatNumber(item.totalQuantity)}</td>
          <td>${item.locations.size || 0}</td>
          <td>${item.records}</td>
        </tr>`;
    })
    .join('');
}

function updateSalesDashboard() {
  if (!salesReportTableBody || !salesMenuTableBody) return;
  const start = salesStartDateInput ? salesStartDateInput.value : '';
  const end = salesEndDateInput ? salesEndDateInput.value : '';
  const locationFilter = (salesLocationInput ? salesLocationInput.value : '').trim().toLowerCase();

  const filteredReports = reportsCache.filter((report) =>
    isWithinRange(report.date, start, end) && matchesLocation(report.location, locationFilter),
  );
  const filteredMenu = menuCache.filter((entry) =>
    isWithinRange(entry.date, start, end) && matchesLocation(entry.location, locationFilter),
  );

  const totalSales = filteredReports.reduce(
    (sum, report) => sum + (Number.isFinite(report.salesAmount) ? report.salesAmount : 0),
    0,
  );
  const avgSales = filteredReports.length ? totalSales / filteredReports.length : 0;
  const locationSet = new Set();
  filteredReports.forEach((report) => {
    if (report.location) {
      locationSet.add(report.location);
    }
  });

  if (salesTotalAmount) salesTotalAmount.textContent = formatNumber(totalSales);
  if (salesAverageAmount) salesAverageAmount.textContent = formatNumber(avgSales.toFixed(0));
  if (salesReportCount) salesReportCount.textContent = formatNumber(filteredReports.length);
  if (salesMenuCount) salesMenuCount.textContent = formatNumber(filteredMenu.length);
  if (salesLocationSummary) {
    const label = locationFilter
      ? `篩選據點：${salesLocationInput.value.trim()}`
      : locationSet.size
        ? `包含 ${locationSet.size} 個據點`
        : '全部據點';
    salesLocationSummary.textContent = label;
  }

  renderSalesReportTable(filteredReports);
  renderSalesMenuTable(filteredMenu);
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
  updateSalesDashboard();
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
@@ -1170,50 +1316,78 @@ if (staffDeleteButton) {
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

if (salesApplyButton) {
  salesApplyButton.addEventListener('click', () => {
    updateSalesDashboard();
  });
}

if (salesClearButton) {
  salesClearButton.addEventListener('click', () => {
    if (salesLocationInput) salesLocationInput.value = '';
    if (salesStartDateInput) salesStartDateInput.value = '';
    if (salesEndDateInput) salesEndDateInput.value = '';
    setDefaultSalesRange();
    updateSalesDashboard();
  });
}

if (salesStartDateInput) {
  salesStartDateInput.addEventListener('change', updateSalesDashboard);
}

if (salesEndDateInput) {
  salesEndDateInput.addEventListener('change', updateSalesDashboard);
}

if (salesLocationInput) {
  salesLocationInput.addEventListener('input', updateSalesDashboard);
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
