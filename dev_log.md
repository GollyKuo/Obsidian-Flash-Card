# 開發者日誌 (Developer Log)

本文件記錄專案版本變更、架構調整、驗證結果與文件同步狀態。

## Current Context Snapshot（更新：2026-03-31，V0.1.19 + Unreleased 架構補強）

- 當前版本：`v0.1.19`（已發版）+ `Unreleased`（Action Layer / Sync State Layer）
- 目前主軸：維持高亮渲染穩定，按 `RoadMap` 推進 Sprint E 的 Dashboard `Cards` 分區骨架。
- 已知穩定做法：
  - 單行答案／cloze 使用 chip 渲染。
  - 多行答案僅保留 `淡色背景帶` 與 `右側線條` 兩種模式。
- 已知風險：
  - CodeMirror decoration 建構順序錯誤會導致整體高亮失效。
  - Editor CSS 與 UI CSS 必須維持分層，避免 selector 汙染。
- 下一步優先：
  - 以 `RoadMap.md` 的 Sprint E 為主，先落地 `Cards` 管理分區骨架。
- 開發節奏：
  - 採三段式流程：`試驗階段（本地驗證）` -> `正式階段（穩定版基線重寫）` -> `發版階段（文件同步後再推送）`。
- 新對話啟動讀檔順序：`SKILL.md` -> `dev_log.md`（本快照） -> `Instruction.md` -> `RoadMap.md` -> `Retrospective.md`

---

## Unreleased（2026-03-31）— Action Layer 與 Sync State Layer

### 目標
- 在 Sprint E 前降低 UI 與資料流程耦合，並補上可觀測的同步狀態層。

### 主要調整
- `src/app/FlashcardsAppService.ts`
  - 新增 app-level action service，集中掃描、統計、清理與高亮診斷邏輯。
- `src/app/registerPluginUi.ts`
  - command/ribbon 改為呼叫 app service，移除重複業務邏輯，UI 只保留觸發與 Notice 呈現。
- `src/sync/types.ts`
  - 新增 `SyncPhase`、`SyncStatusState`、`SyncStatusListener` 型別。
- `src/sync/FlashcardSyncService.ts`
  - 新增 sync status state（`idle/syncing/error` + `activeJobs` + `lastSyncedAt` + `lastError`）。
  - 新增狀態訂閱 API：`getSyncStatus()`、`onSyncStatusChange()`。
  - 以 `runTrackedSync()` 包裝 sync 流程，讓手動掃描與檔案事件都能更新同步狀態。
- `RoadMap.md`
  - 補入兩步驟（Action Layer / Sync State Layer）並標記已完成（Unreleased）。

### 驗證
- `npx tsc --noEmit`：通過
- `npm test`：通過（40 tests）
- `npm run build`：通過

---

## V0.1.19（正式版）— 設定頁分頁化與編碼治理（2026-03-31）

### 目標
- 讓設定頁具備可持續擴充的分頁架構，降低未來新增設定時的耦合與改動成本。

### 主要調整
- `src/settings/FlashcardsSettingTab.ts`
  - 將單一 `display()` 大函式改為分頁式架構：`一般`、`答案高亮`、`AI`、`維護工具`。
  - 新增 tab definition 與 section renderer，後續可用新增 tab 的方式擴展設定頁，不需重寫整頁。
  - 設定頁改掛載於 `#fc-plugin-root`，維持樣式隔離一致性。
- 編碼治理（encoding hygiene）
  - 新增 `.editorconfig`，統一 UTF-8、行尾 LF 與檔案格式基準。
  - 新增 `.gitattributes`，固定文字檔 EOL 策略並標註常見二進位副檔名。
  - 將先前混用 UTF-8 BOM 的檔案（`dev_log.md`、`src/settings/FlashcardsSettingTab.ts`、`src/settings/multiLineAnswerRenderStyles.ts`）統一為 UTF-8 無 BOM。
- `src/styles/main.css`
  - 新增設定分頁樣式（tab list、button、active state、panel）。
