函數 uuid() {
  如果（typeof crypto！=='未定義'&&typeof crypto.randomUUID ==='函數'）{
    返回 crypto.randomUUID()；
  }

  返回“id-”+Math.random().toString(36).slice(2, 11);
}

const MOCK_USERS = [
  { id: 'u-admin', email: 'admin@example.com', password: 'password', displayName: '超級管理員', role: 'admin', bv: 950 },
  { id: 'u-manager', email: 'manager@example.com', password: 'password', displayName: '區域經理', role: 'manager', bv: 780 },
  { id: 'u-staff', email: 'staff@example.com', password: 'password', displayName: '基層員工', role: 'staff', bv: 420 },
];

const LEVEL_RANGES = [
  { 碼：'lv1'，名稱：'Lv1'，最小值：0，最大值：399 }，
  { 程式碼：'lv2'，名稱：'Lv2'，最小值：400，最大值：549 }，
  { 程式碼：'lv3'，名稱：'Lv3'，最小值：550，最大值：699 }，
  { 程式碼：'lv4'，名稱：'Lv4'，最小值：700，最大值：819 }，
  { 程式碼：'lv5'，名稱：'Lv5'，最小值：820，最大值：899 }，
  { 程式碼：'lv6'，名稱：'Lv6'，最小值：900，最大值：959 }，
  { 程式碼：'lv7'，名稱：'Lv7'，最小值：960，最大值：1000 }，
  { 程式碼：'ex'，名稱：'EX'，最小值：1001，最大值：1100 }，
];

const DAY_KEYS = ['星期一', '星期二', '星期三', '星期四', '星期五'];
const DAY_LABELS = {
  monday: '週一',
  tuesday: '週二',
  wednesday: '週三',
  thursday: '週四',
  friday: '週五',
};

const STORAGE_KEYS = {
  MENU_PLANNER: '戰爭儀表板選單規劃器',
};

函數 createDefaultMenuPlanner() {
  const baseItems = [
    {
      id: uuid()，
      name: '經典牛肉堡',
      價格：120，
      預設數量：{}，
      配送總額：0，
    }，
    {
      id: uuid()，
      name: '香烤雞腿堡',
      價格：110，
      預設數量：{}，
      配送總額：0，
    }，
  ];
  const 模板 = DAY_KEYS.reduce((acc, key) => {
    acc[鍵] = {
      項目：baseItems.map（（item）=>（{...item，id：uuid（）}）），
      dailySpecial: { name: key === 'wednesday' ? '限定炸雞拼盤' : '', price: 0 },
      updatedAt: 新日期（）。 toISOString（），
    };
    返回 acc；
  }, {});
  返回 {
    模板，
    歷史： []，
    lastSavedAt: null,
  };
}

函數 loadMenuPlanner() {
  嘗試 {
    const raw = typeof localStorage !== 'undefined' ?localStorage.getItem(STORAGE_KEYS.MENU_PLANNER) : null;
    如果（！raw）返回createDefaultMenuPlanner（）；
    const parsed = JSON.parse(raw);
    如果（！解析|| typeof解析！=='object'）返回createDefaultMenuPlanner（）;
    parsed.history = Array.isArray(parsed.history) ? parsed.history : [];
    parsed.templates = parsed.templates && typeof parsed.templates === 'object' ?parsed.templates : {};
    DAY_KEYS.forEach((鍵) => {
      如果（！解析的模板[key]）{
        解析.模板[key] = createDefaultMenuPlanner().模板[key];
      }
    });
    返回解析結果；
  } 捕獲（錯誤）{
    console.warn('[menuPlanner] 載入失敗，使用預設值', error);
    返回 createDefaultMenuPlanner()；
  }
}

函數 persistMenuPlanner() {
  嘗試 {
    如果（typeof localStorage ==='undefined'）返回；
    const 有效載荷 = JSON.stringify(state.menuPlanner);
    localStorage.setItem（STORAGE_KEYS.MENU_PLANNER，酬載）；
  } 捕獲（錯誤）{
    console.warn('[menuPlanner] 持久化失敗', error);
  }
}

常量狀態 = {
  currentUser: null，
  公告：[
    {
      id: uuid()，
      類型：'重要'，
      title: '新品上市通知',
      content: '本週推出全新套餐，請各據點協助宣傳。',
      圖片網址：''，
      建立時間：new Date().toISOString()，
      updatedAt: null,
      創建者：'u-admin'，
    }，
  ]，
  報告：[
    {
      id: uuid()，
      日期：new Date().toISOString().slice(0, 10)，
      location: '台北館前店',
      status: '正常營業',
      summary: '今日營運順利，午餐時段人潮踴躍。',
      擁有者：'u-manager'，
      建立時間：new Date().toISOString()，
      最終總計：18500，
      總計售出：240，
      總計剩餘：35，
      總折扣：500，
      電子支付：12000，
      尚未付款：0，
      徽章：['目標']，
      notes: '午餐出餐順暢。',
      customerFeedback: '顧客反應餐點口味佳。',
      myResponse: '持續加強服務品質。',
      選單模板：“星期一”，
      menuSnapshot：null，
      deliveryNotes: '外送25 份',
    }，
  ]，
  地點：[
    { id: uuid(), name: '台北館前店', description: '捷運站前黃金店面' },
    { id: uuid(), name: '新北板橋店', description: '近府中商圈' },
  ]，
  選單規劃器：loadMenuPlanner()，
  職員： [
    { id: 'u-admin', name: '超級管理員', role: 'admin', email: 'admin@example.com' },
    { id: 'u-manager', name: '區域經理', role: 'manager', email: 'manager@example.com' },
    { id: 'u-staff', name: '基層員工', role: 'staff', email: 'staff@example.com' },
  ]，
  願望：[
    { id: uuid(), title: '增加下午茶時段點心', status: 'pending', votes: 8 },
  ]，
  激勵措施：{
    目標平均BV：820，
    獎金金額：3000，
  }，
  積分：{
    基數：360，
    月上限：40，
  }，
};

如果（狀態報告[0]）{
  state.reports[0].menuSnapshot = buildMenuSnapshot(確保選單範本(state.reports[0].menuTemplate), state.reports[0].date, state.reports[0].menuTemplate);
}

const dom = {};

函數 qs（選擇器）{
  返回 document.querySelector(選擇器);
}

函數 qsa（選擇器）{
  返回 Array.from(document.querySelectorAll(選擇器));
}

