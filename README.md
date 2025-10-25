# Firebase 戰報管理示範

這個專案提供最簡化的 Firebase 前端示範，登入後可以直接在 Firestore 讀取與寫入公告、據點與戰報資料。主要目標是讓指定的超級管理員帳號 `k987045762@gmail.com` 具有完整權限，其他帳號一律視為員工，僅能新增戰報與瀏覽資料。

## 立即試用

1. 於專案目錄啟動任何靜態伺服器，例如：

   ```bash
   npx http-server .
   ```

2. 開啟瀏覽器造訪顯示的網址 (預設為 <http://127.0.0.1:8080>)。
3. 使用 Firebase Console 建立 Email/Password 帳號，並啟用 Email/Password 登入方式。若未啟用，登入時會看到 `auth/configuration-not-found` 錯誤。
4. 使用實際的 Firebase 帳號登入。當登入的 Email 為 `k987045762@gmail.com` 時，系統會自動在 `users/{uid}` 文件寫入 `role: "admin"`，並顯示所有新增/刪除按鈕。其他帳號一律為 `role: "staff"`。

## 功能說明

- **公告管理 (管理員專用)**：新增公告、即時監聽 Firestore 並顯示最新內容，支援刪除。
- **據點管理 (管理員專用)**：建立營運據點並同步更新給戰報表單使用。
- **戰報**：所有登入者皆可新增戰報。管理員可以刪除任何戰報，員工僅能刪除自己提交的紀錄。
- **即時監聽**：畫面上的公告、據點與戰報列表皆透過 `onSnapshot` 監聽 Firestore，即時反映資料變更。

## Firestore 規則

範例規則檔位於 `firestore.rules`，重點包含：

- 以 Email 判斷超級管理員 (`k987045762@gmail.com`) 並賦予 `isAdmin()` 權限。
- 允許超級管理員建立/更新任何使用者檔案與資料集合。
- 員工可以讀取所有資料、建立自己的戰報並刪除本人資料。

部署至 Firebase 前，可先在 Firebase Console 的 Rules Simulator 測試不同 Email 與角色的讀寫情境。

## 檔案結構

- `index.html`：登入畫面與資料管理 UI。
- `styles.css`：簡易佈景與按鈕樣式。
- `app.js`：Firebase 初始化、登入流程、Firestore 讀寫與監聽邏輯。
- `firestore.rules`：對應的 Firestore 安全性規則。

若需擴充功能 (例如菜單或更多欄位)，可以在 `app.js` 中新增表單欄位並依需求調整 Firestore 規則即可。
