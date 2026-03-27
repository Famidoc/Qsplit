💰 極速分帳 Qsplit (Quick Split)
Qsplit 是一款專為出國旅遊、聚餐拆帳設計的極速雲端分帳神器。它具備免下載、即時同步、支援多國匯率及自動債務簡化功能，並能一鍵產出報表分享至 LINE 等社群軟體。

✨ 核心功能
即時雲端同步：基於 Firebase Firestore，所有成員的操作皆能即時同步至雲端，確保帳目不打架。

債務簡化演算法：自動計算最少轉帳次數，將複雜的多人交叉債務簡化為最清晰的付款建議。

多幣別換算：內建匯率轉換功能，支援輸入外幣並自動按匯率換算為本幣（如台幣）。

離線使用與 PWA：支援 Progressive Web App (PWA) 技術，可安裝至手機桌面，並在弱網或離線環境下使用緩存啟動。

個性化體驗：支援深色/淺色模式切換，並提供多款主題調色盤（如夕陽、海風、糖果）供使用者自訂介面。

快速加入：內建 QR Code 生成功能，朋友只需掃碼即可快速進入專屬帳本房間。

一鍵結算報表：自動格式化結算資訊，一鍵複製後即可直接貼上到 LINE 進行請款。

🛠️ 技術棧
前端框架：原生 HTML5 / CSS3 / JavaScript (ES6+)。

樣式處理：Tailwind CSS (使用 CDN 及自訂設定檔)。

後端服務：Firebase App & Firestore (用於資料儲存與即時通訊)。

離線支援：Service Worker (Network First 策略)。

工具庫：QRious (用於生成 QR Code)。

🚀 快速開始
使用者
直接造訪專案網址（例如：https://famidoc.github.io/Qsplit/）。

設定群組成員。

開始記錄帳單，並分享網址或 QR Code 給朋友。

開發者 (自行佈署)
若要自行開發或佈署，請調整 app.js 中的 Firebase 配置資訊：

JavaScript
// app.js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
📁 檔案結構
index.html: 應用程式的主要介面與 Tailwind CSS 配置。

app.js: 核心邏輯，包含分帳演算、Firebase 互動與 UI 更新。

sw.js: Service Worker 設定，處理檔案快取與離線存取。

manifest.json: PWA 設定檔，定義應用程式圖示與啟動行為。

📝 授權與作者
作者：Famidoc Chang & Gemini 3.1 Pro。

日期：2026 年。