函數格式日期（dateStr）{
  如果（！dateStr）返回''；
  const date = new Date(dateStr);
  返回 `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

函數格式日期時間（dateStr）{
  如果（！dateStr）返回''；
  const date = new Date(dateStr);
  返回 `${formatDate(dateStr)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

函數 getDayKeyFromDate(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDay();
  const mapping = { 1：'星期一'，2：'星期二'，3：'星期三'，4：'星期四'，5：'星期五' };
  返回映射[day] ??'星期一';
}

函數 getCurrentMenuDay() {
  返回 getDayKeyFromDate(new Date().toISOString().slice(0, 10));
}

函數格式數字（值）{
  返回 Number(value ?? 0).toLocaleString();
}

函數 cloneMenuData（資料）{
  返回 JSON.parse(JSON.stringify(資料));
}

函數確保選單範本（dayKey）{
  如果（！state.menuPlanner.templates[dayKey]）{
    狀態.menuPlanner.範本[dayKey] = createDefaultMenuPlanner().範本[dayKey];
  }
  返回 state.menuPlanner.templates[dayKey];
}

函數計算選單總計（模板）{
  const totalsByLocation = {};
  讓 grandTotal = 0;
  讓 deliveryTotal = 0;
  模板.items.forEach((item) => {
    Object.entries(item.defaultQuantity || {}).forEach(([loc, qty]) => {
      totalsByLocation[loc] = (totalsByLocation[loc] ?? 0) + Number(qty || 0);
      grandTotal += Number(qty || 0);
    });
    deliveryTotal += Number(item.deliveryTotal || 0);
    grandTotal += Number(item.deliveryTotal || 0);
  });
  返回 { totalsByLocation, grandTotal, deliveryTotal };
}

const BADGE_META = {
  TARGET: { text: '達標', className: 'badge-small badge-target' },
  EXCEED: { text: '超標', className: 'badge-small badge-exceed' },
  新品：{text:'新品', className:'badge-small badge-new'},
};

函數 renderBadgeChip(徽章) {
  const meta = BADGE_META[badge] || { text: badge, className: 'badge-small badge-new' };
  返回 `<span class="${meta.className}">${meta.text}</span>`;
}

函數 renderMenuSnapshotHtml(快照) {
  如果（！快照）{
    return '<div class="text-xs text-gray-400">未附菜單</div>';
  }
  const totals = 快照.totals || { totalsByLocation：{}， deliveryTotal：0， grandTotal：0 };
  const 位置 = Object.keys(totals.totalsByLocation || {});
  const items = (快照.items || [])
    .map((項目) => {
      const total = Object.values(item.defaultQuantity || {}).reduce((sum, qty) => sum + Number(qty || 0), 0) + Number(item.deliveryTotal || 0);
      返回 `<li class="flex justify-between"><span>${item.name}</span><span>${formatNumber(total)}</span></li>`;
    })
    。加入（''）;
  回傳`
    <div class="space-y-2 text-xs">
      <div class="flex justify-between"><span class="text-gray-500">特餐</span><span>${snapshot.dailySpecial?.name || '—'}</span></div>
      <div class="grid grid-cols-2 gap-2">
        ${位置.長度
          ?locations.map((loc) => `<div class="flex justify-between"><span>${loc}</span><span>${formatNumber(totals.totalsByLocation?.[loc] || 0)}</span></div>`).join('')
          : '<div class="text-gray-400 col-span-2">尚無據點數量</div>'}
      </div>
      <div class="flex justify-between text-emerald-600"><span>外送</span><span>${formatNumber(totals.deliveryTotal)}</span></div>
      <div class="flex justify-between font-semibold"><span>總量</span><span>${formatNumber(totals.grandTotal)}</span></div>
      ${items ? `<ul class="divide-y divide-slate-200">${items}</ul>` : ''}
    </div>`;
}

函數格式DayLabel（dayKey）{
  回傳 DAY_LABELS[dayKey] ?? dayKey;
}

函數 buildMenuSnapshot（模板，dateStr，dayKey）{
  const copy = cloneMenuData（模板）；
  const totals = computeMenuTotals（模板）；
  返回 {
    id: uuid()，
    日期：dateStr，
    dayKey，
    建立時間：new Date().toISOString()，
    項目：複製.項目|| []，
    dailySpecial：copy.dailySpecial || null，
    總計，
  };
}

函數 addMenuHistoryEntry（快照）{
  state.menuPlanner.history.unshift（快照）；
  state.menuPlanner.lastSavedAt = new Date().toISOString();
  persistMenuPlanner()；
}

函數 filterMenuHistory({ 開始， 結束 }) {
  const begin = start ? new Date(start) : null;
  const finish = end ? new Date(end) : null;
  返回 state.menuPlanner.history
    。片（）
    .filter((entry) => {
      const date = new Date(entry.date);
      如果 (開始 && 日期 < 開始) 回傳 false;
      如果（完成&&日期>完成）返回false；
      返回真；
    })
    .sort((a, b) => 新日期(b.date) - 新日期(a.date));
}

函數計算歷史聚合（條目）{
  const totalsByLocation = {};
  讓 grandTotal = 0;
  讓 deliveryTotal = 0;
  const now = new Date();
  const weekAgo = new Date(現在);
  weekAgo.setDate(now.getDate() - 6);
  const currentMonth = 現在.getMonth();
  const currentYear = now.getFullYear();
  const 每週總計 = {};
  讓 weeklyGrand = 0;
  const monthlyTotals = {};
  讓 monthlyGrand = 0;

  條目.forEach((條目) => {
    Object.entries(entry.totals.totalsByLocation || {}).forEach(([loc, qty]) => {
      totalsByLocation[loc] = (totalsByLocation[loc] ?? 0) + Number(qty || 0);
    });
    grandTotal += Number(entry.totals.grandTotal || 0);
    deliveryTotal += Number(entry.totals.deliveryTotal || 0);

    const entryDate = new Date(entry.date);
    如果（entryDate >= weekAgo && entryDate <= now）{
      Object.entries(entry.totals.totalsByLocation || {}).forEach(([loc, qty]) => {
        每週總計[loc] = (每週總計[loc] ?? 0) + 數字(數量 || 0);
      });
      每週Grand += Number(entry.totals.grandTotal || 0);
    }
    如果 (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
      Object.entries(entry.totals.totalsByLocation || {}).forEach(([loc, qty]) => {
        monthlyTotals[loc] = (monthlyTotals[loc] ?? 0) + Number(qty || 0);
      });
      monthlyGrand += Number(entry.totals.grandTotal || 0);
    }
  });

  返回 {
    按地點總計，
    累計，
    配送總額，
    每週總計，
    每周盛大，
    每月總計，
    每月大獎，
  };
}

函數 printMenuSnapshot(快照) {
  const w = window.open('', '_blank');
  如果（！w）{
    Swal.fire('無法開啟列印視窗', '', 'error');
    返回;
  }
  const totals = 快照.totals || { totalsByLocation：{}， grandTotal：0， deliveryTotal：0 };
  const 位置 = Object.keys(totals.totalsByLocation);
  w.document.寫入（`
    <html>
      <head>
        <title>菜單列印 ${snapshot.date}</title>
        <樣式>
          主體 { 字體系列：system-ui，sans-serif；填充：24px; }
          h1 { 字體大小：20px； 底部邊距：8px； }
          表格 { border-collapse: 折疊; 寬度: 100%; 上邊距: 16px; }
          th，td { 邊框：1px 實線 #ccc； 填充：6px 8px；字體大小：12px； }
          th { 背景：#f3f4f6; }
          tfoot th { 背景：#fef3c7; }
        </樣式>
      </head>
      <主體>
        <h1>${snapshot.date} ${formatDayLabel(snapshot.dayKey)} 菜單</h1>
        ${snapshot.dailySpecial?.name ? `<div>特餐：${snapshot.dailySpecial.name}</div>` : ''}
        <表格>
          <標題>
            <tr>
              <th>品項</th>
              <th>單價</th>
              ${locations.map((loc) => `<th>${loc}</th>`).join('')}
              <th>外送</th>
              <th>合計</th>
            </tr>
          </thead>
          <tbody>
            ${快照.項目
              .map((項目) => {
                const rowTotal = Object.values(item.defaultQuantity || {}).reduce((sum, qty) => sum + Number(qty || 0), 0) + Number(item.deliveryTotal || 0);
                回傳`
                  <tr>
                    <td>${item.name}</td>
                    <td class="text-right">${formatNumber(item.price || 0)}</td>
                    ${位置
                      .map((loc) => `<td class="text-right">${formatNumber(item.defaultQuantity?.[loc] || 0)}/td>`)
                      。加入（''）}
                    <td class="text-right">${formatNumber(item.deliveryTotal || 0)}</td>
                    <td class="text-right">${formatNumber(rowTotal)}</td>
                  </tr>`;
              })
              。加入（''）}
          </tbody>
          <tfoot>
            <tr>
              <th colspan="2">各據點總數</th>
              ${位置
                .map((loc) => `<th class="text-right">${formatNumber(totals.totalsByLocation?.[loc] || 0)}/th>`)
                。加入（''）}
              <th class="text-right">${formatNumber(totals.deliveryTotal)}
              <th class="text-right">${formatNumber(totals.grandTotal)}</th>
            </tr>
          </tfoot>
        </table>
        <p style="margin-top:12px;font-size:12px;color:#6b7280;">列印時間：${formatDateTime(new Date().toISOString())}</p>
      </body>
    </html>
  `);
  w.文檔.關閉（）；
  w.焦點（）；
  w.列印（）；
}

函數 createModal（{ 標題， 副標題 = ''， 內容， 寬 = false }）{
  const template = document.getElementById('modalShellTemplate');
  const 節點 = 模板.內容.firstElementChild.cloneNode(true);
  const 容器 = 節點.querySelector('div');
  如果（寬）{
    容器.classList.刪除（'max-w-3xl'）；
    容器.classList.新增（'max-w-5xl'）；
  }

  const header = document.createElement('div');
  header.className = '彈性項目-開始對齊-間隙-4';
  const titleWrapper = document.createElement('div');
  const titleEl = document.createElement('h2');
  titleEl.className = '模態標題';
  titleEl.textContent = 標題；
  titleWrapper.appendChild(titleEl);
  如果（字幕）{
    const sub = document.createElement('div');
    sub.className = '模態字幕';
    sub.textContent = 字幕;
    titleWrapper.appendChild（子）；
  }
  const closeBtn = document.createElement('按鈕');
  closeBtn.innerHTML = '×';
  closeBtn.className = 'text-2xl 文字-灰色-400 懸停：文字-灰色-600';
  closeBtn.addEventListener('點選', () => closeModal(node));
  header.appendChild（titleWrapper）；
  header.appendChild（closeBtn）；
  容器.appendChild（標題）；

  如果（內容類型 === '字串'）{
    const wrapper = document.createElement('div');
    包裝器.內部HTML = 內容；
    容器.appendChild（包裝器）；
  } else if (Node 的內容實例) {
    容器.appendChild（內容）；
  }否則，如果（Array.isArray（內容））{
    內容.forEach（（child）=>容器.appendChild（child））;
  }

  node.addEventListener('點擊', (事件) => {
    如果（evt.target === 節點）{
      關閉模式（節點）；
    }
  });

  document.getElementById('modalBackdrops').appendChild(節點);
  返回節點；
}

函數 closeModal（modalEl）{
  modalEl.dispatchEvent(new CustomEvent('modal:close'));
  modalEl.刪除();
}

函數 setFeatureVisibility() {
  const isAdmin = state.currentUser?.role === 'admin';
  const isManager = isAdmin || state.currentUser?.role === '經理';

  dom.btnStaffManage?.classList.toggle('hidden', !(isAdmin || isManager));
  dom.btnReportManage？ .classList.toggle（'隱藏'，！isManager）；
  dom.btnAnnManage?.classList.toggle('隱藏', !isManager);
  dom.addAnnBtn?.classList.toggle('隱藏', !isManager);
  dom.btnMenuManage？ .classList.toggle（'隱藏'，！isManager）；
  dom.btnLocationManage？ .classList.toggle（'隱藏'，！isManager）；
}

函數 findLevel(bv) {
  對於（LEVEL_RANGES 的 const 範圍）{
    如果（bv >= range.min && bv <= range.max）返回範圍；
  }
  返回 LEVEL_RANGES[0]；
}

函數 nextLevel（程式碼）{
  如果（代碼==='ex'）返回null；
  const index = LEVEL_RANGES.findIndex((range) => range.code === code);
  如果（索引 === -1 || 索引 === LEVEL_RANGES.length - 1）返回 null；
  返回 LEVEL_RANGES[index + 1]；
}

函數 renderLevelInfo() {
  如果（！狀態.currentUser）{
    dom.levelDisplay.innerHTML = '';
    返回;
  }
  const bv = 狀態.currentUser.bv ?? 360;
  const level = findLevel(bv);
  const next = nextLevel(level.code);
  const 比率 = !next
    ？ 1
    ：Math.min(1，Math.max(0，(bv - level.min) / (next.min - level.min)));
  dom.levelDisplay.innerHTML = `
    <div class="flex flex-col items-center leading-tight text-xs">
      <div class="font-bold">${level.name} </div>
      <div class="text-gray-500">${bv} </div>
      <div class="w-24 mt-1">
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${ratio * 100}%"></div></div>
        <div class="text-[10px] mt-1 text-center">${next ? `差 ${Math.max(0, next.min - bv)}` : 'MAX'} </div>
      </div>
    </div>`;
}

函數 renderQuarterIncentive() {
  如果（！狀態.currentUser）{
    dom.quarterIncentivePanel.textContent = '--';
    dom.quarterIncentiveBadge.textContent = '';
    返回;
  }
  const 目標 = 狀態.激勵.targetAvgBV;
  const current = state.currentUser.bv ?? 0;
  const 徽章 = document.createElement('span');
  const 達到 = 目前 >= 目標；
  badge.className = `incentive-badge ${reached?'incentive-ok':'incentive-progress'}`;
  badge.textContent = reached ? '已達標' : `差 ${Math.max(0, target - current)} BV 達標`;
  dom.quarterIncentivePanel.textContent = `本季平均 BV 目標：${target}，獎金 ${state.incentives.bonusAmount} 元`;
  dom.quarterIncentiveBadge.innerHTML = '';
  dom.quarterIncentiveBadge.appendChild（徽章）；
}

函數 renderUserSummary() {
  dom.currentUserName.textContent = state.currentUser?.displayName ??'';
  dom.currentUserRoleBadge.textContent = 狀態.currentUser?.角色??'';
}

函數 renderAnnouncements（列表 = state.announcements）{
  const 容器 = dom.announcementsArea;
  容器.innerHTML = '';
  如果（！列表.長度）{
    container.innerHTML = '<div class="text-gray-400 text-xs">尚無公告</div>';
    返回;
  }

  清單
    。片（）
    .sort((a, b) => 新日期(b.createdAt) - 新日期(a.createdAt))
    .forEach((在) => {
      const card = document.createElement('文章');
      card.className = '公告項遊標指標';
      卡片.innerHTML = `
        <div class="flex justify-between items-start gap-3">
          <div>
            <div class="text-xs text-gray-400 mb-1">${formatAnnType(ann.type)} · ${formatDateTime(ann.updatedAt ?? ann.createdAt)}</div>
            <h3 class="font-semibold">${ann.title} </h3>
          </div>
          <span class="text-xs bg-slate-100 border border-slate-200 rounded px-2 py-0.5">${ann.type} </span>
        </div>
        <p class="text-sm text-gray-600 mt-2 line-clamp-3">${ann.content}
      `；
      card.addEventListener('點選', () => openAnnouncementDetail(ann.id));
      容器.appendChild（卡片）；
    });
}

函數 formatAnnType（類型）{
  const 地圖 = {
    important: '重要',
    adjustment: '調整',
    sharing: '趣事',
  };
  返回 map[type] ?? 類型；
}

函式 openAnnouncementDetail(id) {
  const ann = state.announcements.find((item) => item.id === id);
  如果（！ann）返回；
  const content = document.createElement('div');
  content.className = 'space-y-4 text-sm';
  內容.內部HTML = `
    <div class="text-xs text-gray-400">${formatAnnType(ann.type)} · ${formatDateTime(ann.updatedAt ?? ann.createdAt)} </div>
    <div class="whitespace-pre-line">${ann.content} </div>
    ${ann.imageUrl ? `<img src="${ann.imageUrl}" alt="公告圖片" class="max-h-64 object-cover rounded border" />` : ''}
  `；

  const modal = createModal({
    標題：ann.title，
    內容，
  });

  const isManager = ['admin', 'manager'].includes(state.currentUser?.role);
  如果（是經理）{
    const 動作 = document.createElement('div');
    actions.className = 'flex gap-2 justify-end';
    const editBtn = document.createElement('按鈕');
    editBtn.className = 'px-3 py-2 bg-blue-600 文字-白色圓角文字-sm';
    editBtn.textContent = '編輯';
    editBtn.addEventListener('點擊', () => {
      關閉模態框（模態框）；
      openAnnouncementModal(ann.id);
    });
    const deleteBtn = document.createElement('按鈕');
    deleteBtn.className = 'px-3 py-2 bg-red-600 文字-白色圓角文字-sm';
    deleteBtn.textContent = '刪除';
    deleteBtn.addEventListener('點擊', () => {
      關閉模態框（模態框）；
      刪除公告（ann.id）；
    });
    操作.附加（editBtn，deleteBtn）；
    內容.appendChild（動作）；
  }
}

函數 openAnnouncementModal(id = null) {
  const template = document.getElementById('announcementFormTemplate');
  const form = template.content.firstElementChild.cloneNode(true);
  const ann = id ? state.announcements.find((item) => item.id === id) : null;
  如果（安妮）{
    表單.id.值 = ann.id;
    表單.類型.值 = ann.類型;
    表單.標題.值 = ann.標題;
    表單.內容.值=ann.內容；
    表單.imageUrl.值 = ann.imageUrl ??'';
  }

  const modal = createModal({
    title: ann ? '編輯公告' : '新增公告',
    內容：形式，
  });

  形式.addEventListener('提交', (evt) => {
    evt.preventDefault()；
    const 資料 = Object.fromEntries(new FormData(form).entries());
    如果（！資料.標題.修剪（）||！資料.內容.修剪（））{
      Swal.fire('請完整填寫', '', 'warning');
      返回;
    }
    如果（安妮）{
      物件.assign(ann，{
        類型：data.type，
        標題：data.title.trim()，
        內容：data.content.trim()，
        圖像Url：data.imageUrl.trim()，
        updatedAt: 新日期（）。 toISOString（），
      });
    } 別的 {
      狀態.公告.推播（{
        id: uuid()，
        類型：data.type，
        標題：data.title.trim()，
        內容：data.content.trim()，
        圖像Url：data.imageUrl.trim()，
        建立時間：new Date().toISOString()，
        updatedAt: null,
        創作者：state.currentUser?.id ??'系統'，
      });
    }
    關閉模態框（模態框）；
    渲染公告（）；
    渲染公告管理（）；
  });

  form.querySelector('[data-role="cancel"]').addEventListener('點擊', () => closeModal(modal));
}

