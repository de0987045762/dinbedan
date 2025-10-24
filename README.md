rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() {
      return request.auth != null;
    }

    function userDoc() {
      return signedIn()
        ? get(/databases/$(database)/documents/users/$(request.auth.uid))
        : null;
    }

    function userRole(doc) {
      return doc != null && doc.data.role != null ? doc.data.role : "staff";
    }

    function role() {
      return signedIn() ? userRole(userDoc()) : "guest";
    }

    function isAdmin() {
      return role() == "admin";
    }

    function isManager() {
      return role() in ["admin", "manager", "owner"];
    }

    function isStaff() {
      return role() in ["admin", "manager", "owner", "staff"];
    }

    function isSelf(uid) {
      return signedIn() && request.auth.uid == uid;
    }

    function roleChanged() {
      return resource != null
        && "role" in request.resource.data.keys()
        && request.resource.data.role != resource.data.role;
    }

    match /users/{uid} {
      allow read: if signedIn();
      allow create: if isAdmin()
                    || (isSelf(uid) && !("role" in request.resource.data.keys()));
      allow update: if isAdmin()
                    || (isManager() && !roleChanged())
                    || (isSelf(uid) && !roleChanged());
      allow delete: if isAdmin();
    }

    match /announcements/{id} {
      allow read: if signedIn();
      allow create, update, delete: if isManager();
    }

    match /reports/{id} {
      allow read: if signedIn();
      allow create: if signedIn() && request.resource.data.ownerId == request.auth.uid;
      allow update, delete: if isAdmin()
                            || (signedIn() && resource.data.ownerId == request.auth.uid)
                            || (isManager() && resource.data.ownerId == request.auth.uid);
    }

    match /shifts/{id} {
      allow read: if signedIn();
      allow create, update, delete: if isManager();
    }

    match /locations/{id} {
      allow read: if signedIn();
      allow create, update, delete: if isManager();
    }

    match /menu/{id} {
      allow read: if signedIn();
      allow create, update, delete: if isManager();
    }

    match /menuRealtime/{id} {
      allow read: if signedIn();
      allow create, update, delete: if isManager();
    }

    match /menuDaily/{id} {
      allow read: if signedIn();
      allow create, update: if isManager();
      allow delete: if isAdmin();
    }

    match /bvRecords/{id} {
      allow read: if signedIn();
      allow create: if signedIn() && request.resource.data.creatorUid == request.auth.uid;
      allow update, delete: if isManager()
                            || (signedIn() && resource.data.creatorUid == request.auth.uid);
    }

    match /points/{id} {
      allow read: if signedIn();
      allow create: if isManager()
                     || (signedIn() && request.resource.data.userId == request.auth.uid);
      allow update, delete: if isManager()
                            || (signedIn() && resource.data.userId == request.auth.uid);
    }

    match /incentives/{id} {
      allow read: if signedIn();
      allow create, update, delete: if isManager();
    }

    match /wishes/{id} {
      allow read: if signedIn();
      allow create: if signedIn();
      allow update, delete: if isManager()
                            || (signedIn() && resource.data.creatorUid == request.auth.uid);
    }

    match /settings/{id} {
      allow read: if signedIn();
      allow create, update, delete: if isManager();
    }

    match /supplies/{id} {
      allow read: if signedIn();
      allow create, update, delete: if isManager();
    }

    match /pettyCash/{id} {
      allow read: if signedIn();
      allow create, update, delete: if isManager();
    }

    match /userDaily/{uid} {
      allow read: if signedIn() && (request.auth.uid == uid || isManager());
      match /days/{date} {
        allow read: if signedIn() && (request.auth.uid == uid || isManager());
        allow create, update, delete: if (signedIn() && request.auth.uid == uid) || isManager();
      }
    }

    match /suppliesList/{id} {
      allow read: if isAdmin();
    }

    match /petty_cash/{id} {
      allow read: if isAdmin();
    }

    match /inventory/{id} {
      allow read: if isAdmin();
    }

    match /menuDefault/{id} {
      allow read: if isAdmin();
    }
  }
}
index.html
新增
+254
-0

