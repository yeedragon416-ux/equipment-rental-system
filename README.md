# 多媒體動畫科器材借閱系統

這是一個專為多媒體動畫科設計的器材借閱管理系統前端頁面，提供學生便捷的器材借閱和歸還功能。

## 功能特色

- 📱 **響應式設計** - 支援桌面、平板和手機裝置
- 🔍 **智慧搜尋** - 可依器材名稱或描述進行搜尋
- 🏷️ **分類篩選** - 依器材類別（相機、電繪板、錄音器材、平板）篩選
- 📊 **即時庫存** - 顯示器材可借閱數量和狀態
- 📝 **借閱申請** - 完整的借閱表單，包含學號、姓名、日期等資訊
- 🔄 **歸還功能** - 學生可查詢借閱記錄並進行歸還
- 🎨 **現代化 UI** - 使用 Tailwind CSS 和 shadcn/ui 組件

## 技術架構

- **前端框架**: React 18
- **建置工具**: Vite
- **樣式框架**: Tailwind CSS
- **UI 組件**: shadcn/ui
- **圖示**: Lucide React
- **部署平台**: GitHub Pages

## 本地開發

### 環境需求

- Node.js 18+ 
- npm 或 pnpm

### 安裝與執行

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 建置生產版本
npm run build

# 預覽建置結果
npm run preview
```

## GitHub Pages 部署指南

### 方法一：使用 GitHub Actions（推薦）

1. **上傳專案到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用戶名/equipment-rental-system.git
   git push -u origin main
   ```

2. **設定 GitHub Actions**
   - 在專案根目錄建立 `.github/workflows/deploy.yml` 檔案
   - 內容已包含在此專案中

3. **啟用 GitHub Pages**
   - 進入 GitHub 專案設定頁面
   - 找到 "Pages" 設定
   - Source 選擇 "GitHub Actions"
   - 推送程式碼後會自動部署

### 方法二：手動部署

1. **建置專案**
   ```bash
   npm run build
   ```

2. **上傳 dist 資料夾內容**
   - 將 `dist/` 資料夾內的所有檔案上傳到 `gh-pages` 分支
   - 或使用 `gh-pages` 套件自動部署

## 後端整合

此前端頁面設計為靜態網站，需要搭配後端 API 來實現完整功能：

### 建議的 API 端點

```javascript
// 獲取器材列表
GET /api/equipment

// 提交借閱申請
POST /api/borrow

// 查詢借閱記錄
GET /api/borrow-history/:studentId

// 歸還器材
POST /api/return
```

### Google Sheets 整合

由於後端使用 Google Sheets，建議：

1. 使用 Google Apps Script 建立 Web App
2. 提供 RESTful API 介面
3. 處理 CORS 跨域請求
4. 實作資料驗證和錯誤處理

詳細的後端整合文件請參考 `backend-integration.md`。

## 專案結構

```
equipment-rental-system/
├── public/                 # 靜態資源
├── src/
│   ├── assets/            # 圖片資源
│   ├── components/        # React 組件
│   │   └── ui/           # UI 組件庫
│   ├── App.jsx           # 主要應用程式
│   ├── App.css           # 樣式檔案
│   └── main.jsx          # 入口檔案
├── dist/                  # 建置輸出（部署用）
├── .github/workflows/     # GitHub Actions
└── README.md             # 說明文件
```

## 自訂設定

### 修改器材資料

在 `src/App.jsx` 中的 `mockEquipment` 陣列可以修改器材資訊：

```javascript
const mockEquipment = [
  {
    id: 'EQ001',
    name: '器材名稱',
    category: '器材類別',
    image: '/src/assets/image.jpg',
    description: '器材描述',
    totalQuantity: 5,
    availableQuantity: 3,
    status: '可借閱'
  }
  // ... 更多器材
]
```

### 修改樣式主題

在 `src/App.css` 中可以調整顏色主題和樣式變數。

## 授權

此專案採用 MIT 授權條款。

## 支援

如有問題或建議，請建立 GitHub Issue 或聯繫開發團隊。