函式 deleteAnnouncement(id) {
  Swal.fire({
    title: '確定刪除？',
    圖示：“警告”，
    顯示取消按鈕：true，
    confirmButtonText: '刪除',
    確認按鈕顏色：'#d33'，
  }).then((結果) => {
    如果（！result.isConfirmed）返回；
    const index = state.announcements.findIndex((item) => item.id === id);
    如果（索引> = 0）{
      狀態.公告.拼接（索引，1）；
      渲染公告（）；
      渲染公告管理（）；
      Swal.fire('已刪除', '', 'success');
    }
  });
}

函數 renderAnnouncementManage（列表 = state.announcements）{
  如果（！dom.annManageList）返回；
  dom.annManageList.innerHTML = '';
  如果（！列表.長度）{
    dom.annManageList.innerHTML = '<div class="text-xs text-gray-400">無公告</div>';
    返回;
  }

  清單
    。片（）
    .sort((a, b) => 新日期(b.createdAt) - 新日期(a.createdAt))
    .forEach((在) => {
      const row = document.createElement('div');
      row.className = '邊框圓角 p-3 bg-空白-y-2';
      行.innerHTML = `
        <div class="flex justify-between items-start gap-3">
          <div>
            <div class="font-semibold text-sm">${ann.title} </div>
            <div class="text-[11px] text-gray-400">${formatAnnType(ann.type)} · ${formatDateTime(ann.updatedAt ?? ann.createdAt)} </div>
          </div>
          <div class="flex gap-2">
            <button class="px-2 py-1 text-[11px] bg-blue-600 text-white rounded">編輯</button>
            <button class="px-2 py-1 text-[11px] bg-red-600 text-white rounded">刪除</button>
          </div>
        </div>
        <div class="text-xs text-gray-500 line-clamp-2">${ann.content.replace(/\n/g, ' ')}
      `；
      const [editBtn，deleteBtn] = row.querySelectorAll（'按鈕'）;
      editBtn.addEventListener('點選', () => openAnnouncementModal(ann.id));
      deleteBtn.addEventListener('點擊', () => deleteAnnouncement(ann.id));
      dom.annManageList.appendChild（行）；
    });
}

函數 showAnnouncementManageModal() {
  如果（！['admin'，'manager'].includes（state.currentUser？.role））返回；
  const content = document.createElement('div');
  content.className = 'space-y-4';
  const 控制項 = document.createElement('div');
  控制.className ='flex flex-col md：flex-row gap-2';
  控制項.innerHTML = `
    <input type="text" id="annSearch" placeholder="搜尋標題或內容" class="flex-1 border rounded px-3 py-2 text-sm" />
    <select id="annTypeFilter" class="border rounded px-3 py-2 text-sm">
      <option value="">全部類型</option>
      <option value="important">重要</option>
      <option value="adjustment">調整</option>
      <option value="sharing">趣事</option>
    </select>`;
  內容.appendChild（控制）；
  const 列表 = document.createElement('div');
  列表.id = 'annManageList';
  列表.className ='space-y-3';
  內容.appendChild（列表）；

  const modal = createModal({ title: '公告管理', content, wide: true });
  dom.annManageList = 列表；
  modal.addEventListener('modal:關閉', () => {
    dom.ann管理清單 = 空;
  });

  控制項.querySelector('#annSearch').addEventListener('input', () => filterAnnouncementManage(modal));
  控制項.querySelector('#annTypeFilter').addEventListener('change', () => filterAnnouncementManage(modal));

  渲染公告管理（）；
}

函式 filterAnnouncementManage（模態）{
  const search = modal.querySelector('#annSearch').value.trim().toLowerCase();
  const 類型 = modal.querySelector('#annTypeFilter').value;
  const filtered = state.announcements.filter((ann) => {
    const matchesType = !type || ann.type === type;
    const matchesSearch =
      ！搜尋 ||
      ann.title.toLowerCase().包括（搜尋）||
      ann.content.toLowerCase().包括（搜尋）；
    返回 matchesType && matchesSearch;
  });
  renderAnnouncementManage（已過濾）；
}

