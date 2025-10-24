# dinbedan

本專案提供一個以純前端方式模擬 Firebase 戰報系統的互動介面，支援登入、公告、戰報、菜單、據點、人員與許願池等管理功能。所有資料皆儲存在記憶體中，方便在無後端環境下演示功能流程。

## 功能亮點

- **戰報管理總覽**：提供日期、據點、員工、狀態、關鍵字與金額區間等進階篩選，支援批次刪除與 CSV 匯出，能即時檢視統計資訊。
- **戰報編輯表單**：整合實收、售出、剩餘、折扣、電子支付與未入帳欄位，可勾選徽章並引用菜單快照，方便回顧每日營運重點。
- **菜單規劃器**：以週為單位維護預設菜單，可記錄每日歷史、列印、統計外送與各據點數量，並針對品項提供排序與快速輸入。
- **菜單歷史統計**：依日期篩選歷史紀錄，計算每日、每週與每月的出餐量總合，可列印或套用回指定日期。

更多細節可於登入後的介面中直接體驗。

## 快速開始

1. 於專案根目錄啟動任何靜態伺服器，例如：

   ```bash
   npx http-server .
   ```

2. 造訪輸出的網址（預設為 <http://127.0.0.1:8080>），即可看到登入畫面。

3. 可使用下列示範帳號登入：

   | 角色   | Email                 | 密碼      |
   | ------ | -------------------- | --------- |
   | 管理員 | `admin@example.com`  | `password` |
   | 經理   | `manager@example.com`| `password` |
   | 員工   | `staff@example.com`  | `password` |

登入後即可測試新增、編輯、刪除與篩選等操作。若要回到登入畫面，可使用右上角的「登出」按鈕。

## 菜單規劃與歷史

1. 進入「菜單管理」，選擇欲調整的星期，輸入各據點數量與外送份數；資料會即時儲存於瀏覽器。
2. 點擊「記錄今日菜單」可保存快照至歷史，並於「歷史紀錄 / 統計」分頁檢視。
3. 歷史分頁可依日期篩選並檢視每日、每週、每月合計，亦可列印、套用或刪除指定紀錄。

## 戰報管理技巧

1. 於主畫面點選「戰報管理」開啟總覽，即可依多種條件載入戰報列表。
2. 列表支援批次勾選刪除與 CSV 匯出，表格上方會即時統計總實收、平均實收、總售出與剩餘量。
3. 點擊「查看」可檢視完整戰報與菜單快照，「編輯」則會載入原表單供更新。

## GitHub Pages Deployment

This repository ships with a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds the static assets and publishes them to GitHub Pages.  The workflow:

- Uploads the site files from the `dist/` directory as a Pages artifact.
- Uses the latest `actions/deploy-pages@v4` action to publish the artifact.
- Skips the deploy step if the workflow run has already been cancelled so that cancelled runs do not fail while attempting to cancel a finished deployment.

If you trigger multiple builds quickly, only the newest run will continue and older runs will exit cleanly without raising the `Cancelling pages deployment failed` error.
