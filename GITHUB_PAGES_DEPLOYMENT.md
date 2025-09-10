# GitHub Pages 部署指南

## 快速部署步驟

### 1. 準備 GitHub 儲存庫

1. **建立新的 GitHub 儲存庫**
   - 登入 GitHub
   - 點擊右上角的 "+" → "New repository"
   - 儲存庫名稱：`equipment-rental-system`（或您喜歡的名稱）
   - 設定為 Public（GitHub Pages 免費版需要公開儲存庫）
   - 勾選 "Add a README file"
   - 點擊 "Create repository"

2. **複製儲存庫 URL**
   - 在新建立的儲存庫頁面，點擊綠色的 "Code" 按鈕
   - 複製 HTTPS URL（格式：`https://github.com/你的用戶名/equipment-rental-system.git`）

### 2. 上傳專案檔案

#### 方法 A：使用 Git 命令列（推薦）

```bash
# 在專案目錄中初始化 Git
cd /path/to/equipment-rental-system
git init

# 新增所有檔案
git add .

# 建立第一次提交
git commit -m "Initial commit: 多媒體動畫科器材借閱系統"

# 設定主分支名稱
git branch -M main

# 連結到 GitHub 儲存庫
git remote add origin https://github.com/你的用戶名/equipment-rental-system.git

# 推送到 GitHub
git push -u origin main
```

#### 方法 B：使用 GitHub 網頁介面

1. 在 GitHub 儲存庫頁面點擊 "uploading an existing file"
2. 將專案資料夾中的所有檔案拖拽到上傳區域
3. 填寫提交訊息：`Initial commit: 多媒體動畫科器材借閱系統`
4. 點擊 "Commit changes"

### 3. 啟用 GitHub Pages

1. **進入儲存庫設定**
   - 在 GitHub 儲存庫頁面，點擊 "Settings" 標籤

2. **設定 Pages**
   - 在左側選單中找到 "Pages"
   - Source 選擇 "GitHub Actions"
   - 系統會自動偵測到專案中的 `.github/workflows/deploy.yml` 檔案

3. **等待部署完成**
   - 前往 "Actions" 標籤查看部署進度
   - 部署成功後，會顯示網站 URL

### 4. 取得網站 URL

部署完成後，您的網站將可在以下 URL 存取：
```
https://你的用戶名.github.io/equipment-rental-system/
```

## 自訂網域設定（可選）

如果您有自己的網域名稱：

1. **在 GitHub 設定自訂網域**
   - 在 Pages 設定中，填入您的網域名稱
   - 例如：`equipment.yourschool.edu.tw`

2. **設定 DNS 記錄**
   - 在您的網域提供商設定 CNAME 記錄
   - 指向：`你的用戶名.github.io`

## 更新網站內容

每次修改程式碼後，只需要推送到 GitHub：

```bash
# 新增修改的檔案
git add .

# 建立提交
git commit -m "更新描述"

# 推送到 GitHub
git push origin main
```

GitHub Actions 會自動重新部署網站。

## 常見問題

### Q: 部署失敗怎麼辦？
A: 
1. 檢查 Actions 標籤中的錯誤訊息
2. 確認 `package.json` 中的依賴項目正確
3. 檢查 `.github/workflows/deploy.yml` 檔案格式

### Q: 網站顯示 404 錯誤？
A:
1. 確認 Pages 設定中的 Source 選擇正確
2. 檢查部署是否成功完成
3. 等待幾分鐘讓 DNS 生效

### Q: 如何查看部署狀態？
A:
1. 前往 GitHub 儲存庫的 "Actions" 標籤
2. 查看最新的 workflow 執行狀態
3. 點擊可查看詳細的部署日誌

### Q: 可以使用免費版 GitHub Pages 嗎？
A: 是的，GitHub Pages 對公開儲存庫完全免費，包含：
- 無限制的靜態網站託管
- 自動 HTTPS
- 自訂網域支援
- 每月 100GB 頻寬限制

## 後續維護

1. **定期備份**：GitHub 本身就是很好的備份，但建議也在本地保留副本

2. **監控使用情況**：可在 GitHub Insights 中查看網站訪問統計

3. **更新依賴項目**：定期更新 `package.json` 中的套件版本

4. **安全性**：由於是靜態網站，安全性風險較低，但仍需注意不要在程式碼中暴露敏感資訊

## 技術支援

如遇到部署問題，可參考：
- [GitHub Pages 官方文件](https://docs.github.com/en/pages)
- [GitHub Actions 文件](https://docs.github.com/en/actions)
- 本專案的 `README.md` 和 `backend-integration.md` 檔案