函數渲染報告（）{
  const 容器 = dom.reportsContainer;
  const empty = dom.reportsEmpty;
  const 資料 = applyReportFilters();
  容器.innerHTML = '';
  渲染報表聚合（資料）；
  如果（！數據.長度）{
    空的.classList.刪除（'隱藏'）；
    返回;
  }
  空的.classList.新增（'隱藏'）；

  數據.forEach((報告) => {
    const card = document.createElement('文章');
    card.className = '成績單';
    const badges = (report.badges || []).map((badge) => renderBadgeChip(badge)).join(' ');
    const amountText = 報告.finalTotal ? `NT$ ${formatNumber(report.finalTotal)}` : '';
    const deliveryText = report.deliveryNotes ? `<div class="mt-2 text-xs text-amber-600">外送：${report.deliveryNotes}</div>` : '';
    卡片.innerHTML = `
      <button class="edit-btn-report">編輯</button>
      <div class="flex justify-between items-start gap-3">
        <div>
          <div class="text-xs text-gray-400">${formatDate(report.date)} · ${report.location} </div>
          <h3 class="font-semibold mt-1">${report.summary} </h3>
          ${徽章？ `<div class="mt-2 flex flex-wrap gap-1">${徽章}}</div>`：''}
          ${deliveryText}
        </div>
        <div class="text-right text-sm font-semibold text-emerald-600">${amountText} </div>
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
    editBtn.addEventListener('點擊', (evt) => {
      可能.stopPropagation()；
      開啟報告模式（報告.id）；
    });
    const [viewBtn，deleteBtn] = card.querySelectorAll('.actions 按鈕');
    viewBtn.addEventListener('點擊', () => viewReport(report.id));
    deleteBtn.addEventListener('點擊', () => deleteReport(report.id));
    容器.appendChild（卡片）；
  });
}

函數 getStaffName(id) {
  return state.staff.find((user) => user.id === id)?.name ?? '未知成員';
}

函數 renderReportAggregates（報告）{
  const 容器 = dom.reportAggregates;
  const total = 報告.長度;
  const byStatus = reports.reduce((acc, report) => {
    acc[報告.狀態] = (acc[報告.狀態] ?? 0) + 1;
    返回 acc；
  }, {});
  const TotalAmount = reports.reduce((sum, report) => sum + Number(report.finalTotal || 0), 0);
  容器.innerHTML = `
    <span>共 ${total} 筆</span>
    <span>總實收 $${formatNumber(totalAmount)}</span>
    ${Object.entries(按狀態)
      .map(([status, count]) => `<span>${status}: ${count}</span>`)
      .加入（'·'）}`；
}

函數 openReportManageModal() {
  如果（！['admin'，'manager'].includes（state.currentUser？.role））返回；
  const today = new Date().toISOString().slice(0, 10);
  const monthFirst = `${today.slice(0, 8)}01`;

  const content = document.createElement('div');
  content.className = 'space-y-4';
  內容.內部HTML = `
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
        </選擇>
      </div>
      <div>
        <label class="block mb-1 text-gray-600">員工</label>
        <select data-filter="staff" class="w-full border rounded px-2 py-1">
          <option value="">全部</option>
          ${state.staff.map((staff) => `<option value="${staff.id}">${staff.name}</option>`).join('')}
        </選擇>
      </div>
      <div>
        <label class="block mb-1 text-gray-600">狀態</label>
        <select data-filter="status" class="w-full border rounded px-2 py-1">
          <option value="">全部</option>
          <option value="正常營業">正常營業</option>
          <option value="提早結束">提早結束</option>
          <option value="延後開始">延後開始</option>
          <option value="暫停營業">暫停營業</option>
        </選擇>
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
        <button data-action="reset" class="flex-1 px-3 py-1.5 bg-gray-300 text-gray-700 rounded">重設</button>
      </div>
      <div class="md:col-span-3 text-[11px] text-gray-500 flex items-end">提示：可輸入多組關鍵字，以空白分隔 (AND)，金額範圍為前端過濾。</div>
    </div>
    <div id="reportManageStats" class="text-xs text-gray-600">統計載入中...</div>
    <div class="border rounded-lg overflow-hidden">
      <table class="w-全文-[12px]">
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
        <button data-action="export" class="px-3 py-1.5 bg-indigo-600 text-white rounded">導出 CSV</button>
        <button data-action="bulk-delete" class="px-3 py-1.5 bg-rose-600 text-white rounded">批次刪除</button>
      </div>
      <button data-action="close" class="px-3 py-1.5 bg-gray-200 text-gray-700 rounded">關閉</button>
    </div>
  `；

  const modal = createModal({ title: '戰報管理總覽', content, wide: true });
  const 過濾器 = {
    開始：月份第一，
    結束：今天，
    地點： ''，
    職員： ''，
    地位： ''，
    千瓦：''，
    最低金額：''，
    最大金額：''，
  };
  讓 reportManageData = [];
  讓 searchTimer = null;

  const tbody = content.querySelector('#reportManageTbody');
  const statsEl = content.querySelector('#reportManageStats');
  const selectAll = content.querySelector('[data-role="select-all"]');

  函數applyFilters(){
    const startDate = filters.start || '0000-00-00';
    const endDate = filters.end || '9999-12-31';
    const minAmt = filters.minAmt ? Number(filters.minAmt) : null;
    const maxAmt = filters.maxAmt ? Number(filters.maxAmt) : null;
    const 關鍵字 = filters.kw
      .split(/\s+/)
      .map((kw) => kw.trim().toLowerCase())
      .filter（布林值）；

    報告管理資料 = 狀態報告
      .filter((報告) => {
        如果（報告.date <startDate ||報告.date>endDate）返回false；
        如果（filters.location && report.location !== filters.location）回傳 false；
        如果 (filters.staff && report.owner !== filters.staff) 回傳 false;
        如果（filters.status && report.status !== filters.status）回傳 false；
        const amount = Number(report.finalTotal ?? 0);
        如果 (minAmt !== null && amount < minAmt) 回傳 false;
        如果 (maxAmt !== null && amount > maxAmt) 回傳 false;
        如果（關鍵字.長度）{
          const haystack = [
            報告.摘要，
            報告.註釋，
            報告.客戶回饋，
            報告.我的回复，
            報告.交付明確，
            取得員工姓名（報告所有者），
            報告.位置，
          ]
            .filter（布林值）
            。加入（' '）
            .toLowerCase()；
          const matched = keywords.every((kw) => haystack.includes(kw));
          如果 (!matched) 返回 false；
        }
        返回真；
      })
      .sort((a, b) => {
        const dateDiff = 新日期（b.日期）-新日期（a.日期）；
        如果（dateDiff！== 0）返回dateDiff；
        返回新日期（b.createdAt || b.date） - 新日期（a.createdAt || a.date）；
      });
    渲染表（）；
    渲染統計資訊（）；
  }

  函數渲染表（）{
    如果（！reportManageData.length）{
      tbody.innerHTML = '<tr><td colspan="12" class="text-center p-6 text-gray-400 text-xs">無符合資料</td></tr>';
      選擇全部.選取 = false;
      返回;
    }
    tbody.innerHTML = 報告管理數據
      .map((報告) => {
        const badges = (report.badges || []).map((badge) => renderBadgeChip(badge)).join(' ');
        const createdAtText = report.createdAt ?formatDateTime(report.createdAt) : '';
        const snippet = [報告.摘要，報告.註釋，報告.客戶回饋]
          .filter（布林值）
          。加入（' / '）
          切片（0，60）；
        回傳`
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
      。加入（''）;
    選擇全部.選取 = false;
  }

  函數 renderStats() {
    如果（！reportManageData.length）{
      statsEl.textContent = '統計：無資料';
      返回;
    }
    const TotalAmount = reportManageData.reduce((sum, report) => sum + Number(report.finalTotal || 0), 0);
    const totalSold = reportManageData.reduce((sum, report) => sum + Number(report.totalSold || 0), 0);
    const totalRemain = reportManageData.reduce((sum, report) => sum + Number(report.totalRemaining || 0), 0);
    statsEl.innerHTML = `統計：筆數 <b>${reportManageData.length}</b> ｜ 總實收 <b>$${formatNumber(totalAmount)}</b> ｜ 總售出 <b>${formatNumber(totalSold)}</b> ｜ 總剩餘 <b>${formatNumber(totalRemain)}</b>`;
  }

  函數 getSelectedIds() {
    返回 Array.from(content.querySelectorAll('[data-role="row-check"]:checked')).map((input) => input.value);
  }

  函數 exportCsv() {
    如果（！reportManageData.length）{
      Swal.fire('無資料', '請先套用篩選條件取得資料。', 'info');
      返回;
    }
    const header = ['日期', '據點', '負責人', '狀態', '實收', '售出', '剩餘', '折扣', '電子支付', '未入帳', '徽章', '摘要'];
    const rows = reportManageData.map((報告) => [
      報告日期，
      報告.位置，
      取得員工姓名（報告所有者），
      報告狀態，
      報告.最終總計??0,
      報告總銷量 ?? 0,
      報告.剩餘總數??0,
      報告.總折扣??0,
      報告.電子支付??0,
      報告.尚未付款 ?? 0,
      （報告.徽章|| []）.加入（'|'），
      [report.summary, report.notes, report.customerFeedback].filter(Boolean).join(' / ').replace(/"/g, '""'),
    ]);
    const csv = [標題，...行]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .加入（'\n'）；
    const blob = new Blob([csv], { 類型：'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    連結.href = url;
    link.download = `報告_${Date.now()}.csv`;
    document.body.appendChild（連結）；
    連結.點擊();
    document.body.removeChild（連結）；
    URL.revokeObjectURL(url);
  }

  函數 bulkDelete() {
    const ids = getSelectedIds();
    如果（！ids.length）{
      Swal.fire('未選擇', '請先勾選要刪除的戰報', 'info');
      返回;
    }
    Swal.fire({
      title: `刪除 ${ids.length} 筆戰報？`,
      圖示：“警告”，
      顯示取消按鈕：true，
      confirmButtonText: '刪除',
      確認按鈕顏色：'#dc2626'，
    }).then((res) => {
      如果（！res.isConfirmed）返回；
      狀態.報告 = 狀態.報告.過濾器（（報告）=> ！ids.includes（報告.id））;
      渲染報告（）；
      渲染今日摘要（）；
      應用過濾器（）；
      Swal.fire('已刪除', '選定的戰報已刪除。', 'success');
    });
  }

  content.addEventListener('更改', (evt) => {
    const filterKey = evt.target.dataset.filter;
    如果（！filterKey）回傳；
    過濾器[filterKey] = evt.target.value;
    如果（filterKey！=='kw'）{
      應用過濾器（）；
    }
  });

  content.addEventListener('輸入', (evt) => {
    const filterKey = evt.target.dataset.filter;
    如果（！filterKey）回傳；
    過濾器[filterKey] = evt.target.value;
    如果（['kw'，'minAmt'，'maxAmt'].includes（filterKey））{
      清除超時（搜尋計時器）；
      searchTimer = 設定逾時（applyFilters，300）；
    }
  });

  content.addEventListener('點擊', (evt) => {
    const action = evt.target.dataset.action;
    如果（！動作）返回；
    如果（操作 === '應用'）{
      應用過濾器（）；
    } else if (action === '重設') {
      過濾器.開始=月份第一個；
      過濾器.結束=今天；
      過濾器.位置='';
      過濾器.員工='';
      過濾器.狀態='';
      過濾器.kw = '';
      過濾器.minAmt = '';
      過濾器.maxAmt = '';
      content.querySelectorAll('[資料過濾器]').forEach((輸入) => {
        如果（輸入.類型==='複選框'）輸入.選中=false；
        否則，如果（輸入.資料集.過濾器==='開始'）輸入.值=monthFirst；
        否則如果（input.dataset.filter ==='end'）input.value = today;
        否則輸入.值='';
      });
      應用過濾器（）；
    } else if (action === '重新載入') {
      應用過濾器（）；
    }否則，如果（操作==='導出'）{
      導出Csv()；
    } else if (action === '批次刪除') {
      批量刪除（）；
    } else if (action === '關閉') {
      關閉模態框（模態框）；
    } else if (['查看', '編輯', '刪除'].includes(action)) {
      const id = evt.target.資料集.id;
      如果（！id）返回；
      如果（動作 === '查看'）{
        查看報告（id）；
      } else if (action === '編輯') {
        關閉模態框（模態框）；
        開啟報告模式（id）；
      } else if (action === '刪除') {
        deleteReport(id).then((已刪除) => {
          如果（刪除）applyFilters()；
        });
      }
    }
  });

  content.addEventListener('更改', (evt) => {
    如果（evt.target.dataset.role ==='全選'）{
      const checked = evt.target.checked;
      content.querySelectorAll('[data-role="row-check"]').forEach((checkbox) => {
        複選框.checked = 已選取；
      });
    }
  });

  應用過濾器（）；
}


函數 openReportModal（id = null）{
  const 範本 = document.getElementById('reportFormTemplate');
  const form = template.content.firstElementChild.cloneNode(true);
  const report = id ? state.reports.find((item) => item.id === id) : null;

  const locationSelect = form.querySelector('選擇[name="location"]');
  狀態.位置.forEach((loc) => {
    const 選項 = document.createElement('選項');
    選項.值=loc.名稱；
    選項.textContent = loc.name;
    locationSelect.appendChild（選項）；
  });

  const ownerSelect = form.querySelector('select[name="owner"]');
  state.staff.forEach((staff) => {
    const 選項 = document.createElement('選項');
    選項.值=員工.id；
    選項.textContent = 員工.姓名;
    ownerSelect.appendChild（選項）；
  });

  const menuSelect = form.querySelector('select[name="menuTemplate"]');
  menuSelect.innerHTML = '<option value="">未指定</option>' + DAY_KEYS.map((day) => `<option value="${day}">${DAY_LABELS[day]} 預設</option>`).join('');
  const menuPreview = form.querySelector('[data-role="menu-preview"]');
  const badgeInputs = Array.from(form.querySelectorAll('input[name="badges"]'));

  const todayStr = new Date().toISOString().slice(0, 10);
  讓 menuManuallyChanged = false;
  讓 currentMenuSnapshot = 報告？ .menuSnapshot ？ cloneMenuData（report.menuSnapshot）：null；

  const assignNumber = (輸入名稱，值) => {
    const input = form.querySelector(`[name="${inputName}"]`);
    如果（！輸入）返回；
    輸入.值 = 值 ??'';
  };

  如果（報告）{
    表單.id.值 = 報告.id;
    表單.日期.值 = 報表.日期;
    表單.位置.值 = 報告.位置;
    表單.狀態.值=報告.狀態；
    表單.所有者.值=報告.所有者；
    allocateNumber('finalTotal', report.finalTotal ?? '');
    分配編號（'總售出量'，報告.總售出量？？''）；
    allocateNumber('totalRemaining', report.totalRemaining ?? '');
    分配編號（'總折扣'，報告.總折扣？？''）；
    分配編號（'electronicPayment'，報告.electronicPayment ??''）;
    分配編號（'尚未支付'，報告.尚未支付？？''）；
    表單.摘要.值 = 報告.摘要??'';
    表單.notes.value = 報告.notes ??'';
    表單.客戶回饋.值 = 報告.客戶回饋??'';
    表單.myResponse.值 = 報告.myResponse ??'';
    表單.deliveryNotes.value = 報告.deliveryNotes ??'';
    如果（報告.選單範本）{
      選單選擇.值=報告.選單模板；
    }
    badgeInputs.forEach((輸入) => {
      輸入.checked = 報告.徽章？ .包括（輸入.值）？ ？假；
    });
    如果（目前選單快照）{
      渲染快照（目前選單快照）；
    } else if (report.menuTemplate) {
      更新選單快照（報表。選單範本）；
    } 別的 {
      menuPreview.textContent = '未選擇菜單';
    }
  } 別的 {
    表單.日期.值=今天Str；
    表單.摘要.值='';
    const defaultDay = getDayKeyFromDate(todayStr);
    選單選擇.值=預設日；
    更新選單快照（預設日期）；
  }

  函數更新選單快照（dayKey）{
    如果（！dayKey）{
      目前選單快照 = 空；
      menuPreview.textContent = '未選擇菜單';
      返回;
    }
    const templateData = 確保選單範本（dayKey）；
    currentMenuSnapshot = buildMenuSnapshot(templateData，form.date.value || todayStr，dayKey);
    渲染快照（目前選單快照）；
  }

  函數 renderSnapshot（快照）{
    如果（！快照）{
      menuPreview.textContent = '未選擇菜單';
      返回;
    }
    const totals = 快照.totals || { totalsByLocation：{}， deliveryTotal：0， grandTotal：0 };
    const 位置 = Object.keys(totals.totalsByLocation || {});
    const itemsPreview = (快照.items || [])
      .切片（0，4）
      .map((項目) => {
        const total = Object.values(item.defaultQuantity || {}).reduce((sum, qty) => sum + Number(qty || 0), 0) + Number(item.deliveryTotal || 0);
        返回 `<li class="flex justify-between"><span>${item.name}</span><span>${formatNumber(total)}</span></li>`;
      })
      。加入（''）;
    選單預覽.innerHTML = `
      <div class="text-[11px] text-gray-500 mb-1">特餐：${snapshot.dailySpecial?.name || '—'}</div>
      <div class="grid grid-cols-2 gap-2 text-xs">
        ${位置.長度
          ?locations.map((loc) => `<div class="flex justify-between"><span>${loc}</span><span>${formatNumber(totals.totalsByLocation?.[loc] || 0)}</span></div>`).join('')
          : '<div class="text-gray-400 col-span-2">尚無據點數量</div>'}
      </div>
      <div class="mt-2 text-[11px] text-gray-500">外送 ${formatNumber(totals.deliveryTotal)} · 總量 ${formatNumber(totals.grandTotal)}</div>
      ${itemsPreview ? `<ul class="mt-2 space-y-1 text-[11px]">${itemsPreview}</ul>` : ''}`;
  }

  形式.date.addEventListener('更改', () => {
    const dayKey = getDayKeyFromDate(form.date.value || todayStr);
    如果（！選單手動更改）{
      選單選擇.值=dayKey；
    }
    如果（選單選擇.值）{
      更新選單快照（選單選擇.值）；
    }
  });

  menuSelect.addEventListener('更改', () => {
    選單手動更改 = 真；
    更新選單快照（選單選擇.值）；
  });

  const modal = createModal({
    title: report ? '編輯戰報' : '新增戰報',
    內容：形式，
  });

  形式.addEventListener('提交', (evt) => {
    evt.preventDefault()；
    const formData = new FormData(form);
    const toNumber = (值) => {
      const num = 數字（值）；
      返回 Number.isFinite(num) && num >= 0 ? num : 0;
    };
    const badges = badgeInputs.filter((input) => input.checked).map((input) => input.value);
    const menuTemplate = formData.get('選單模板') || '';
    讓快照 = currentMenuSnapshot;
    如果（選單模板）{
      快照 = buildMenuSnapshot（確保選單範本（選單範本），formData.get（'日期'），選單範本）；
    } else if (報告？.menuSnapshot && !snapshot) {
      快照 = cloneMenuData(report.menuSnapshot);
    }

    const 有效載荷 = {
      日期：formData.get('日期')，
      位置：formData.get（'位置'），
      狀態：formData.get（'status'），
      所有者：formData.get（'所有者'），
      摘要：（formData.get（'summary'）||''）.trim（），
      FinalTotal: toNumber(formData.get('finalTotal')),
      totalSold: toNumber(formData.get('totalSold')),
      總剩餘: toNumber(formData.get('totalRemaining')),
      總折扣： toNumber(formData.get('totalDiscount')),
      electronicPayment: toNumber(formData.get('electronicPayment')),
      尚未支付： toNumber(formData.get('尚未支付')),
      徽章，
      註：（formData.get（'notes'）||''）.trim（），
      客戶回饋：（formData.get（'客戶回饋'）||''）.trim（），
      myResponse: (formData.get('myResponse') || '').trim(),
      deliveryNotes: (formData.get('deliveryNotes') || '').trim(),
      選單模板，
      menuSnapshot：快照？ cloneMenuData（快照）：null，
    };

    如果（報告）{
      對象.分配（報告，有效載荷）；
    } 別的 {
      狀態報告推送（{id：uuid（），createdAt：new Date（）。toISOString（），...payload}）;
    }
    關閉模態框（模態框）；
    渲染報告（）；
    渲染今日摘要（）；
  });

  form.querySelector('[data-role="cancel"]').addEventListener('點擊', () => closeModal(modal));
}


函數 viewReport(id) {
  const report = state.reports.find((item) => item.id === id);
  如果（！報告）返回；
  const badges = (report.badges || []).map((badge) => renderBadgeChip(badge)).join(' ');
  建立模態框（{
    標題：`${formatDate(report.date)} ${report.location}`，
    內容：`
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
        ${徽章？ `<div class="flex flex-wrap gap-1 text-xs">${徽章}}</div>`：''}
        ${report.deliveryNotes ? `<div class="text-xs text-amber-600">外送：${report.deliveryNotes}</div>` : ''}
        <div class="whitespace-pre-line">${report.summary} </div>
        ${report.notes ? `<div class="text-xs text-gray-600">備註：${report.notes}</div>` : ''}
        ${report.customerFeedback ? `<div class="text-xs text-gray-600">顧客反饋：${report.customerFeedback}</div>` : ''}
        ${report.myResponse ? `<div class="text-xs text-gray-600">回覆：${report.myResponse}</div>` : ''}
        <div>
          <div class="text-sm font-semibold mb-1">選單</div>
          ${renderMenuSnapshotHtml(report.menuSnapshot)}
        </div>
      </div>`，
  });
}

函數 deleteReport(id) {
  返回 Swal.fire({
    title: '確定刪除戰報？',
    圖示：“警告”，
    顯示取消按鈕：true，
    confirmButtonText: '刪除',
    確認按鈕顏色：'#d33'，
  }).then((結果) => {
    如果（！result.isConfirmed）返回false；
    const index = state.reports.findIndex((item) => item.id === id);
    如果（索引> = 0）{
      狀態.報告.拼接（索引，1）；
      渲染報告（）；
      渲染今日摘要（）；
      Swal.fire('已刪除', '', 'success');
      返回真；
    }
    返回 false；
  });
}

函數applyReportFilters() {
  const 開始 = dom.filterStart.值;
  const end = dom.filterEnd.value;
  const 位置 = dom.filterLocation.值;
  const 狀態 = dom.filterStatus.值;

  返回狀態.報告.過濾器（（報告）=> {
    const 日期 = 報告.日期;
    const matchesStart = !開始 || 日期 >= 開始;
    const matchesEnd = !end || 日期 <= 結束;
    const matchesLocation = !location || report.location === location;
    const matchesStatus = !status || report.status === 狀態；
    返回 matchesStart && matchesEnd && matchesLocation && matchesStatus;
  });
}

