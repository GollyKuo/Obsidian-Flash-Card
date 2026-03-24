# 開發者日誌 (Developer Log)

本文件記錄專案所有的版本更動、架構調整與重要事件。

---

## V0.1 — 首個可用版本 (2026-03-25)

### 新增
- **FlashcardParser**：支援 `::` 正向 / `;;` 反向 / `:::` 雙向 / `==填空==` 四種語法 + 多行模式
- **BlockIdManager**：On Blur 觸發 + `vault.process()` 原子寫入 + 防抖邏輯 + 競態條件防護
- **DataStore**：`_Flashcards/data.json` 讀寫管理 + FSRS 狀態結構定義
- **CSS 隔離**：Tailwind `fc-` 前綴 + PostCSS `#fc-plugin-root` 包裹 + Preflight 禁用
- **esbuild 流水線**：自動編譯 + 自動複製到 Obsidian Vault 外掛目錄
- **指令**：「掃描當前文件的閃卡」與「顯示閃卡統計」
- **版本控制**：初始化 git + `.gitignore` + `dev_log.md`

### 修正
- 修正 Block ID 在閱讀模式的 CSS 選擇器（改用屬性選擇器匹配 Obsidian 渲染方式）
- 強化 `BlockIdManager` 安全性：增加檔案存在驗證、null 防護、vault.process 內部競態條件防護
- 修正 `editor-change` 回呼未使用參數的問題

### 技術架構
- TypeScript + React 18 + Tailwind CSS 3 (fc- prefix)
- esbuild 打包 → `dist/main.js` + `styles.css`
- 自動部署到 Obsidian Test Vault

---

## [Initial Setup] - 2026-03-25
- 初始化專案，定義 AI 閃卡外掛之開發架構
- 確認專案核心守則：資料至上、樣式絕對隔離、隱形標記、智慧觸發、Notion 美學、效能防線