- `src/main.ts`
  - `saveSettings()` 新增可選參數 `reloadDataStore`，避免每次設定變更都強制 reload datastore。
  - `資料目錄` 變更時才觸發 datastore reload，其餘設定改為輕量儲存流程。
- `Manual.md`
  - 同步更新設定頁為分頁式介面操作說明。
- 版本同步
  - `manifest.json` / `package.json` / `package-lock.json` 升版為 `0.1.19`。
- 文件同步
  - `RoadMap.md`、`Instruction.md`、`Manual.md`、`dev_log.md`。

### 驗證
- `npx tsc --noEmit`：通過
- `npm test`：通過（40 tests）
- `npm run build`：通過

---

## V0.1.181（正式版）— 啟動讀檔順序納入 SKILL（2026-03-31）

### 目標
- 固化新對話開工流程，降低 context 轉場遺漏風險。

### 主要調整
- `.codex/skill/SKILL.md`
  - 新增「每次開啟新對話並開始開發前」必讀順序：
    `SKILL.md` → `dev_log.md`（Current Context Snapshot）→ `Instruction.md` → `RoadMap.md` → `Retrospective.md`。
- 版本同步
  - `manifest.json` / `package.json` / `package-lock.json` 升版為 `0.1.181`。
- 文件同步
  - `dev_log.md` 快照與版本紀錄同步更新。

### 驗證
- 流程文件一致性檢查：通過（`SKILL.md` 與 `dev_log.md` 一致）。

---

## V0.1.18（正式版）— 以 v0.1.17 基線重寫並發版（2026-03-31）

### 目標
- 回到 `v0.1.17` 乾淨基線，僅保留最終正確方案。
- 發布正式版 `v0.1.18` 並同步文件與版本資訊。

### 主要調整
- `src/settings/FlashcardsSettingTab.ts`
  - 保留主題色/透明度/樣式獨立顏色設定。
  - 主次標題改為 class-based 控制（移除試驗過程的 inline style）。
- `src/styles/main.css` + `esbuild.config.mjs`
  - 設定頁主次標題對齊規則固定化。
  - `PrefixWrap` 透過 `ignoredSelectors` 確保設定頁樣式命中。
- 版本同步
  - `manifest.json` / `package.json` / `package-lock.json` 升版為 `0.1.18`。
- 文件同步
  - `RoadMap.md`、`Instruction.md`、`Manual.md`、`Retrospective.md`、`dev_log.md`。

### 驗證
- `npx tsc --noEmit`：通過
- `npm test`：通過（40 tests）
- `npm run build`：通過（已同步至 Vault 外掛目錄）

---

## V0.1.17（試驗 -> 完成）— 答案高亮主題自訂（2026-03-31）

### 目標
- 新增答案高亮主題設定：可自訂顏色與透明度。
- 預設維持低對比深色半透明風格。
- 新增「各樣式獨立顏色」勾選欄位，保留進階自訂空間。

### 主要調整
- `src/settings/types.ts`
  - 新增高亮主題相關設定欄位（主題色、透明度、樣式獨立顏色開關與色彩欄位）。
- `src/settings/FlashcardsSettingTab.ts`
  - 新增 `答案高亮主題` 設定區（主題色、透明度、獨立顏色勾選與展開色票）。
- `src/main.ts`
  - 新增高亮主題設定驗證與 CSS 變數套用流程。
- `src/styles/editor.css`
  - `chip`、`淡色背景帶`、`右側線條` 改用主題變數渲染，支援即時主題調整。

### 驗證
- `npx tsc --noEmit`：通過
- `npm test`：通過（40 tests）
- `npm run build`：通過

---

## V0.1.16 — 三段式開發節奏正式納入（2026-03-31）

### 目標
- 降低試錯造成的重工與 tokens 浪費，將試驗與發版責任分流。

### 主要調整
- `SKILL.md`：新增重大功能三段式流程
  - `試驗階段`：本地 spike 驗證，不升版不推送。
  - `正式階段`：以穩定版為基線重寫，僅保留可行方案。
  - `發版階段`：版本號、文件同步與驗證完成後再 commit / push。