函數 resetReportFilters() {
  dom.filterStart.value = '';
  dom.filterEnd.value = '';
  dom.filterLocation.value = '';
  dom.filterStatus.值 = '';
  渲染報告（）；
}

函數 populateLocationFilter() {
  dom.filterLocation.innerHTML = '<option value="">全部</option>';
  狀態.位置.forEach((loc) => {
    const 選項 = document.createElement('選項');
    選項.值=loc.名稱；
    選項.textContent = loc.name;
    dom.filterLocation.appendChild（選項）；
  });
}

函數 showLocationManageModal() {
  如果（！['admin'，'manager'].includes（state.currentUser？.role））返回；
  const content = document.createElement('div');
  content.className = 'space-y-4';
  const 列表 = document.createElement('div');
  列表.className ='space-y-3';
  列表.innerHTML = renderLocationListHTML();
  內容.appendChild（列表）；
  const addBtn = document.createElement('按鈕');
  addBtn.className = 'px-3 py-2 bg-violet-500 文字-白色圓角文字-sm';
  addBtn.textContent = '新增據點';
  addBtn.addEventListener('點擊', () => openLocationForm());
  內容.appendChild（addBtn）；

  const modal = createModal({ title: '據點管理', content, wide: true });

  函數渲染（）{
    列表.innerHTML = renderLocationListHTML();
    填充位置過濾器（）；
    渲染今日摘要（）；
  }

  函數 renderLocationListHTML() {
    if (!state.locations.length) return '<div class="text-xs text-gray-400">尚無據點</div>';
    返回州/地點
      。地圖（
        (地點) => `
          <div class="bg-white border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <div class="font-semibold text-sm">${loc.name} </div>
              <div class="text-xs text-gray-500">${loc.description || '—'} </div>
            </div>
            <div class="flex gap-2 text-xs">
              <button class="px-3 py-1 bg-blue-600 text-white rounded" data-action="edit" data-id="${loc.id}">編輯</button>
              <button class="px-3 py-1 bg-red-600 text-white rounded" data-action="delete" data-id="${loc.id}">刪除</button>
            </div>
          </div>`
      ）
      。加入（''）;
  }

  list.addEventListener('點選', (evt) => {
    const button = evt.target.closest('按鈕[資料操作]');
    如果（！按鈕）返回；
    const { 動作，id } = 按鈕.資料集；
    如果（操作 === '編輯'）{
      開啟位置表單（id，渲染）；
    } else if (action === '刪除') {
      刪除位置（id，渲染）；
    }
  });

  函數 openLocationForm（id = null，onChange = render）{
    const template = document.getElementById('simpleListTemplate');
    const form = template.content.firstElementChild.cloneNode(true);
    const location = id ? state.locations.find((item) => item.id === id) : null;
    如果（位置）{
      表單.id.值 = 位置.id;
      表單.名稱.值 = 位置.名稱;
      表單.描述.值 = 位置.描述 ??'';
      form.querySelector('[data-role="delete"]').classList.remove('隱藏');
    }
    const modal = createModal({ title: location ? '編輯據點' : '新增據點', content: form });
    形式.addEventListener('提交', (evt) => {
      evt.preventDefault()；
      const 資料 = Object.fromEntries(new FormData(form).entries());
      如果（！資料.名稱.trim（））{
        Swal.fire('請輸入名稱', '', 'warning');
        返回;
      }
      如果（位置）{
        物件.assign（位置，{名稱：data.name.trim（），描述：data.description.trim（）}）;
      } 別的 {
        狀態.位置.推送（{id：uuid（），名稱：data.name.trim（），描述：data.description.trim（）}）;
      }
      關閉模態框（模態框）；
      onChange()；
    });
    form.querySelector('[data-role="cancel"]').addEventListener('點擊', () => closeModal(modal));
    form.querySelector('[data-role="delete"]').addEventListener('點擊', () => {
      關閉模態框（模態框）；
      刪除位置（id，onChange）；
    });
  }

  函數 deleteLocation（id，onChange = render）{
    Swal.fire({
      title: '確定刪除據點？',
      圖示：“警告”，
      顯示取消按鈕：true，
      confirmButtonText: '刪除',
      確認按鈕顏色：'#d33'，
    }).then((結果) => {
      如果（！result.isConfirmed）返回；
      const index = state.locations.findIndex((item) => item.id === id);
      如果（索引> = 0）{
        狀態.位置.拼接（索引，1）；
        onChange()；
        填充位置過濾器（）；
        渲染報告（）；
        渲染今日摘要（）；
      }
    });
  }
}

