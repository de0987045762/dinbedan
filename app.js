const uuid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2, 11)}`);

const MOCK_USERS = [
  { id: 'u-admin', email: 'admin@example.com', password: 'password', displayName: '超級管理員', role: 'admin', bv: 950 },
  { id: 'u-manager', email: 'manager@example.com', password: 'password', displayName: '區域經理', role: 'manager', bv: 780 },
  { id: 'u-staff', email: 'staff@example.com', password: 'password', displayName: '基層員工', role: 'staff', bv: 420 },
];

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

const state = {
  currentUser: null,
  announcements: [
    {
      id: uuid(),
      type: 'important',
      title: '新品上市通知',
      content: '本週推出全新套餐，請各據點協助宣傳。',
      imageUrl: '',
      createdAt: new Date().toISOString(),
      updatedAt: null,
      createdBy: 'u-admin',
    },
  ],
  reports: [
    {
      id: uuid(),
      date: new Date().toISOString().slice(0, 10),
      location: '台北館前店',
      status: '正常營業',
      summary: '今日營運順利，午餐時段人潮踴躍。',
      owner: 'u-manager',
      createdAt: new Date().toISOString(),
    },
  ],
  locations: [
    { id: uuid(), name: '台北館前店', description: '捷運站前黃金店面' },
    { id: uuid(), name: '新北板橋店', description: '近府中商圈' },
  ],
  menu: [
    { id: uuid(), name: '經典牛肉堡', description: '人氣餐點', price: 120 },
    { id: uuid(), name: '香烤雞腿堡', description: '附贈薯條', price: 110 },
  ],
  staff: [
    { id: 'u-admin', name: '超級管理員', role: 'admin', email: 'admin@example.com' },
    { id: 'u-manager', name: '區域經理', role: 'manager', email: 'manager@example.com' },
    { id: 'u-staff', name: '基層員工', role: 'staff', email: 'staff@example.com' },
  ],
  wishes: [
    { id: uuid(), title: '增加下午茶時段點心', status: 'pending', votes: 8 },
  ],
  incentives: {
    targetAvgBV: 820,
    bonusAmount: 3000,
  },
  points: {
    base: 360,
    monthCap: 40,
  },
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
    if (!data.title.trim() || !data.content.trim()) {
      Swal.fire('請完整填寫', '', 'warning');
      return;
    }
    if (ann) {
      Object.assign(ann, {
        type: data.type,
        title: data.title.trim(),
        content: data.content.trim(),
        imageUrl: data.imageUrl.trim(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      state.announcements.push({
        id: uuid(),
        type: data.type,
        title: data.title.trim(),
        content: data.content.trim(),
        imageUrl: data.imageUrl.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: null,
        createdBy: state.currentUser?.id ?? 'system',
      });
    }
    closeModal(modal);
    renderAnnouncements();
    renderAnnouncementManage();
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
  }).then((result) => {
    if (!result.isConfirmed) return;
    const index = state.announcements.findIndex((item) => item.id === id);
    if (index >= 0) {
      state.announcements.splice(index, 1);
      renderAnnouncements();
      renderAnnouncementManage();
      Swal.fire('已刪除', '', 'success');
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
    card.innerHTML = `
      <button class="edit-btn-report">編輯</button>
      <div class="text-xs text-gray-400">${formatDate(report.date)} · ${report.location}</div>
      <h3 class="font-semibold mt-1">${report.summary}</h3>
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
  container.innerHTML = `
    <span>共 ${total} 筆</span>
    ${Object.entries(byStatus)
      .map(([status, count]) => `<span>${status}: ${count}</span>`)
      .join(' · ')}`;
}