<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>戰報系統融合版 v5 (本地模擬)</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <link rel="stylesheet" href="styles.css" />
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
  <div id="loginPage" class="min-h-screen flex items-center justify-center">
    <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">📊 戰報系統</h1>
        <p class="text-gray-600 mt-2">請登入</p>
      </div>
      <form id="loginForm" class="space-y-5">
        <div>
          <label class="block text-sm mb-1">電子郵件</label>
          <input id="email" type="email" required class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="email@example.com" />
        </div>
        <div>
          <label class="block text-sm mb-1">密碼</label>
          <input id="password" type="password" required class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="******" />
        </div>
        <div class="flex justify-between text-xs text-gray-600">
          <label class="flex gap-2 items-center">
            <input type="checkbox" id="rememberMe" /> 記住我
          </label>
          <button type="button" id="btnResetPassword" class="text-blue-600 hover:underline">忘記密碼？</button>
        </div>
        <button class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow font-medium transition" type="submit">登入</button>
      </form>
      <div class="text-center text-sm text-gray-600">
        沒有帳號？
        <button id="btnRegisterHint" class="text-blue-600 hover:underline">註冊（管理員建立）</button>
      </div>
      <div class="border-t pt-4">
        <p class="text-xs text-gray-500 text-center mb-2">快速示範</p>
        <div class="flex gap-2">
          <button data-quick="admin" class="flex-1 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">管理員</button>
          <button data-quick="manager" class="flex-1 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200">經理</button>
          <button data-quick="staff" class="flex-1 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">員工</button>
        </div>
      </div>
    </div>
  </div>

  <div id="mainSystem" class="hidden">
    <div class="container mx-auto px-4 py-6">
      <header class="flex flex-wrap gap-4 justify-between items-center mb-6 bg-white rounded-lg shadow p-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🍽️ 帝壹飲食-有間客讚
            <span class="text-sm px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200">戰報系統</span>
          </h1>
          <p class="text-gray-500 text-xs">管理平台</p>
        </div>
        <div class="flex items-center gap-4 flex-wrap">
          <div id="levelDisplay"></div>
          <div class="flex flex-col text-right text-xs leading-tight">
            <span>歡迎：<span id="currentUserName" class="font-semibold"></span></span>
            <span id="currentUserRoleBadge" class="px-2 py-0.5 mt-1 bg-slate-100 rounded border text-[11px]"></span>
            <span id="quarterIncentiveBadge" class="mt-1"></span>
          </div>
          <button id="btnPoints" class="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-md text-sm shadow">🎁 點數 / 商城</button>
          <button id="btnWishPool" class="bg-fuchsia-500 hover:bg-fuchsia-600 text-white px-3 py-2 rounded-md text-sm shadow">💡 許願池</button>
          <button id="btnSchedule" class="bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded-md text-sm shadow">📆 班表</button>
          <button id="btnLogout" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm">登出</button>
        </div>
      </header>

      <div class="grid grid-cols-2 sm:grid-cols-7 gap-4 mb-6">
        <button id="btnStaffManage" class="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-lg shadow transition hidden text-sm">👥 人員管理</button>
        <button id="btnCreateReport" class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg shadow transition text-sm">📝 新增戰報</button>
        <button id="btnScrollReports" class="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-lg shadow transition text-sm">📦 戰報列表</button>
        <button id="btnReportManage" class="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-lg shadow transition text-sm hidden">🛠 戰報管理</button>
        <button id="btnMenuManage" class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg shadow transition text-sm">🍽️ 菜單管理</button>
        <button id="btnLocationManage" class="bg-violet-500 hover:bg-violet-600 text-white font-bold py-3 rounded-lg shadow transition text-sm">📍 據點管理</button>
        <button id="btnAnnManage" class="bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-lg shadow transition text-sm hidden">📢 公告管理</button>
      </div>

      <div class="grid lg:grid-cols-3 gap-6 mb-8">
        <div class="bg-white p-5 rounded-lg shadow lg:col-span-2">
          <div class="flex justify-between items-center mb-2">
            <h2 class="font-bold text-lg">公告</h2>
            <button id="addAnnBtn" class="hidden text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200">+ 新增公告</button>
          </div>
          <div id="announcementsArea" class="space-y-3 text-sm text-gray-700">
            <div class="text-gray-400 text-xs">尚無公告</div>
          </div>
        </div>
        <div class="bg-white p-5 rounded-lg shadow flex flex-col gap-5">
          <div>
            <h3 class="font-semibold mb-2">季度激勵</h3>
            <div id="quarterIncentivePanel" class="text-sm text-gray-600">--</div>
          </div>
          <div>
            <h3 class="font-semibold mb-2">今日各據點統計</h3>
            <div id="todaySummary" class="space-y-2 text-xs text-gray-600">--</div>
          </div>
          <div>
            <h3 class="font-semibold mb-2">快速統計 (今日)</h3>
            <div id="quickTodayStats" class="text-[11px] text-gray-500">--</div>
          </div>
        </div>
      </div>

      <section id="reportsSection" class="scroll-mt-10">
        <div class="bg-white shadow rounded-lg p-4 mb-4">
          <div class="flex flex-wrap gap-3 items-end">
            <div class="flex flex-col">
              <label class="text-[11px] text-gray-500">開始日期</label>
              <input type="date" id="filterStart" class="border rounded px-2 py-1 text-sm" />
            </div>
            <div class="flex flex-col">
              <label class="text-[11px] text-gray-500">結束日期</label>
              <input type="date" id="filterEnd" class="border rounded px-2 py-1 text-sm" />
            </div>
            <div class="flex flex-col">
              <label class="text-[11px] text-gray-500">據點</label>
              <select id="filterLocation" class="border rounded px-2 py-1 text-sm">
                <option value="">全部</option>
              </select>
            </div>
            <div class="flex flex-col">
              <label class="text-[11px] text-gray-500">狀態</label>
              <select id="filterStatus" class="border rounded px-2 py-1 text-sm">
                <option value="">全部</option>
                <option value="正常營業">正常營業</option>
                <option value="提早結束">提早結束</option>
                <option value="延後開始">延後開始</option>
                <option value="暫停營業">暫停營業</option>
              </select>
            </div>
            <button id="btnApplyReportFilters" class="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded text-sm">套用</button>
            <button id="btnResetReportFilters" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm">重置</button>
            <div class="flex-1"></div>
            <button id="btnExportReportsCsv" class="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded text-sm">↓ CSV</button>
            <button id="btnExportReportsExcel" class="px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded text-sm">↓ Excel</button>
            <button id="btnPrintReports" class="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-sm">🖨️ 列印</button>
          </div>
          <div class="mt-3 flex flex-wrap gap-4 text-xs text-gray-500" id="reportAggregates"></div>
        </div>
        <div id="reportsContainer" class="kanban-grid"></div>
        <div id="reportsEmpty" class="text-center text-gray-400 text-sm py-10 hidden">尚無符合條件的戰報</div>
        <div class="flex justify-center mt-6" id="loadMoreWrap">
          <button id="btnLoadMoreReports" class="px-4 py-2 text-sm bg-white border rounded shadow hover:bg-slate-50 hidden">載入更多</button>
        </div>
      </section>
    </div>
  </div>

  <div id="modalBackdrops"></div>

  <template id="announcementFormTemplate">
    <form class="space-y-3">
      <input type="hidden" name="id" />
      <div>
        <label class="text-xs text-gray-500">類型</label>
        <select name="type" class="w-full border rounded px-3 py-2 text-sm">
          <option value="important">重要</option>
          <option value="adjustment">調整</option>
          <option value="sharing">趣事</option>
        </select>
      </div>
      <div>
        <label class="text-xs text-gray-500">標題</label>
        <input type="text" name="title" required class="w-full border rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="text-xs text-gray-500">內容</label>
        <textarea name="content" rows="4" class="w-full border rounded px-3 py-2 text-sm" required></textarea>
      </div>
      <div>
        <label class="text-xs text-gray-500">圖片 URL (可選)</label>
        <input type="url" name="imageUrl" class="w-full border rounded px-3 py-2 text-sm" placeholder="https://" />
      </div>
      <div class="flex justify-end gap-2 text-sm">
        <button type="button" data-role="cancel" class="px-3 py-2 bg-gray-200 rounded">取消</button>
        <button type="submit" class="px-3 py-2 bg-indigo-600 text-white rounded">儲存</button>
      </div>
    </form>
  </template>

  <template id="reportFormTemplate">
    <form class="space-y-3">
      <input type="hidden" name="id" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-gray-500">日期</label>
          <input type="date" name="date" required class="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="text-xs text-gray-500">據點</label>
          <select name="location" class="w-full border rounded px-3 py-2 text-sm" required></select>
        </div>
        <div>
          <label class="text-xs text-gray-500">狀態</label>
          <select name="status" class="w-full border rounded px-3 py-2 text-sm" required>
            <option value="正常營業">正常營業</option>
            <option value="提早結束">提早結束</option>
            <option value="延後開始">延後開始</option>
            <option value="暫停營業">暫停營業</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-500">負責人</label>
          <select name="owner" class="w-full border rounded px-3 py-2 text-sm" required></select>
        </div>
      </div>
      <div>
        <label class="text-xs text-gray-500">摘要</label>
        <textarea name="summary" rows="3" class="w-full border rounded px-3 py-2 text-sm" required></textarea>
      </div>
      <div class="flex justify-end gap-2 text-sm">
        <button type="button" data-role="cancel" class="px-3 py-2 bg-gray-200 rounded">取消</button>
        <button type="submit" class="px-3 py-2 bg-emerald-600 text-white rounded">儲存</button>
      </div>
    </form>
  </template>

  <template id="simpleListTemplate">
    <form class="space-y-3">
      <input type="hidden" name="id" />
      <div>
        <label class="text-xs text-gray-500">名稱</label>
        <input type="text" name="name" required class="w-full border rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="text-xs text-gray-500">描述</label>
        <textarea name="description" rows="3" class="w-full border rounded px-3 py-2 text-sm"></textarea>
      </div>
      <div class="flex justify-between items-center text-sm">
        <button type="button" data-role="delete" class="px-3 py-2 bg-red-100 text-red-600 rounded hidden">刪除</button>
        <div class="flex gap-2">
          <button type="button" data-role="cancel" class="px-3 py-2 bg-gray-200 rounded">取消</button>
          <button type="submit" class="px-3 py-2 bg-blue-600 text-white rounded">儲存</button>
        </div>
      </div>
    </form>
  </template>

  <template id="modalShellTemplate">
    <div class="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center px-4">
      <div class="bg-white rounded-lg shadow-lg max-h-[90vh] overflow-y-auto w-full max-w-3xl p-6 space-y-4"></div>
    </div>
  </template>

  <script src="app.js"></script>
</body>
</html>