- `dev_log.md`：Current Context Snapshot 同步標記三段式開發節奏。

### 驗證
- 文件一致性檢查完成：`SKILL.md` 與 `dev_log.md` 規則一致。

---

## V0.1.15 — Context Snapshot 流程落地（2026-03-31）

### 目標
- 建立可長期沿用的 context 壓縮與調閱流程，降低長對話下的脈絡遺失風險。

### 主要調整
- 在 `dev_log.md` 最上方新增 `Current Context Snapshot` 固定區塊。
- 將「開工先讀 snapshot、里程碑後更新 snapshot」規範寫入 `SKILL.md`。

### 驗證
- 文件一致性檢查完成：`dev_log.md`、`SKILL.md` 規則對齊。

---

## V0.1.14（正式版）— 高亮渲染策略重寫（2026-03-31）

### 目標
- 以 `v0.1.13` 為乾淨基線重寫多行答案渲染。
- 保留重構後 `Manual.md` 的使用者導向內容。
- 多行/清單模式僅保留 `淡色背景帶` 與 `右側線條`。

### 主要調整
- `src/settings/multiLineAnswerRenderStyles.ts`
  - 僅保留 `soft-band` / `right-rail` 兩種模式。
- `src/editor/AnswerHighlighter.ts`
  - 移除 `rounded-container` 渲染分支。
  - 多行答案採區塊式 line decoration。
  - `右側線條` 與 `淡色背景帶` 都改為整塊區域一致渲染。
- `src/styles/editor.css`
  - 移除 `rounded-container` 樣式。
  - 保留並優化 `soft-band` / `right-rail` 的區塊式效果。

### 文件同步
- `Manual.md`：多行樣式說明改為僅兩種模式。
- `Instruction.md`：高亮渲染重構第三階段標記為 `V0.1.14` 已完成。
- `RoadMap.md`：Sprint F 同步為 `V0.1.14` 完成。

### 驗證
- `npx tsc --noEmit`：通過
- `npm test`：通過（40 tests）
- `npm run build`：通過（已同步至 Vault 外掛目錄）

---

## V0.1.13 — 答案高亮膠囊化與顯示語意正規化（2026-03-30）

### 目標
- 解決答案高亮在符號附近邊緣破碎問題。
- 讓 chip 顯示符合 Obsidian 內聯語法閱讀語意。

### 主要調整
- `src/editor/AnswerHighlighter.ts`
  - 非游標行答案改為單一 `AnswerChipWidget` 呈現。
- `src/editor/answerChipText.ts`
  - 新增顯示文字正規化：`[[target|alias]]` 顯示 alias。
  - 支援常見內聯語法顯示轉換（wikilink / markdown link / cloze）。
- `src/styles/editor.css`
  - 新增 `.fc-answer-chip` 膠囊樣式。

### 驗證
- `npx tsc --noEmit`：通過
- `npm test`：通過（37 tests）
- `npm run build`：通過

---

## V0.1.12（重做版）— 回到 v0.1.11 穩定基線（2026-03-30）

### 目標
- 移除試錯過程中不穩定作法，保留可驗證方案。
- 強化編輯器渲染穩定性與可維護性。

### 正式採用作法
- `src/styles/editor.css` 與 `src/styles/main.css` 分層。
- `esbuild.config.mjs` 對 `editor.css` 停用 `#fc-plugin-root` prefix-wrap。
- `AnswerHighlighter` 採 decoration-only 流程。
- `BlockIdHider` 同時支援行尾型與獨立行型 `^fc-...`。
- `:: / ;; / :::` 語法 token 在游標離開後隱藏，游標回到該行恢復。

### 驗證
- `npx tsc --noEmit`：通過
- `npm test`：通過（33 tests）
- `npm run build`：通過

---

## 文件維護原則

- `dev_log.md`：記錄「做了什麼、為何這樣做、如何驗證」。
- `RoadMap.md`：記錄「接下來要做什麼、優先級、完成狀態」。
- `Instruction.md`：記錄「開發方向、架構原則、當前行動」。
- `Manual.md`：記錄「使用者如何使用目前功能」。