function openReportManageModal() {
  if (!['admin', 'manager'].includes(state.currentUser?.role)) return;
  const content = document.createElement('div');
  content.className = 'space-y-4';
  const controls = document.createElement('div');
  controls.className = 'flex flex-col md:flex-row gap-2';
  controls.innerHTML = `
    <input type="text" id="reportSearch" placeholder="搜尋摘要或據點" class="flex-1 border rounded px-3 py-2 text-sm" />
    <select id="reportStatusFilter" class="border rounded px-3 py-2 text-sm">
      <option value="">全部狀態</option>
      <option value="正常營業">正常營業</option>
      <option value="提早結束">提早結束</option>
      <option value="延後開始">延後開始</option>
      <option value="暫停營業">暫停營業</option>
    </select>`;
  content.appendChild(controls);

  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>日期</th>
        <th>據點</th>
        <th>狀態</th>
        <th>摘要</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody></tbody>`;
  const tbody = table.querySelector('tbody');
  content.appendChild(table);

  const footer = document.createElement('div');
  footer.className = 'flex justify-end';
  const addBtn = document.createElement('button');
  addBtn.className = 'px-3 py-2 bg-emerald-500 text-white rounded text-sm';
  addBtn.textContent = '新增戰報';
  footer.appendChild(addBtn);
  content.appendChild(footer);

  const modal = createModal({ title: '戰報管理', content, wide: true });

  function render(list = state.reports) {
    tbody.innerHTML = '';
    if (!list.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 5;
      cell.className = 'text-center text-xs text-gray-400 py-6';
      cell.textContent = '尚無戰報';
      row.appendChild(cell);
      tbody.appendChild(row);
      return;
    }
    list
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach((report) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${formatDate(report.date)}</td>
          <td>${report.location}</td>
          <td>${report.status}</td>
          <td class="text-xs text-gray-500">${report.summary}</td>
          <td class="flex gap-2">
            <button class="px-2 py-1 bg-blue-600 text-white rounded text-xs" data-action="edit" data-id="${report.id}">編輯</button>
            <button class="px-2 py-1 bg-red-600 text-white rounded text-xs" data-action="delete" data-id="${report.id}">刪除</button>
          </td>`;
        tbody.appendChild(row);
      });
  }

  function filter() {
    const keyword = controls.querySelector('#reportSearch').value.trim().toLowerCase();
    const status = controls.querySelector('#reportStatusFilter').value;
    const filtered = state.reports.filter((report) => {
      const matchesKeyword =
        !keyword ||
        report.summary.toLowerCase().includes(keyword) ||
        report.location.toLowerCase().includes(keyword);
      const matchesStatus = !status || report.status === status;
      return matchesKeyword && matchesStatus;
    });
    render(filtered);
  }

  controls.querySelector('#reportSearch').addEventListener('input', filter);
  controls.querySelector('#reportStatusFilter').addEventListener('change', filter);

  tbody.addEventListener('click', (evt) => {
    const button = evt.target.closest('button[data-action]');
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === 'edit') {
      closeModal(modal);
      openReportModal(id);
    } else if (action === 'delete') {
      deleteReport(id).then((removed) => {
        if (removed) {
          render();
        }
      });
    }
  });

  addBtn.addEventListener('click', () => {
    closeModal(modal);
    openReportModal();
  });

  render();
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

  if (report) {
    form.id.value = report.id;
    form.date.value = report.date;
    form.location.value = report.location;
    form.status.value = report.status;
    form.owner.value = report.owner;
    form.summary.value = report.summary;
  } else {
    form.date.value = new Date().toISOString().slice(0, 10);
  }

  const modal = createModal({
    title: report ? '編輯戰報' : '新增戰報',
    content: form,
  });

  form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const formData = Object.fromEntries(new FormData(form).entries());
    if (report) {
      Object.assign(report, {
        date: formData.date,
        location: formData.location,
        status: formData.status,
        owner: formData.owner,
        summary: formData.summary.trim(),
      });
    } else {
      state.reports.push({
        id: uuid(),
        date: formData.date,
        location: formData.location,
        status: formData.status,
        owner: formData.owner,
        summary: formData.summary.trim(),
        createdAt: new Date().toISOString(),
      });
    }
    closeModal(modal);
    renderReports();
    renderTodaySummary();
  });

  form.querySelector('[data-role="cancel"]').addEventListener('click', () => closeModal(modal));
}

