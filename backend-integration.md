# 後端整合指南

## 概述

本文件詳細說明如何將多媒體動畫科器材借閱系統前端與 Google Sheets 後端進行整合，實現完整的器材管理功能。

## 目錄

1. [系統架構](#系統架構)
2. [Google Apps Script 設定](#google-apps-script-設定)
3. [API 端點設計](#api-端點設計)
4. [資料格式規範](#資料格式規範)
5. [前端整合方式](#前端整合方式)
6. [錯誤處理](#錯誤處理)
7. [安全性考量](#安全性考量)
8. [部署與維護](#部署與維護)

## 系統架構

### 整體架構圖

```
前端 (GitHub Pages)
    ↓ HTTPS API 請求
Google Apps Script (Web App)
    ↓ 讀寫操作
Google Sheets (資料庫)
```

### 資料流程

1. **器材列表查詢**: 前端 → Apps Script → Google Sheets → 回傳器材資料
2. **借閱申請**: 前端提交表單 → Apps Script 驗證 → 寫入 Google Sheets
3. **歸還處理**: 前端查詢 → Apps Script 更新狀態 → Google Sheets 記錄更新




## Google Apps Script 設定

### 建立 Google Apps Script 專案

1. **開啟 Google Apps Script**
   - 前往 [script.google.com](https://script.google.com)
   - 點擊「新增專案」
   - 將專案命名為「器材借閱系統 API」

2. **連結 Google Sheets**
   - 在 Apps Script 編輯器中，點擊「資源」→「程式庫」
   - 或直接在程式碼中使用 `SpreadsheetApp.openById()` 連接現有的 Google Sheets

### 基本程式碼結構

```javascript
// 設定 Google Sheets ID
const SPREADSHEET_ID = '你的Google Sheets ID';
const EQUIPMENT_SHEET = '器材清單';
const BORROW_SHEET = '借閱記錄';

// 主要處理函數
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  // 設定 CORS 標頭
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    const action = e.parameter.action || e.postData?.contents ? JSON.parse(e.postData.contents).action : null;
    
    switch(action) {
      case 'getEquipment':
        return getEquipmentList();
      case 'borrowEquipment':
        return borrowEquipment(e);
      case 'returnEquipment':
        return returnEquipment(e);
      case 'getBorrowHistory':
        return getBorrowHistory(e);
      default:
        return createResponse(false, '無效的操作');
    }
  } catch (error) {
    return createResponse(false, '伺服器錯誤: ' + error.message);
  }
}

// 建立統一回應格式
function createResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message,
    data: data,
    timestamp: new Date().toISOString()
  };
  
  const output = ContentService.createTextOutput(JSON.stringify(response));
  output.setMimeType(ContentService.MimeType.JSON);
  
  // 設定 CORS 標頭
  output.setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  
  return output;
}
```

### 器材列表查詢功能

```javascript
function getEquipmentList() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(EQUIPMENT_SHEET);
    
    if (!sheet) {
      return createResponse(false, '找不到器材清單工作表');
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const equipmentList = [];
    
    // 跳過標題列，從第二列開始處理
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const equipment = {
        id: row[0] || `EQ${String(i).padStart(3, '0')}`,
        name: row[1] || '',
        category: row[2] || '',
        description: row[3] || '',
        totalQuantity: parseInt(row[4]) || 0,
        availableQuantity: parseInt(row[5]) || 0,
        status: row[6] || '可借閱',
        imageUrl: row[7] || ''
      };
      
      // 只回傳有效的器材記錄
      if (equipment.name) {
        equipmentList.push(equipment);
      }
    }
    
    return createResponse(true, '成功獲取器材列表', equipmentList);
  } catch (error) {
    return createResponse(false, '獲取器材列表失敗: ' + error.message);
  }
}
```

### 借閱申請處理功能

```javascript
function borrowEquipment(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const { studentId, studentName, equipmentId, borrowDate, returnDate, purpose } = requestData;
    
    // 驗證必填欄位
    if (!studentId || !studentName || !equipmentId || !borrowDate || !returnDate) {
      return createResponse(false, '請填寫所有必填欄位');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 檢查器材是否可借閱
    const equipmentSheet = ss.getSheetByName(EQUIPMENT_SHEET);
    const equipmentData = equipmentSheet.getDataRange().getValues();
    
    let equipmentRow = -1;
    let availableQuantity = 0;
    
    for (let i = 1; i < equipmentData.length; i++) {
      if (equipmentData[i][0] === equipmentId) {
        equipmentRow = i + 1; // Google Sheets 行號從 1 開始
        availableQuantity = parseInt(equipmentData[i][5]) || 0;
        break;
      }
    }
    
    if (equipmentRow === -1) {
      return createResponse(false, '找不到指定的器材');
    }
    
    if (availableQuantity <= 0) {
      return createResponse(false, '該器材目前無庫存');
    }
    
    // 新增借閱記錄
    const borrowSheet = ss.getSheetByName(BORROW_SHEET);
    const newRow = [
      studentId,
      studentName,
      equipmentId,
      equipmentData[equipmentRow - 1][1], // 器材名稱
      borrowDate,
      returnDate,
      purpose || '',
      '借閱中',
      new Date().toISOString()
    ];
    
    borrowSheet.appendRow(newRow);
    
    // 更新器材可借閱數量
    equipmentSheet.getRange(equipmentRow, 6).setValue(availableQuantity - 1);
    
    // 更新器材狀態
    const newAvailableQuantity = availableQuantity - 1;
    const newStatus = newAvailableQuantity > 0 ? '可借閱' : '已借完';
    equipmentSheet.getRange(equipmentRow, 7).setValue(newStatus);
    
    return createResponse(true, '借閱申請成功', {
      borrowId: `BR${Date.now()}`,
      studentId: studentId,
      equipmentId: equipmentId,
      borrowDate: borrowDate,
      returnDate: returnDate
    });
    
  } catch (error) {
    return createResponse(false, '借閱申請失敗: ' + error.message);
  }
}
```

### 歸還處理功能

```javascript
function returnEquipment(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const { studentId, equipmentId } = requestData;
    
    if (!studentId || !equipmentId) {
      return createResponse(false, '請提供學號和器材ID');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const borrowSheet = ss.getSheetByName(BORROW_SHEET);
    const borrowData = borrowSheet.getDataRange().getValues();
    
    let borrowRow = -1;
    
    // 尋找對應的借閱記錄
    for (let i = 1; i < borrowData.length; i++) {
      if (borrowData[i][0] === studentId && 
          borrowData[i][2] === equipmentId && 
          borrowData[i][7] === '借閱中') {
        borrowRow = i + 1;
        break;
      }
    }
    
    if (borrowRow === -1) {
      return createResponse(false, '找不到對應的借閱記錄');
    }
    
    // 更新借閱記錄狀態
    borrowSheet.getRange(borrowRow, 8).setValue('已歸還');
    borrowSheet.getRange(borrowRow, 9).setValue(new Date().toISOString());
    
    // 更新器材可借閱數量
    const equipmentSheet = ss.getSheetByName(EQUIPMENT_SHEET);
    const equipmentData = equipmentSheet.getDataRange().getValues();
    
    for (let i = 1; i < equipmentData.length; i++) {
      if (equipmentData[i][0] === equipmentId) {
        const currentAvailable = parseInt(equipmentData[i][5]) || 0;
        const newAvailable = currentAvailable + 1;
        
        equipmentSheet.getRange(i + 1, 6).setValue(newAvailable);
        equipmentSheet.getRange(i + 1, 7).setValue('可借閱');
        break;
      }
    }
    
    return createResponse(true, '歸還成功');
    
  } catch (error) {
    return createResponse(false, '歸還失敗: ' + error.message);
  }
}
```

### 借閱歷史查詢功能

```javascript
function getBorrowHistory(e) {
  try {
    const studentId = e.parameter.studentId;
    
    if (!studentId) {
      return createResponse(false, '請提供學號');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const borrowSheet = ss.getSheetByName(BORROW_SHEET);
    const borrowData = borrowSheet.getDataRange().getValues();
    
    const history = [];
    
    // 跳過標題列，查詢該學生的借閱記錄
    for (let i = 1; i < borrowData.length; i++) {
      const row = borrowData[i];
      if (row[0] === studentId) {
        history.push({
          studentId: row[0],
          studentName: row[1],
          equipmentId: row[2],
          equipmentName: row[3],
          borrowDate: row[4],
          returnDate: row[5],
          purpose: row[6],
          status: row[7],
          actualReturnDate: row[8] || null
        });
      }
    }
    
    return createResponse(true, '成功獲取借閱歷史', history);
    
  } catch (error) {
    return createResponse(false, '查詢借閱歷史失敗: ' + error.message);
  }
}
```

### 部署 Web App

1. **儲存並部署**
   - 點擊「儲存」按鈕
   - 點擊「部署」→「新增部署」
   - 選擇類型：「網頁應用程式」
   - 說明：填寫版本說明
   - 執行身分：選擇「我」
   - 存取權限：選擇「任何人」

2. **取得 Web App URL**
   - 部署完成後會獲得一個 URL
   - 格式類似：`https://script.google.com/macros/s/你的腳本ID/exec`
   - 將此 URL 用於前端 API 呼叫


## API 端點設計

### 基本 URL 格式

所有 API 請求都使用 Google Apps Script Web App URL：
```
https://script.google.com/macros/s/你的腳本ID/exec
```

### 端點列表

| 功能 | 方法 | 參數 | 說明 |
|------|------|------|------|
| 獲取器材列表 | GET | `action=getEquipment` | 取得所有器材資訊 |
| 提交借閱申請 | POST | JSON 格式請求體 | 新增借閱記錄 |
| 歸還器材 | POST | JSON 格式請求體 | 更新借閱狀態 |
| 查詢借閱歷史 | GET | `action=getBorrowHistory&studentId=學號` | 取得學生借閱記錄 |

### 請求範例

#### 1. 獲取器材列表

```javascript
// GET 請求
const response = await fetch('https://script.google.com/macros/s/你的腳本ID/exec?action=getEquipment');
const data = await response.json();
```

#### 2. 提交借閱申請

```javascript
// POST 請求
const borrowData = {
  action: 'borrowEquipment',
  studentId: '411596453',
  studentName: '白佳蓉',
  equipmentId: 'EQ002',
  borrowDate: '2024-09-10T14:00',
  returnDate: '2024-09-10T17:00',
  purpose: '數位繪畫課程作業使用'
};

const response = await fetch('https://script.google.com/macros/s/你的腳本ID/exec', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(borrowData)
});
```

#### 3. 歸還器材

```javascript
// POST 請求
const returnData = {
  action: 'returnEquipment',
  studentId: '411596453',
  equipmentId: 'EQ002'
};

const response = await fetch('https://script.google.com/macros/s/你的腳本ID/exec', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(returnData)
});
```

#### 4. 查詢借閱歷史

```javascript
// GET 請求
const studentId = '411596453';
const response = await fetch(`https://script.google.com/macros/s/你的腳本ID/exec?action=getBorrowHistory&studentId=${studentId}`);
const data = await response.json();
```

## 資料格式規範

### 統一回應格式

所有 API 回應都使用以下統一格式：

```json
{
  "success": true,
  "message": "操作成功",
  "data": { /* 實際資料 */ },
  "timestamp": "2024-09-10T03:37:00.000Z"
}
```

### 器材資料格式

```json
{
  "id": "EQ001",
  "name": "單眼相機 Canon EOS 80D",
  "category": "相機",
  "description": "高性能單眼相機，適合攝影課程使用，配備24.2MP APS-C CMOS感光元件。",
  "totalQuantity": 5,
  "availableQuantity": 3,
  "status": "可借閱",
  "imageUrl": "https://example.com/camera.jpg"
}
```

### 借閱記錄格式

```json
{
  "studentId": "411596453",
  "studentName": "白佳蓉",
  "equipmentId": "EQ002",
  "equipmentName": "繪圖板 Wacom Intuos Pro",
  "borrowDate": "2024-09-10T14:00",
  "returnDate": "2024-09-10T17:00",
  "purpose": "數位繪畫課程作業使用",
  "status": "借閱中",
  "actualReturnDate": null
}
```

### Google Sheets 資料結構

#### 器材清單工作表 (EQUIPMENT_SHEET)

| 欄位 | 說明 | 範例 |
|------|------|------|
| A: 器材ID | 唯一識別碼 | EQ001 |
| B: 器材名稱 | 完整名稱 | 單眼相機 Canon EOS 80D |
| C: 器材類別 | 分類標籤 | 相機 |
| D: 器材描述 | 詳細說明 | 高性能單眼相機... |
| E: 總數量 | 器材總數 | 5 |
| F: 可借數量 | 目前可借閱數量 | 3 |
| G: 狀態 | 可借閱/已借完/維修中 | 可借閱 |
| H: 圖片URL | 器材圖片連結 | https://... |

#### 借閱記錄工作表 (BORROW_SHEET)

| 欄位 | 說明 | 範例 |
|------|------|------|
| A: 學號 | 學生學號 | 411596453 |
| B: 姓名 | 學生姓名 | 白佳蓉 |
| C: 器材ID | 借閱器材ID | EQ002 |
| D: 器材名稱 | 器材完整名稱 | 繪圖板 Wacom Intuos Pro |
| E: 借閱時間 | 借閱日期時間 | 2024-09-10T14:00 |
| F: 預計歸還 | 預計歸還時間 | 2024-09-10T17:00 |
| G: 借閱目的 | 使用目的說明 | 數位繪畫課程作業使用 |
| H: 狀態 | 借閱中/已歸還 | 借閱中 |
| I: 實際歸還 | 實際歸還時間 | 2024-09-10T16:30 |

### 錯誤回應格式

```json
{
  "success": false,
  "message": "錯誤描述",
  "data": null,
  "timestamp": "2024-09-10T03:37:00.000Z"
}
```

常見錯誤訊息：

- `"請填寫所有必填欄位"` - 表單驗證失敗
- `"找不到指定的器材"` - 器材ID不存在
- `"該器材目前無庫存"` - 器材已借完
- `"找不到對應的借閱記錄"` - 歸還時找不到借閱記錄
- `"伺服器錯誤: [詳細錯誤]"` - 系統內部錯誤


## 前端整合方式

### 建立 API 服務模組

在前端專案中建立 `src/services/api.js` 檔案：

```javascript
// src/services/api.js
const API_BASE_URL = 'https://script.google.com/macros/s/你的腳本ID/exec';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '操作失敗');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // 獲取器材列表
  async getEquipmentList() {
    const url = `${this.baseUrl}?action=getEquipment`;
    return this.request(url);
  }

  // 提交借閱申請
  async borrowEquipment(borrowData) {
    const requestData = {
      action: 'borrowEquipment',
      ...borrowData
    };

    return this.request(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
  }

  // 歸還器材
  async returnEquipment(studentId, equipmentId) {
    const requestData = {
      action: 'returnEquipment',
      studentId,
      equipmentId
    };

    return this.request(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
  }

  // 查詢借閱歷史
  async getBorrowHistory(studentId) {
    const url = `${this.baseUrl}?action=getBorrowHistory&studentId=${encodeURIComponent(studentId)}`;
    return this.request(url);
  }
}

export default new ApiService();
```

### 更新 React 組件

修改 `src/App.jsx` 以整合真實 API：

```javascript
import { useState, useEffect } from 'react';
import ApiService from './services/api';
// ... 其他 imports

function App() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 載入器材列表
  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.getEquipmentList();
      setEquipment(response.data || []);
    } catch (error) {
      setError('載入器材列表失敗: ' + error.message);
      console.error('Failed to load equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  // 處理借閱申請
  const handleBorrowSubmit = async () => {
    if (!borrowForm.studentId || !borrowForm.studentName || 
        !borrowForm.borrowDate || !borrowForm.returnDate) {
      alert('請填寫所有必填欄位');
      return;
    }

    try {
      setLoading(true);
      const response = await ApiService.borrowEquipment({
        studentId: borrowForm.studentId,
        studentName: borrowForm.studentName,
        equipmentId: selectedEquipment.id,
        borrowDate: borrowForm.borrowDate,
        returnDate: borrowForm.returnDate,
        purpose: borrowForm.purpose
      });

      alert('借閱申請成功！');
      setShowBorrowDialog(false);
      setBorrowForm({
        studentId: '',
        studentName: '',
        borrowDate: '',
        returnDate: '',
        purpose: ''
      });
      
      // 重新載入器材列表以更新庫存
      await loadEquipment();
      
    } catch (error) {
      alert('借閱申請失敗: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 查詢學生借閱記錄
  const handleSearchHistory = async () => {
    if (!returnForm.studentId) {
      alert('請輸入學號');
      return;
    }

    try {
      setLoading(true);
      const response = await ApiService.getBorrowHistory(returnForm.studentId);
      setStudentBorrowHistory(response.data || []);
      setShowHistoryDialog(true);
    } catch (error) {
      alert('查詢借閱記錄失敗: ' + error.message);
      setStudentBorrowHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // 處理歸還
  const handleReturn = async (studentId, equipmentId) => {
    try {
      setLoading(true);
      await ApiService.returnEquipment(studentId, equipmentId);
      alert('歸還成功！');
      
      // 重新查詢借閱記錄
      await handleSearchHistory();
      // 重新載入器材列表
      await loadEquipment();
      
    } catch (error) {
      alert('歸還失敗: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 載入狀態顯示
  if (loading && equipment.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  // 錯誤狀態顯示
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadEquipment}>重新載入</Button>
        </div>
      </div>
    );
  }

  // ... 其餘組件程式碼保持不變
}
```

### 環境變數設定

建立 `.env` 檔案來管理 API URL：

```bash
# .env
VITE_API_BASE_URL=https://script.google.com/macros/s/你的腳本ID/exec
```

更新 API 服務以使用環境變數：

```javascript
// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://script.google.com/macros/s/預設腳本ID/exec';
```

## 錯誤處理

### 前端錯誤處理策略

#### 1. 網路錯誤處理

```javascript
class ApiService {
  async request(url, options = {}) {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const response = await fetch(url, {
          ...options,
          timeout: 10000, // 10秒超時
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || '操作失敗');
        }

        return data;
      } catch (error) {
        retries++;
        
        if (retries >= maxRetries) {
          throw new Error(`請求失敗 (重試 ${maxRetries} 次): ${error.message}`);
        }
        
        // 等待後重試
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
  }
}
```

#### 2. 使用者友善的錯誤訊息

```javascript
const getErrorMessage = (error) => {
  const errorMessages = {
    'Failed to fetch': '網路連線失敗，請檢查網路狀態',
    'HTTP 404': '找不到伺服器，請聯繫系統管理員',
    'HTTP 500': '伺服器內部錯誤，請稍後再試',
    'timeout': '請求超時，請檢查網路連線',
  };

  for (const [key, message] of Object.entries(errorMessages)) {
    if (error.message.includes(key)) {
      return message;
    }
  }

  return error.message || '未知錯誤，請聯繫系統管理員';
};
```

#### 3. 全域錯誤處理組件

```javascript
// src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">系統發生錯誤</h2>
            <p className="text-gray-600 mb-4">請重新整理頁面或聯繫系統管理員</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              重新整理頁面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### 後端錯誤處理

#### 1. Google Apps Script 錯誤處理

```javascript
function handleRequest(e) {
  try {
    // 記錄請求資訊
    console.log('Request received:', {
      method: e.method || 'GET',
      parameters: e.parameter,
      postData: e.postData
    });

    const action = e.parameter.action || 
                  (e.postData?.contents ? JSON.parse(e.postData.contents).action : null);
    
    if (!action) {
      return createResponse(false, '缺少必要的 action 參數');
    }

    switch(action) {
      case 'getEquipment':
        return getEquipmentList();
      case 'borrowEquipment':
        return borrowEquipment(e);
      case 'returnEquipment':
        return returnEquipment(e);
      case 'getBorrowHistory':
        return getBorrowHistory(e);
      default:
        return createResponse(false, `不支援的操作: ${action}`);
    }
  } catch (error) {
    console.error('Request handling error:', error);
    return createResponse(false, `伺服器錯誤: ${error.message}`);
  }
}
```

#### 2. 資料驗證

```javascript
function validateBorrowRequest(data) {
  const errors = [];

  if (!data.studentId || typeof data.studentId !== 'string') {
    errors.push('學號格式不正確');
  }

  if (!data.studentName || typeof data.studentName !== 'string') {
    errors.push('姓名格式不正確');
  }

  if (!data.equipmentId || typeof data.equipmentId !== 'string') {
    errors.push('器材ID格式不正確');
  }

  if (!data.borrowDate || !isValidDate(data.borrowDate)) {
    errors.push('借閱日期格式不正確');
  }

  if (!data.returnDate || !isValidDate(data.returnDate)) {
    errors.push('歸還日期格式不正確');
  }

  if (new Date(data.borrowDate) >= new Date(data.returnDate)) {
    errors.push('歸還日期必須晚於借閱日期');
  }

  return errors;
}

function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}
```

#### 3. 操作日誌記錄

```javascript
function logOperation(operation, data, result) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let logSheet = ss.getSheetByName('操作日誌');
    
    if (!logSheet) {
      logSheet = ss.insertSheet('操作日誌');
      logSheet.getRange(1, 1, 1, 6).setValues([
        ['時間', '操作', '使用者', '資料', '結果', '錯誤訊息']
      ]);
    }
    
    logSheet.appendRow([
      new Date().toISOString(),
      operation,
      data.studentId || 'unknown',
      JSON.stringify(data),
      result.success ? '成功' : '失敗',
      result.message || ''
    ]);
  } catch (error) {
    console.error('Failed to log operation:', error);
  }
}


## 安全性考量

### 1. 存取控制

#### Google Apps Script 權限設定

```javascript
// 在 Apps Script 中設定存取權限
function doGet(e) {
  // 檢查來源網域（可選）
  const allowedOrigins = [
    'https://你的用戶名.github.io',
    'http://localhost:5173' // 開發環境
  ];
  
  const origin = e.parameter.origin;
  if (origin && !allowedOrigins.includes(origin)) {
    return createResponse(false, '不允許的來源網域');
  }
  
  return handleRequest(e);
}
```

#### 輸入驗證和清理

```javascript
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }
  
  // 移除潛在的惡意字符
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim();
}

function validateAndSanitizeBorrowData(data) {
  return {
    studentId: sanitizeInput(data.studentId),
    studentName: sanitizeInput(data.studentName),
    equipmentId: sanitizeInput(data.equipmentId),
    borrowDate: sanitizeInput(data.borrowDate),
    returnDate: sanitizeInput(data.returnDate),
    purpose: sanitizeInput(data.purpose)
  };
}
```

### 2. 資料保護

#### 敏感資訊處理

```javascript
// 不要在前端暴露敏感資訊
function getEquipmentListForPublic() {
  const equipmentList = getEquipmentList();
  
  // 移除敏感欄位
  return equipmentList.data.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    description: item.description,
    availableQuantity: item.availableQuantity,
    status: item.status,
    imageUrl: item.imageUrl
    // 不包含 totalQuantity 等內部資訊
  }));
}
```

#### 學生資料隱私

```javascript
function getBorrowHistoryForStudent(studentId, requestingStudentId) {
  // 只允許學生查詢自己的記錄
  if (studentId !== requestingStudentId) {
    return createResponse(false, '只能查詢自己的借閱記錄');
  }
  
  return getBorrowHistory({ parameter: { studentId } });
}
```

### 3. 速率限制

```javascript
// 簡單的速率限制實作
const rateLimitCache = {};

function checkRateLimit(identifier, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitCache[identifier]) {
    rateLimitCache[identifier] = [];
  }
  
  // 清理過期的請求記錄
  rateLimitCache[identifier] = rateLimitCache[identifier].filter(
    timestamp => timestamp > windowStart
  );
  
  if (rateLimitCache[identifier].length >= maxRequests) {
    return false;
  }
  
  rateLimitCache[identifier].push(now);
  return true;
}

function handleRequest(e) {
  const clientId = e.parameter.clientId || 'anonymous';
  
  if (!checkRateLimit(clientId)) {
    return createResponse(false, '請求過於頻繁，請稍後再試');
  }
  
  // 繼續處理請求...
}
```

## 部署與維護

### 1. 部署檢查清單

#### 前端部署前檢查

- [ ] 更新 `.env` 檔案中的 API URL
- [ ] 確認所有圖片資源路徑正確
- [ ] 測試所有功能在生產環境中正常運作
- [ ] 檢查瀏覽器相容性
- [ ] 驗證響應式設計在不同裝置上的表現

#### 後端部署前檢查

- [ ] 確認 Google Sheets 權限設定正確
- [ ] 測試所有 API 端點
- [ ] 驗證資料格式和驗證邏輯
- [ ] 設定適當的錯誤處理
- [ ] 建立操作日誌記錄

### 2. 監控與維護

#### 效能監控

```javascript
// 在 Apps Script 中加入效能監控
function performanceWrapper(functionName, targetFunction) {
  return function(...args) {
    const startTime = new Date().getTime();
    
    try {
      const result = targetFunction.apply(this, args);
      const endTime = new Date().getTime();
      
      logPerformance(functionName, endTime - startTime, true);
      return result;
    } catch (error) {
      const endTime = new Date().getTime();
      logPerformance(functionName, endTime - startTime, false, error.message);
      throw error;
    }
  };
}

function logPerformance(functionName, duration, success, errorMessage = '') {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let perfSheet = ss.getSheetByName('效能日誌');
    
    if (!perfSheet) {
      perfSheet = ss.insertSheet('效能日誌');
      perfSheet.getRange(1, 1, 1, 5).setValues([
        ['時間', '功能', '執行時間(ms)', '成功', '錯誤訊息']
      ]);
    }
    
    perfSheet.appendRow([
      new Date().toISOString(),
      functionName,
      duration,
      success ? '是' : '否',
      errorMessage
    ]);
  } catch (error) {
    console.error('Failed to log performance:', error);
  }
}

// 使用範例
const monitoredGetEquipmentList = performanceWrapper('getEquipmentList', getEquipmentList);
```

#### 資料備份策略

```javascript
function createBackup() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const backupName = `器材借閱系統備份_${new Date().toISOString().split('T')[0]}`;
    
    // 建立備份副本
    const backup = ss.copy(backupName);
    
    // 將備份移至特定資料夾（可選）
    const backupFolder = DriveApp.getFolderById('備份資料夾ID');
    DriveApp.getFileById(backup.getId()).moveTo(backupFolder);
    
    console.log(`備份已建立: ${backupName}`);
    return backup.getId();
  } catch (error) {
    console.error('備份失敗:', error);
    throw error;
  }
}

// 設定定期備份觸發器
function setupBackupTrigger() {
  // 每週日凌晨 2 點執行備份
  ScriptApp.newTrigger('createBackup')
    .timeBased()
    .everyWeeks(1)
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(2)
    .create();
}
```

### 3. 故障排除指南

#### 常見問題與解決方案

| 問題 | 可能原因 | 解決方案 |
|------|----------|----------|
| API 請求失敗 | CORS 設定問題 | 檢查 Apps Script 中的 CORS 標頭設定 |
| 資料不同步 | 快取問題 | 清除瀏覽器快取，重新載入頁面 |
| 借閱申請失敗 | 表單驗證錯誤 | 檢查必填欄位和資料格式 |
| 頁面載入緩慢 | 圖片檔案過大 | 壓縮圖片或使用 CDN |
| 器材狀態不正確 | 資料同步問題 | 檢查 Google Sheets 資料完整性 |

#### 除錯工具

```javascript
// 前端除錯工具
const DEBUG_MODE = import.meta.env.DEV;

function debugLog(message, data = null) {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] ${message}`, data);
  }
}

// 使用範例
debugLog('API request started', { url, method, data });
```

### 4. 版本更新流程

#### 前端更新流程

1. **開發環境測試**
   ```bash
   npm run dev
   # 測試所有功能
   ```

2. **建置生產版本**
   ```bash
   npm run build
   ```

3. **部署到 GitHub Pages**
   ```bash
   git add .
   git commit -m "版本更新: [描述變更內容]"
   git push origin main
   ```

#### 後端更新流程

1. **備份現有版本**
   - 執行 `createBackup()` 函數

2. **測試新版本**
   - 在測試環境中驗證所有功能

3. **部署新版本**
   - 更新 Apps Script 程式碼
   - 建立新的部署版本
   - 更新前端 API URL（如有變更）

### 5. 使用者支援

#### 使用者手冊

建立簡單的使用者指南，包含：

- 如何搜尋和借閱器材
- 如何查詢借閱記錄
- 如何歸還器材
- 常見問題解答
- 聯繫資訊

#### 意見回饋機制

```javascript
// 在前端加入意見回饋功能
function submitFeedback(feedback) {
  const feedbackData = {
    action: 'submitFeedback',
    message: feedback.message,
    type: feedback.type, // 'bug', 'suggestion', 'question'
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };

  return ApiService.request(API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify(feedbackData)
  });
}
```

## 結論

本整合指南提供了完整的前後端整合方案，包含：

- **完整的 API 設計**：涵蓋所有必要的功能端點
- **詳細的實作範例**：提供可直接使用的程式碼
- **安全性最佳實踐**：確保系統安全可靠
- **維護與監控**：建立長期穩定運行的基礎

透過遵循本指南，您可以成功建立一個功能完整、安全可靠的器材借閱管理系統。如有任何問題或需要進一步協助，請參考故障排除章節或聯繫技術支援團隊。