函數 showMenuEditModal() {
  如果（！['admin'，'manager'].includes（state.currentUser？.role））返回；
  const content = document.createElement('div');
  content.className = 'space-y-4';

  const tabBar = document.createElement('div');
  tabBar.className = 'flex gap-2 flex-wrap';
  tabBar.innerHTML = `
    <button data-tab="templates" class="px-3 py-1.5 rounded text-sm bg-indigo-600 text-white">預設菜單</button>
    <button data-tab="history" class="px-3 py-1.5 rounded text-sm bg-gray-200 text-gray-700">歷史紀錄 / 統計</button>`;
  內容.appendChild（tabBar）；

  const templateView = document.createElement('div');
  const historyView = document.createElement('div');
  historyView.classList.新增（'隱藏'）；

  內容.appendChild（範本視圖）；
  內容.appendChild（historyView）；

  const modal = createModal({ title: '菜單管理', content, wide: true });

  令 activeTab = '模板';
  讓 activeDay = window.__menuActiveDay || getCurrentMenuDay();
  const historyFilters = { 開始：''， 結束：'' };
  讓 recordDateValue = new Date().toISOString().slice(0, 10);

  const getLocationNames = () => state.locations.map((loc) => loc.name || loc.id);

  函數更新TabButtons() {
    tabBar.querySelectorAll('按鈕[data-tab]').forEach((btn​​) => {
      const isActive = btn.dataset.tab === activeTab;
      btn.className = `px-3 py-1.5 圓角文字-sm ${isActive ? 'bg-indigo-600 文字-白色' : 'bg-gray-200 文字-gray-700'}`;
    });
  }

  函數 switchTab（tab）{
    activeTab = 標籤；
    更新TabButtons()；
    templateView.classList.toggle('隱藏', tab !== '模板');
    historyView.classList.toggle('隱藏', tab !== '歷史');
    如果（tab ==='模板'）{
      渲染模板視圖（）；
    } 別的 {
      渲染歷史視圖（）；
    }
  }

  tabBar.addEventListener('點選', (evt) => {
    const btn = evt.target.closest('按鈕[data-tab]');
    如果（！btn）返回；
    switchTab（btn.dataset.tab）；
  });

  函數 renderTemplateView() {
    const 範本 = 確保選單模板（activeDay）；
    const 位置 = 取得位置名稱 ();
    如果（！位置.長度）{
      templateView.innerHTML = '<div class="border border-amber-200 bg-amber-50 text-amber-700 text-sm rounded p-4">請先於據點管理新增據點，再設定預設菜單。</div>';
      返回;
    }
    const dayButtons = DAY_KEYS.map((day) => {
      const active = day === activeDay ?'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700';
      返回 `<button data-day="${day}" class="px-3 py-1 text-xs border rounded ${active}">${DAY_LABELS[day]}</button>`;
    }）。加入（''）;

    const 行 = 模板.items
      .map((項目，索引) => {
        const rowTotal = Object.values(item.defaultQuantity || {}).reduce((sum, qty) => sum + Number(qty || 0), 0) + Number(item.deliveryTotal || 0);
        const locationCells = 位置
          .map((loc, locIndex) => {
            const 值 = item.defaultQuantity?.[loc] ?? 0;
            回傳`
              <td class="p-0 border">
                <input type="number" min="0" step="1" value="${value}"
                  資料欄位="數量" 資料索引="${index}" 資料位置索引="${locIndex}"
                  class="w-full px-2 py-1 text-xs text-right border-0 focus:ring-1 focus:ring-blue-500" />
              </td>`;
          })
          。加入（''）;
        回傳`
          <tr 資料索引="${index}">
            <td class="p-1 border align-top">
              <input data-field="name" data-index="${index}" value="${item.name || ''}" class="w-full px-2 py-1 text-xs border rounded" />
            </td>
            <td class="p-1 border align-top">
              <input type="number" min="0" step="1" data-field="price" data-index="${index}" value="${item.price ?? 0}"
                class="w-full px-2 py-1 text-xs 文字右邊框圓角" />
            </td>
            ${locationCells}
            <td class="p-1 border align-top">
              <input type="number" min="0" step="1" data-field="delivery" data-index="${index}" value="${item.deliveryTotal ?? 0}"
                class="w-full px-2 py-1 text-xs 文字右邊框圓角" />
            </td>
            <td class="p-1 border text-right font-semibold">
              <span data-role="row-total">${formatNumber(rowTotal)}</span>
            </td>
            <td class="p-1 邊框文字中心">
              <div class="flex gap-1 justify-center">
                <button data-action="move-up" data-index="${index}" class="px-2 py-1 text-[11px] bg-slate-200 rounded">↑</button>
                <button data-action="move-down" data-index="${index}" class="px-2 py-1 text-[11px] bg-slate-200 rounded">↓</button>
              </div>
            </td>
            <td class="p-1 邊框文字中心">
              <button data-action="remove-item" data-index="${index}" class="px-2 py-1 text-[11px] bg-red-100 text-red-600 rounded">刪除</button>
            </td>
          </tr>`;
      })
      。加入（''）;

    const totals = computeMenuTotals（模板）；
    templateView.innerHTML = `
      <div class="flex flex-wrap justify-between items-center gap-3">
        <div class="flex flex-wrap gap-2">${dayButtons} </div>
        <div class="flex flex-wrap gap-2 items-center text-xs">
          <label class="flex items-center gap-2">
            <span>記錄日期</span>
            <input type="date" value="${recordDateValue}" data-field="record-date" class="border rounded px-2 py-1 text-xs" />
          </標籤>
          <button data-action="record-day" class="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs">記錄今日菜單</button>
          <button data-action="print-day" class="px-3 py-1.5 bg-slate-600 text-white rounded text-xs">列印</button>
        </div>
      </div>
      <div class="bg-slate-50 border rounded p-3 flex flex-wrap justify-between gap-3">
        <label class="flex-1 min-w-[220px]">
          <span class="block text-[11px] text-gray-500 mb-1">特餐名稱 (${DAY_LABELS[activeDay]})</span>
          <input type="text" data-field="daily-special" value="${template.dailySpecial?.name || ''}" class="w-full px-2 py-1 text-sm border rounded" placeholder="例如：限量蔥抓餅" />
        </標籤>
        <div class="flex items-end gap-2">
          <button data-action="add-item" class="px-3 py-1.5 bg-orange-500 text-white rounded text-xs">+ 新增品項</button>
        </div>
      </div>
      <div class="border rounded overflow-auto">
        <table class="w-全文-[12px]">
          <thead class="bg-slate-100 sticky top-0 z-10">
            <tr>
              <th class="p-2 border text-left">名稱</th>
              <th class="p-2 border text-right">單價</th>
              ${locations.map((loc) => `<th class="p-2 border text-center">${loc}</th>`).join('')}
              <th class="p-2 border text-right">外送</th>
              <th class="p-2 border text-right">總計</th>
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
              ${位置
                .map((_, idx) => `<th class="p-2 border text-right"><span data-role="loc-total" data-loc-index="${idx}">${formatNumber(totals.totalsByLocation[locations[idx]">${formatNumber(totals.totalsByLocation[locations[idx]] || 0)}</s)>
                。加入（''）}
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
            ${位置
              .map((loc, idx) => `<li class="flex justify-between"><span>${loc}</span><span data-role="loc-total" data-loc-index="${idx}">${formatNumber(totals.totalsByLocation}loc] ||.
              。加入（''）}
            <li class="flex justify-between text-emerald-600"><span>外送</span><span data-role="delivery-total">${formatNumber(totals.deliveryTotal)}</span></li>
            <li class="flex justify-between font-semibold"><span>總計</span><span data-role="grand-total">${formatNumber(totals.grandTotal)}</span></li>
          </ul>
        </div>
        <div class="border rounded p-3 bg-white space-y-2">
          <div class="font-semibold text-sm">使用提示</div>
          <p class="text-[11px] text-gray-500 leading-relaxed">輸入數量後會即時儲存；可使用 ↑ / ↓ 調整品項排序，點擊「記錄今日菜單」將目前設定存入歷史。</p>
        </div>
      </div>`;

    更新範本摘要（範本）；
  }

  函數更新模板摘要（模板）{
    const 位置 = 取得位置名稱 ();
    templateView.querySelectorAll('tr[data-index]').forEach((row) => {
      const 索引 = 數字（行.資料集.索引）；
      const item = 模板.items[index];
      如果（！item）返回；
      const rowTotal = Object.values(item.defaultQuantity || {}).reduce((sum, qty) => sum + Number(qty || 0), 0) + Number(item.deliveryTotal || 0);
      const target = row.querySelector('[data-role="row-total"]');
      如果（目標）target.textContent = formatNumber（rowTotal）；
    });
    const totals = computeMenuTotals（模板）；
    位置.forEach((loc，idx) => {
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

  函數handleTemplateClick（evt）{
    const dayBtn = evt.target.closest('按鈕[data-day]');
    如果（dayBtn）{
      activeDay = dayBtn.資料集.day;
      視窗.__menuActiveDay = activeDay;
      渲染模板視圖（）；
      返回;
    }
    const actionBtn = evt.target.closest('按鈕[資料運算]');
    如果（！actionBtn）返回；
    const 範本 = 確保選單模板（activeDay）；
    const { 動作 } = actionBtn.dataset;
    如果（操作 === '新增項目'）{
      template.items.push({ id: uuid(), name: `新商品 ${template.items.length + 1}`, price: 0, defaultQuantity: {}, deliveryTotal: 0 });
      模板.updatedAt = 新日期().toISOString();
      persistMenuPlanner()；
      渲染模板視圖（）；
    } else if (action === '上移' || action === '下移') {
      const 索引 = 數字（actionBtn.dataset.index）；
      const delta = action === '上移' ? -1 : 1;
      const 目標索引 = 索引 + 增量；
      如果（targetIndex < 0 || targetIndex >= template.items.length）返回；
      const [item] = template.items.splice(index, 1);
      模板.items.splice（targetIndex，0，item）；
      模板.updatedAt = 新日期().toISOString();
      persistMenuPlanner()；
      渲染模板視圖（）；
    } else if (action === 'remove-item') {
      const 索引 = 數字（actionBtn.dataset.index）；
      Swal.fire({
        title: '刪除此品項？',
        圖示：“警告”，
        顯示取消按鈕：true，
        confirmButtonText: '刪除',
        確認按鈕顏色：'#dc2626'，
      }).then((res) => {
        如果（！res.isConfirmed）返回；
        模板.items.splice（索引，1）；
        模板.updatedAt = 新日期().toISOString();
        persistMenuPlanner()；
        渲染模板視圖（）；
      });
    } else if (action === '記錄日') {
      如果（！模板.項目.長度）{
        Swal.fire('尚無品項', '請先新增菜單品項再記錄。', 'info');
        返回;
      }
      const 快照 = buildMenuSnapshot(模板，recordDateValue || new Date().toISOString().slice(0, 10), activeDay);
      新增選單歷史記錄條目（快照）；
      Swal.fire('已記錄', `${snapshot.date} ${formatDayLabel(activeDay)} 菜單已存入歷史。`, 'success');
      渲染歷史視圖（）；
    } else if (action === 'print-day') {
      const 快照 = buildMenuSnapshot(模板，recordDateValue || new Date().toISOString().slice(0, 10), activeDay);
      列印選單快照（快照）；
    }
  }

  函數handleTemplateChange（evt）{
    const 範本 = 確保選單模板（activeDay）；
    const 目標 = evt.目標；
    如果（目標資料集欄位 === '記錄日期'）{
      記錄日期值 = 目標值 || 記錄日期值;
      返回;
    }
    如果（target.dataset.field ==='每日特價'）{
      const 名稱 = 目標.值.trim();
      如果（!template.dailySpecial）template.dailySpecial = {};
      模板.dailySpecial.name = 名稱；
      模板.updatedAt = 新日期().toISOString();
      persistMenuPlanner()；
      返回;
    }
    如果（目標資料集欄位 === '名稱'）{
      const 索引 = 數字（目標資料集.索引）；
      如果（！template.items [index]）返回；
      模板.items[index].name = 目標.value.trim();
      模板.updatedAt = 新日期().toISOString();
      persistMenuPlanner()；
    }否則，如果（目標資料集欄位==='價格'）{
      const 索引 = 數字（目標資料集.索引）；
      如果（！template.items [index]）返回；
      const 值 = 數字（目標值）；
      template.items[index].price = Number.isFinite(value) && value >= 0 ? value : 0;
      目標值 = 範本項目[索引]。價格；
      模板.updatedAt = 新日期().toISOString();
      persistMenuPlanner()；
    }
    更新範本摘要（範本）；
  }

  函數handleTemplateInput（evt）{
    const 目標 = evt.目標；
    const 範本 = 確保選單模板（activeDay）；
    如果（！['qty'，'delivery'].includes（target.dataset.field））返回；
    const 索引 = 數字（目標資料集.索引）；
    如果（！template.items [index]）返回；
    const 值 = 數字（目標值）；
    const safeValue = Number.isFinite(value) && value >= 0 ? value : 0;
    目標值 = 安全值；
    如果（目標資料集欄位 === '數量'）{
      const locIndex = Number(target.dataset.locIndex);
      const 位置 = 取得位置名稱 ();
      const loc = 位置[locIndex];
      如果（！loc）返回；
      如果（!template.items[index].defaultQuantity） template.items[index].defaultQuantity = {};
      模板.items[index].defaultQuantity[loc] = safeValue;
    } 否則，如果（target.dataset.field === 'delivery'）{
      模板.items[index].deliveryTotal = safeValue;
    }
    模板.updatedAt = 新日期().toISOString();
    persistMenuPlanner()；
    更新範本摘要（範本）；
  }

  templateView.addEventListener('點擊', handleTemplateClick);
  templateView.addEventListener('更改', handleTemplateChange);
  templateView.addEventListener('輸入'，handleTemplateInput);

  函數 renderHistoryView() {
    const allEntries = state.menuPlanner.history.slice();
    const filteredEntries = filterMenuHistory(historyFilters);
    const filteredStats = computeHistoryAggregates(filteredEntries);
    const globalStats = 計算歷史聚合（所有條目）；

    const currentLocations = getLocationNames();
    const locationSet = new Set(currentLocations);
    過濾後的條目.forEach((條目) => {
      Object.keys(entry.totals.totalsByLocation || {}).forEach((loc) => locationSet.add(loc));
    });
    const 位置 = 陣列.from(locationSet);

    const 行 = 已篩選條目
      .map((entry) => {
        const locationCells = 位置
          .map((loc) => `<td class="p-2 text-right">${formatNumber(entry.totals.totalsByLocation?.[loc] || 0)}/td>`)
          。加入（''）;
        回傳`
          <tr data-id="${entry.id}" class="border-b hover:bg-indigo-50/40">
            <td class="p-2">${entry.date}</td>
            <td class="p-2">${formatDayLabel(entry.dayKey)}</td>
            ${locationCells}
            <td class="p-2 text-right">${formatNumber(entry.totals.deliveryTotal)}</td>
            <td class="p-2 text-right font-semibold">${formatNumber(entry.totals.grandTotal)}</td>
            <td class="p-2 文字中心">
              <div class="flex gap-1 justify-center">
                <button data-action="history-view" data-id="${entry.id}" class="px-2 py-1 text-xs bg-blue-600 text-white rounded">查看</button>
                <button data-action="history-print" data-id="${entry.id}" class="px-2 py-1 text-xs bg-slate-600 text-white rounded">列印</button>
                <button data-action="history-restore" data-id="${entry.id}" class="px-2 py-1 text-xs bg-emerald-600 text-white rounded">套用</button>
                <button data-action="history-delete" data-id="${entry.id}" class="px-2 py-1 text-xs bg-red-600 text-white rounded">刪除</button>
              </div>
            </td>
          </tr>`;
      })
      。加入（''）;

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
        <button data-action="history-reset" class="px-3 py-1.5 bg-gray-300 text-sm rounded">重設</button>
      </div>
      <div class="grid md:grid-cols-2 gap-3 text-xs">
        <div class="border rounded p-3 bg-white">
          <div class="font-semibold text-sm mb-2">篩選結果 (${filteredEntries.length} 筆)</div>
          <ul class="space-y-1">
            ${位置
              .map((loc) => `<li class="flex justify-between"><span>${loc}</span><span>${formatNumber(filteredStats.totalsByLocation[loc] || 0)}</span></li>`)
              。加入（''）}
            <li class="flex justify-between text-emerald-600"><span>外送</span><span>${formatNumber(filteredStats.deliveryTotal)}</span></li>
            <li class="flex justify-between font-semibold"><span>總計</span><span>${formatNumber(filteredStats.grandTotal)}</span></li>
          </ul>
        </div>
        <div class="border rounded p-3 bg-white">
          <div class="font-semibold text-sm mb-2">本週 / 本月累計</div>
          <div class="space-y-2">
            <div>
              <div class="text-[11px] text-gray-500">近7 日</div>
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
        <table class="w-全文-[12px]">
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

  函數handleHistoryChange（evt）{
    如果（evt.target.dataset.field ==='history-start'）{
      historyFilters.start = evt.target.value || '';
      渲染歷史視圖（）；
    } 否則，如果（evt.target.dataset.field ==='history-end'）{
      historyFilters.end = evt.target.value || '';
      渲染歷史視圖（）；
    }
  }

  函數 showHistoryDe​​tail(id) {
    const entry = state.menuPlanner.history.find((item) => item.id === id);
    如果（！entry）返回；
    const 位置 = Array.from(new Set([...getLocationNames(), ...Object.keys(entry.totals.totalsByLocation || {})]));
    const 表 = document.createElement('表');
    table.className = 'w-全文-xs邊框';
    表格.內部HTML = `
      <thead class="bg-slate-100">
        <tr>
          <th class="p-2 border">品項</th>
          <th class="p-2 border text-right">單價</th>
          ${locations.map((loc) => `<th class="p-2 border text-right">${loc}</th>`).join('')}
          <th class="p-2 border text-right">外送</th>
          <th class="p-2 border text-right">總計</th>
        </tr>
      </thead>
      <tbody>
        ${entry.items
          .map((項目) => {
            const rowTotal = Object.values(item.defaultQuantity || {}).reduce((sum, qty) => sum + Number(qty || 0), 0) + Number(item.deliveryTotal || 0);
            回傳`
              <tr>
                <td class="p-2 border">${item.name} </td>
                <td class="p-2 border text-right">${formatNumber(item.price || 0)}</td>
                ${locations.map((loc) => `<td class="p-2 border text-right">${formatNumber(item.defaultQuantity?.[loc] || 0)}</td>`).join('')}
                <td class="p-2 border text-right">${formatNumber(item.deliveryTotal || 0)}</td>
                <td class="p-2 border text-right">${formatNumber(rowTotal)}</td>
              </tr>`;
          })
          。加入（''）}
      </tbody>
    `；
    建立模態框（{
      title: `${entry.date} ${formatDayLabel(entry.dayKey)} 選單`,
      內容：表格，
      寬：真，
    });
  }

  函數handleHistoryClick（evt）{
    const actionBtn = evt.target.closest('按鈕[資料運算]');
    如果（！actionBtn）返回；
    const { 動作，id } = actionBtn.dataset;
    如果（動作 === '歷史重置'）{
      historyFilters.start = '';
      historyFilters.end = '';
      渲染歷史視圖（）；
    }否則，如果（動作==='歷史視圖'）{
      顯示歷史詳細資料（id）；
    }否則，如果（動作==='history-print'）{
      const entry = state.menuPlanner.history.find((item) => item.id === id);
      如果（條目）列印選單快照（條目）；
    } else if (action === 'history-restore') {
      const entry = state.menuPlanner.history.find((item) => item.id === id);
      如果（！entry）返回；
      const 範本 = 確保選單範本（entry.dayKey）；
      模板.items = cloneMenuData(entry.items || []);
      template.dailySpecial = entry.dailySpecial ? { ...entry.dailySpecial } : { 名稱：'', 價格：0 };
      模板.updatedAt = 新日期().toISOString();
      persistMenuPlanner()；
      activeDay = entry.dayKey;
      視窗.__menuActiveDay = entry.dayKey;
      Swal.fire('已套用', `${entry.date} 菜單已套用至 ${DAY_LABELS[entry.dayKey]}`, 'success');
      switchTab('模板');
    } else if (action === 'history-delete') {
      const index = state.menuPlanner.history.findIndex((item) => item.id === id);
      如果（索引===-1）返回；
      Swal.fire({
        title: '刪除這筆紀錄？',
        圖示：“警告”，
        顯示取消按鈕：true，
        confirmButtonText: '刪除',
        確認按鈕顏色：'#dc2626'，
      }).then((res) => {
        如果（！res.isConfirmed）返回；
        狀態.menuPlanner.history.splice（索引，1）；
        persistMenuPlanner()；
        渲染歷史視圖（）；
      });
    }
  }

  historyView.addEventListener('更改', handleHistoryChange);
  historyView.addEventListener('點選', handleHistoryClick);

  switchTab（activeTab）；
}


函數 showStaffManageModal() {
  如果（！['admin'，'manager'].includes（state.currentUser？.role））返回；
  const content = document.createElement('div');
  content.className = 'space-y-4';
  const 表 = document.createElement('表');
  表.className ='表';
  表格.內部HTML = `
    <標題>
      <tr>
        <th>姓名</th>
        <th>角色</th>
        <th>電子郵件</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody></tbody>`;
  const tbody = 表.querySelector('tbody');
  內容.appendChild（表格）；
  const addBtn = document.createElement('按鈕');
  addBtn.className = 'px-3 py-2 bg-sky-500 文字-白色圓角文字-sm';
  addBtn.textContent = '新增人員';
  內容.appendChild（addBtn）；

  const modal = createModal({ title: '人員管理', content, wide: true });

  函數渲染（）{
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

  tbody.addEventListener('點選', (evt) => {
    const button = evt.target.closest('按鈕[資料操作]');
    如果（！按鈕）返回；
    const { 動作，id } = 按鈕.資料集；
    如果（操作 === '編輯'）{
      開啟員工表格（id）；
    } else if (action === '刪除') {
      刪除員工（id）；
    }
  });

  addBtn.addEventListener('點擊', () => openStaffForm());

  函數 openStaffForm（id = null）{
    const form = document.createElement('form');
    form.className = 'space-y-3';
    表單.innerHTML = `
      <input type="hidden" name="id" />
      <div>
        <label class="text-xs text-gray-500">姓名</label>
        <input type="text" name="name" required class="w-full border rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="text-xs text-gray-500">電子郵件</label>
        <input type="email" name="email" required class="w-full border rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="text-xs text-gray-500">角色</label>
        <select name="role" class="w-full border rounded px-3 py-2 text-sm">
          <option value="staff">工作人員</option>
          <option value="manager">經理</option>
          <option value="admin">管理員</option>
        </選擇>
      </div>
      <div class="flex justify-between items-center">
        <button type="button" data-role="delete" class="px-3 py-2 bg-red-100 text-red-600 rounded hidden">刪除</button>
        <div class="flex gap-2">
          <button type="button" data-role="cancel" class="px-3 py-2 bg-gray-200 rounded">取消</button>
          <button type="submit" class="px-3 py-2 bg-sky-500 text-white rounded">存</button>
        </div>
      </div>`;

    const staff = id ? state.staff.find((item) => item.id === id) : null;
    如果（員工）{
      表單.id.值 = 員工.id;
      表單.名稱.值 = 員工.姓名;
      表單.電子郵件.值=員工.電子郵件；
      表單.角色.值=員工.角色；
      form.querySelector('[data-role="delete"]').classList.remove('隱藏');
    }

    const modal = createModal({ title: staff ? '編輯人員' : '新增人員', content: form });

    形式.addEventListener('提交', (evt) => {
      evt.preventDefault()；
      const formData = Object.fromEntries(new FormData(form).entries());
      如果（！formData.name.trim（））{
        Swal.fire('請輸入姓名', '', 'warning');
        返回;
      }
      如果（員工）{
        Object.assign(員工，{
          名稱：formData.name.trim()，
          電子郵件：formData.email.trim()，
          角色：formData.role，
        });
      } 別的 {
        州.工作人員.推播（{
          id: uuid()，
          名稱：formData.name.trim()，
          電子郵件：formData.email.trim()，
          角色：formData.role，
        });
      }
      關閉模態框（模態框）；
      使成為（）;
      渲染報告（）；
    });

    form.querySelector('[data-role="cancel"]').addEventListener('點擊', () => closeModal(modal));
    form.querySelector('[data-role="delete"]').addEventListener('點擊', () => {
      關閉模態框（模態框）；
      刪除員工（id）；
    });
  }

  函數 deleteStaff（id）{
    如果（狀態.currentUser？.id === id）{
      Swal.fire('無法刪除自己', '', 'warning');
      返回;
    }
    Swal.fire({
      title: '確定刪除人員？',
      圖示：“警告”，
      顯示取消按鈕：true，
      confirmButtonText: '刪除',
      確認按鈕顏色：'#d33'，
    }).then((結果) => {
      如果（！result.isConfirmed）返回；
      const index = state.staff.findIndex((item) => item.id === id);
      如果（索引> = 0）{
        狀態.staff.splice（索引，1）；
        使成為（）;
      }
    });
  }

  使成為（）;
}

函數 openPointsModal() {
  const content = document.createElement('div');
  content.className = 'space-y-3 text-sm';
  內容.內部HTML = `
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

函數 openWishPoolModal() {
  const content = document.createElement('div');
  content.className = 'space-y-4';
  const 列表 = document.createElement('div');
  列表.className ='space-y-3';
  const form = document.createElement('form');
  form.className = 'space-y-3';
  表單.innerHTML = `
    <div>
      <label class="text-xs text-gray-500">希望</label>
      <input type="text" name="title" required class="w-full border rounded px-3 py-2 text-sm" placeholder="寫下你的想法" />
    </div>
    <div class="flex justify-end gap-2">
      <button type="submit" class="px-3 py-2 bg-fuchsia-500 text-white rounded">新增願望</button>
    </div>`;
  內容.appendChild（表格）；
  內容.appendChild（列表）；

  const modal = createModal({ title: '許願池', content, wide: true });

  函數渲染（）{
    如果（！state.wishes.length）{
      list.innerHTML = '<div class="text-xs text-gray-400">還沒有願望，來當第一個吧！</div>';
      返回;
    }
    list.innerHTML = state.wishes
      。地圖（
        （願望）=>`
          <div class="wish-card">
            <div class="flex justify-between items-start">
              <div class="font-semibold">${wish.title} </div>
              <span class="wish-status wish-${wish.status}">${wish.status} </span>
            </div>
            <div class="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <button class="vote-btn" data-action="vote" data-id="${wish.id}">👍 ${wish.votes}</button>
              <button class="vote-btn" data-action="toggle" data-id="${wish.id}">切換狀態</button>
              <button class="vote-btn" data-action="delete" data-id="${wish.id}">刪除</button>
            </div>
          </div>`
      ）
      。加入（''）;
  }

  list.addEventListener('點選', (evt) => {
    const button = evt.target.closest('按鈕[資料操作]');
    如果（！按鈕）返回；
    const { 動作，id } = 按鈕.資料集；
    const wish = state.wishes.find((item) => item.id === id);
    如果（！希望）返回；
    如果（操作 === '投票'）{
      wish.votes += 1;
    } else if (action === '切換') {
      const order = ['待處理', '已批准', '已完成'];
      const index = order.indexOf(wish.status);
      wish.status = 訂單[(索引 + 1) % 訂單.長度];
    } else if (action === '刪除') {
      狀態.願望 = 狀態.願望.過濾器（（item）=> item.id !== id）;
    }
    使成為（）;
  });

  形式.addEventListener('提交', (evt) => {
    evt.preventDefault()；
    const 標題 = 表單.標題.值.trim();
    如果（！標題）{
      Swal.fire('請輸入願望內容', '', 'warning');
      返回;
    }
    state.wishes.push({ id: uuid(), title, status: 'pending', votes: 0 });
    表單.重置（）；
    使成為（）;
  });

  使成為（）;
}

函數 openScheduleModal() {
  const 今天 = 新日期（）；
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
  const days = Array.from({ length: 7 }, (_, idx) => {
    const date = new Date(開始);
    日期.設定日期（開始.取得日期（）+ idx）；
    返回日期；
  });
  const 時間表 = document.createElement('div');
  時間表.className ='時間表日曆';
  days.forEach((day) => {
    const dateStr = formatDate(day.toISOString());
    const cell = document.createElement('div');
    cell.className = '行程日';
    如果（formatDate（day.toISOString（））=== formatDate（today.toISOString（）））{
      cell.classList.add('今天計畫');
    }
    單元格.innerHTML = `
      <header><span>${day.getMonth() + 1}/${day.getDate()}</span><button class="text-xs text-indigo-500" data-date="${dateStr}">新增班表</button></header>
      <div class="schedule-empty">尚未排班</div>`;
    時間表.appendChild（單元格）；
  });

  const modal = createModal({ title: '本週班表', content: schedule, wide: true });

  Schedule.addEventListener('點擊', (evt) => {
    const button = evt.target.closest('按鈕[資料日期]');
    如果（！按鈕）返回；
    const 日期 = 按鈕.資料集.日期;
    openShiftForm(日期，() => {
      關閉模態框（模態框）；
      打開ScheduleModal()；
    });
  });
}

函數 openShiftForm(date, onSave) {
  const form = document.createElement('form');
  form.className = 'space-y-3';
  表單.innerHTML = `
    <div class="text-sm text-gray-600">日期：${date}</div>
    <div>
      <label class="text-xs text-gray-500">班別</label>
      <select name="shift" class="w-full border rounded px-3 py-2 text-sm">
        <option value="MORNING">早班</option>
        <option value="LUNCH">午班</option>
        <option value="FULL">全日</option>
        <option value="REST">休假</option>
      </選擇>
    </div>
    <div>
      <label class="text-xs text-gray-500">人員</label>
      <select name="staff" class="w-full border rounded px-3 py-2 text-sm">
        ${state.staff.map((user) => `<option value="${user.id}">${user.name}</option>`).join('')}
      </選擇>
    </div>
    <div class="flex justify-end gap-2">
      <button type="button" data-role="cancel" class="px-3 py-2 bg-gray-200 rounded">取消</button>
      <button type="submit" class="px-3 py-2 bg-teal-500 text-white rounded">存</button>
    </div>`;

  const modal = createModal({ title: '新增班表', content: form });

  形式.addEventListener('提交', (evt) => {
    evt.preventDefault()；
    Swal.fire('班表已儲存', '', 'success');
    關閉模態框（模態框）；
    保存？ .()；
  });
  form.querySelector('[data-role="cancel"]').addEventListener('點擊', () => closeModal(modal));
}

函數handleLogin（evt）{
  evt.preventDefault()；
  const email = dom.email.value.trim();
  const 密碼 = dom.password.value;
  const user = MOCK_USERS.find((item) => item.email === email && item.password === password);
  如果（！使用者）{
    Swal.fire('登入失敗', '帳號或密碼錯誤', 'error');
    返回;
  }
  狀態.currentUser = {...使用者};
  dom.loginPage.classList.新增（'隱藏'）；
  dom.mainSystem.classList.remove('隱藏');
  登入後渲染（）；
}

函數 renderAfterLogin() {
  設定特徵可見性（）；
  渲染等級資訊（）；
  渲染季度激勵（）；
  渲染使用者摘要（）；
  渲染公告（）；
  填充位置過濾器（）；
  渲染報告（）；
  渲染今日摘要（）；
}

函數 renderTodaySummary() {
  const todaySummary = dom.todaySummary;
  如果（！狀態.位置.長度）{
    TodaySummary.textContent = '--';
    返回;
  }
  todaySummary.innerHTML = 州.位置
    .map((loc) => {
      const report = state.reports.find((item) => item.location === loc.name);
      回傳`<div class="summary-tile">
        <div class="text-sm font-semibold">${loc.name} </div>
        <div class="text-xs text-gray-500">${report ? report.status : '尚無戰報'}</div>
      </div>`;
    })
    。加入（''）;

  dom.quickTodayStats.textContent = `今日戰報 ${state.reports.length} 筆 · 公告 ${state.announcements.length} 則`;
}

函數handleLogout（）{
  狀態.currentUser = null;
  dom.mainSystem.classList.新增（'隱藏'）；
  dom.loginPage.classList.remove('隱藏');
  dom.loginForm.重置();
}

函數 showRegisterHint() {
  Swal.fire('提示', '請聯絡管理員建立帳號。', 'info');
}

函數 showResetPassword() {
  const email = dom.email.value.trim();
  如果（！電子郵件）{
    Swal.fire('請先輸入 Email', '', 'warning');
    返回;
  }
  Swal.fire('已寄出重設信', `${email} 請至信箱確認`, 'success');
}

函數 quickLogin(角色) {
  const user = MOCK_USERS.find((item) => item.role === role) ?? MOCK_USERS.find((item) => item.role === 'staff');
  如果（！用戶）返回；
  dom.email.值=使用者.email;
  dom.密碼.值 = 使用者.密碼;
}

函數 exportReportsCsv() {
  const 資料 = applyReportFilters();
  如果（！數據.長度）{
    Swal.fire('沒有資料可匯出', '', 'info');
    返回;
  }
  const header = ['日期', '據點', '狀態', '負責人', '摘要'];
  const rows = data.map((report) => [report.date, report.location, report.status, getStaffName(report.owner), report.summary]);
  const csv = [header，...rows].map（（row）=> row.map（（cell）=> `“${String（cell）.replace（/“/g，'”“'）}”`）。join（'，'））。join（'\n'）;
  const blob = new Blob([csv], { 類型：'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  連結.href = url;
  link.setAttribute('下載', `reports_${Date.now()}.csv`);
  document.body.appendChild（連結）；
  連結.點擊();
  document.body.removeChild（連結）；
  URL.revokeObjectURL(url);
}

函數匯出報告Excel（）{
  Swal.fire('提示', 'Excel 匯出示範僅產生 CSV，請使用 CSV 檔案。', 'info');
  導出報告Csv()；
}

函數列印報告（）{
  視窗.列印（）；
}

函數 initDomRefs() {
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

函數 initEventBindings() {
  dom.loginForm.addEventListener('提交', handleLogin);
  qs('#btnLogout').addEventListener('點選', handleLogout);
  qs('#btnRegisterHint').addEventListener('點選', showRegisterHint);
  qs('#btnResetPassword').addEventListener('點選', showResetPassword);
  qsa('[data-quick]').forEach((btn​​) => btn.addEventListener('click', () => quickLogin(btn.dataset.quick)));
  qs('#btnPoints').addEventListener('點選', openPointsModal);
  qs('#btnWishPool').addEventListener('點擊', openWishPoolModal);
  qs('#btnSchedule').addEventListener('點選', openScheduleModal);
  dom.btnStaffManage.addEventListener('點擊', showStaffManageModal);
  qs('#btnCreateReport').addEventListener('點擊', () => openReportModal());
  qs('#btnScrollReports').addEventListener('click', () => qs('#reportsSection').scrollIntoView({ behavior: 'smooth' }));
  dom.btnReportManage.addEventListener('點擊', openReportManageModal);
  dom.btnAnnManage.addEventListener('點擊', showAnnouncementManageModal);
  dom.addAnnBtn.addEventListener('點擊', () => openAnnouncementModal());
  dom.btnMenuManage.addEventListener('點擊', showMenuEditModal);
  dom.btnLocationManage.addEventListener('點擊', showLocationManageModal);
  qs('#btnApplyReportFilters').addEventListener('點選', () => renderReports());
  qs('#btnResetReportFilters').addEventListener('點選', resetReportFilters);
  qs('#btnExportReportsCsv').addEventListener('點選', exportReportsCsv);
  qs('#btnExportReportsExcel').addEventListener('點選', exportReportsExcel);
  qs('#btnPrintReports').addEventListener('點選', printReports);
}

函數引導（）{
  初始化DomRefs()；
  初始化事件綁定()；
  渲染公告（）；
}

document.addEventListener('DOMContentLoaded', bootstrap);