function viewReport(id) {
  const report = state.reports.find((item) => item.id === id);
  if (!report) return;
  createModal({
    title: `${formatDate(report.date)} ${report.location}`,
    content: `
      <div class="space-y-3 text-sm">
        <div>狀態：${report.status}</div>
        <div>負責人：${getStaffName(report.owner)}</div>
        <div class="whitespace-pre-line">${report.summary}</div>
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
  }).then((result) => {
    if (!result.isConfirmed) return false;
    const index = state.reports.findIndex((item) => item.id === id);
    if (index >= 0) {
      state.reports.splice(index, 1);
      renderReports();
      renderTodaySummary();
      Swal.fire('已刪除', '', 'success');
      return true;
    }
    return false;
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
      if (!data.name.trim()) {
        Swal.fire('請輸入名稱', '', 'warning');
        return;
      }
      if (location) {
        Object.assign(location, { name: data.name.trim(), description: data.description.trim() });
      } else {
        state.locations.push({ id: uuid(), name: data.name.trim(), description: data.description.trim() });
      }
      closeModal(modal);
      onChange();
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
    }).then((result) => {
      if (!result.isConfirmed) return;
      const index = state.locations.findIndex((item) => item.id === id);
      if (index >= 0) {
        state.locations.splice(index, 1);
        onChange();
        populateLocationFilter();
        renderReports();
        renderTodaySummary();
      }
    });
  }
}

function showMenuEditModal() {
  if (!['admin', 'manager'].includes(state.currentUser?.role)) return;
  const content = document.createElement('div');
  content.className = 'space-y-4';
  const list = document.createElement('div');
  list.className = 'space-y-3';
  content.appendChild(list);
  const addBtn = document.createElement('button');
  addBtn.className = 'px-3 py-2 bg-orange-500 text-white rounded text-sm';
  addBtn.textContent = '新增菜單項目';
  content.appendChild(addBtn);

  const modal = createModal({ title: '菜單管理', content, wide: true });

  function render() {
    if (!state.menu.length) {
      list.innerHTML = '<div class="text-xs text-gray-400">尚無菜單項目</div>';
      return;
    }
    list.innerHTML = state.menu
      .map(
        (item) => `
          <div class="bg-white border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <div class="font-semibold text-sm">${item.name}</div>
              <div class="text-xs text-gray-500">${item.description || '—'}</div>
            </div>
            <div class="flex gap-2 text-xs items-center">
              <span class="font-semibold">$${item.price}</span>
              <button class="px-3 py-1 bg-blue-600 text-white rounded" data-action="edit" data-id="${item.id}">編輯</button>
              <button class="px-3 py-1 bg-red-600 text-white rounded" data-action="delete" data-id="${item.id}">刪除</button>
            </div>
          </div>`
      )
      .join('');
  }

  addBtn.addEventListener('click', () => openMenuForm());
  list.addEventListener('click', (evt) => {
    const button = evt.target.closest('button[data-action]');
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === 'edit') {
      openMenuForm(id);
    } else if (action === 'delete') {
      deleteMenuItem(id);
    }
  });

  function openMenuForm(id = null) {
    const form = document.createElement('form');
    form.className = 'space-y-3';
    form.innerHTML = `
      <input type="hidden" name="id" />
      <div>
        <label class="text-xs text-gray-500">品項名稱</label>
        <input type="text" name="name" required class="w-full border rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="text-xs text-gray-500">描述</label>
        <textarea name="description" rows="3" class="w-full border rounded px-3 py-2 text-sm"></textarea>
      </div>
      <div>
        <label class="text-xs text-gray-500">價格</label>
        <input type="number" min="0" name="price" required class="w-full border rounded px-3 py-2 text-sm" />
      </div>
      <div class="flex justify-between items-center">
        <button type="button" data-role="delete" class="px-3 py-2 bg-red-100 text-red-600 rounded hidden">刪除</button>
        <div class="flex gap-2">
          <button type="button" data-role="cancel" class="px-3 py-2 bg-gray-200 rounded">取消</button>
          <button type="submit" class="px-3 py-2 bg-orange-500 text-white rounded">儲存</button>
        </div>
      </div>`;

    const item = id ? state.menu.find((menu) => menu.id === id) : null;
    if (item) {
      form.id.value = item.id;
      form.name.value = item.name;
      form.description.value = item.description ?? '';
      form.price.value = item.price;
      form.querySelector('[data-role="delete"]').classList.remove('hidden');
    }

    const modal = createModal({ title: item ? '編輯品項' : '新增品項', content: form });

    form.addEventListener('submit', (evt) => {
      evt.preventDefault();
      const formData = Object.fromEntries(new FormData(form).entries());
      if (!formData.name.trim()) {
        Swal.fire('請輸入品項名稱', '', 'warning');
        return;
      }
      const price = Number(formData.price);
      if (Number.isNaN(price) || price < 0) {
        Swal.fire('請輸入有效價格', '', 'warning');
        return;
      }
      if (item) {
        Object.assign(item, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          price,
        });
      } else {
        state.menu.push({
          id: uuid(),
          name: formData.name.trim(),
          description: formData.description.trim(),
          price,
        });
      }
      closeModal(modal);
      render();
    });

    form.querySelector('[data-role="cancel"]').addEventListener('click', () => closeModal(modal));
    form.querySelector('[data-role="delete"]').addEventListener('click', () => {
      closeModal(modal);
      deleteMenuItem(id);
    });
  }

  function deleteMenuItem(id) {
    Swal.fire({
      title: '確定刪除品項？',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '刪除',
      confirmButtonColor: '#d33',
    }).then((result) => {
      if (!result.isConfirmed) return;
      const index = state.menu.findIndex((item) => item.id === id);
      if (index >= 0) {
        state.menu.splice(index, 1);
        render();
      }
    });
  }

  render();
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
      if (!formData.name.trim()) {
        Swal.fire('請輸入姓名', '', 'warning');
        return;
      }
      if (staff) {
        Object.assign(staff, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
        });
      } else {
        state.staff.push({
          id: uuid(),
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
        });
      }
      closeModal(modal);
      render();
      renderReports();
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
    }).then((result) => {
      if (!result.isConfirmed) return;
      const index = state.staff.findIndex((item) => item.id === id);
      if (index >= 0) {
        state.staff.splice(index, 1);
        render();
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
    if (action === 'vote') {
      wish.votes += 1;
    } else if (action === 'toggle') {
      const order = ['pending', 'approved', 'fulfilled'];
      const index = order.indexOf(wish.status);
      wish.status = order[(index + 1) % order.length];
    } else if (action === 'delete') {
      state.wishes = state.wishes.filter((item) => item.id !== id);
    }
    render();
  });

  form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const title = form.title.value.trim();
    if (!title) {
      Swal.fire('請輸入願望內容', '', 'warning');
      return;
    }
    state.wishes.push({ id: uuid(), title, status: 'pending', votes: 0 });
    form.reset();
    render();
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

function handleLogin(evt) {
  evt.preventDefault();
  const email = dom.email.value.trim();
  const password = dom.password.value;
  const user = MOCK_USERS.find((item) => item.email === email && item.password === password);
  if (!user) {
    Swal.fire('登入失敗', '帳號或密碼錯誤', 'error');
    return;
  }
  state.currentUser = { ...user };
  dom.loginPage.classList.add('hidden');
  dom.mainSystem.classList.remove('hidden');
  renderAfterLogin();
}

function renderAfterLogin() {
  setFeatureVisibility();
  renderLevelInfo();
  renderQuarterIncentive();
  renderUserSummary();
  renderAnnouncements();
  populateLocationFilter();
  renderReports();
  renderTodaySummary();
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

  dom.quickTodayStats.textContent = `今日戰報 ${state.reports.length} 筆 · 公告 ${state.announcements.length} 則`;
}

function handleLogout() {
  state.currentUser = null;
  dom.mainSystem.classList.add('hidden');
  dom.loginPage.classList.remove('hidden');
  dom.loginForm.reset();
}

function showRegisterHint() {
  Swal.fire('提示', '請聯絡管理員建立帳號。', 'info');
}

function showResetPassword() {
  const email = dom.email.value.trim();
  if (!email) {
    Swal.fire('請先輸入 Email', '', 'warning');
    return;
  }
  Swal.fire('已寄出重設信', `${email} 請至信箱確認`, 'success');
}

function quickLogin(role) {
  const user = MOCK_USERS.find((item) => item.role === role) ?? MOCK_USERS.find((item) => item.role === 'staff');
  if (!user) return;
  dom.email.value = user.email;
  dom.password.value = user.password;
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
}

document.addEventListener('DOMContentLoaded', bootstrap);
