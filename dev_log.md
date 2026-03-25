# 開發者日誌 (Developer Log)

本文件記錄專案所有的版本更動、架構調整與重要事件。

---

## V0.1.1 — 隱藏 Block ID + 閃卡複習系統 (2026-03-25)

從 V0.1 乾淨重寫。解決了前幾次迭代中的 5 個已知問題。

### 新增
- **BlockIdHider** (`src/editor/BlockIdHider.ts`)：CM6 ViewPlugin，隱藏非游標行的 `^fc-xxxxxx`
- **ReviewModal** (`src/ui/ReviewModal.tsx`)：React 複習介面，inline style，FSRS 四鍵評分
- **ReviewModalContainer** (`src/ui/ReviewModalContainer.tsx`)：Obsidian Modal ↔ React 橋接
- **指令**：「開始閃卡複習」（`start-review`），可透過 Ctrl+P 呼叫
- **DataStore.reviewCard()**：整合 `ts-fsrs` 的 FSRS 排程演算法

### 修正
- **Folder already exists**：`ensureDirectory` 加入 try/catch 靜默處理
- **File already exists**：`save()` 新增 `safeCreate` 方法，失敗時 fallback 到 `adapter.write`
- **指令未註冊**：`onload()` 中先註冊所有指令/擴充，最後才 `await dataStore.load()`
- **型別安全**：State 枚舉與字串之間使用顯式映射表（stateMap / stateRevMap）

### 架構改進
- 共用 `isAlreadyExistsError()` 工具方法
- `FSRSState` 新增 `lastReview?` 欄位

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
