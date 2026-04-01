# 開發者日誌 (Developer Log)

本文件記錄專案版本變更、架構調整、驗證結果與文件同步狀態。
自即日起，新增的完成時間、更新時間或里程碑時間戳一律使用 `YYYY-MM-DD HH:mm`（24 小時制）；既有歷史紀錄不追溯修改。

## Current Context Snapshot（更新：2026-04-01 08:32，V0.1.26）

- 當前版本：`v0.1.26`（本地待 commit）
- 目前主軸：在穩定語法與高亮基線上，依 `RoadMap` 推進 V0.2 的卡片管理能力。
- 已知穩定做法：
  - 單行答案／cloze 使用 chip 渲染。
  - 多行答案僅保留 `淡色背景帶` 與 `右側線條` 兩種模式。
- 已知風險：
  - CodeMirror decoration 建構順序錯誤會導致整體高亮失效。
  - Editor CSS 與 UI CSS 必須維持分層，避免 selector 汙染。
- 下一步優先：
  - 以 `RoadMap.md` 的 Sprint E 為主，先落地 `Cards` 管理分區骨架與查詢層。
- 文件同步：
  - 已在 `Manual.md` / `Instruction.md` / `RoadMap.md` 統一卡片型式（5 種）與答案呈現型式（4 種）的中英文命名基準。
- 開發節奏：
  - 採三段式流程：`試驗階段（本地驗證）` -> `正式階段（穩定版基線重寫）` -> `發版階段（文件同步後再推送）`。
- 新對話啟動讀檔順序：`SKILL.md` -> `dev_log.md`（本快照） -> `Instruction.md` -> `RoadMap.md` -> `Retrospective.md`

---

## V0.1.26（本地定版）— 術語基準文件同步（2026-04-01 08:32）

### 目標
- 將卡片型式與答案呈現型式的中英文命名統一到核心文件，降低後續規劃與實作溝通誤差。

### 主要調整
- 文件同步（術語明確化）
  - `Manual.md`：新增「卡片型式命名對照（5 種）」與「答案呈現型式命名對照（4 種）」。
  - `Instruction.md`：新增術語基準章節，並將單行答案渲染描述更新為 strategy（`chip / plain`）。
  - `RoadMap.md`：新增「術語基準（文件同步）」段落，作為後續規劃命名準則。
  - `dev_log.md`：更新 Current Context Snapshot 與本版紀錄。
- 版本同步
  - `manifest.json` / `package.json` / `package-lock.json` 升版為 `0.1.26`。

### 驗證
- `npm run check:docs-encoding`：通過

---

## V0.1.25（本地定版）— 單行答案渲染 Style Strategy 落地（2026-04-01 08:16）

### 目標
- 將單行答案呈現從固定 chip 抽象成可擴充策略層，為後續樣式擴展保留彈性。

### 主要調整
- settings
  - 新增 `singleLineAnswerRenderStyle` 設定欄位，預設值為 `chip`。
  - 新增 `singleLineAnswerRenderStyles` 定義檔，首批支援 `chip` / `plain`。
  - 設定頁新增「單行答案渲染樣式」下拉切換。
- editor render strategy
  - 新增 `singleLineAnswerRenderStrategy.ts`，集中管理單行答案裝飾策略。
  - `AnswerHighlighter` 改由策略層產生單行答案 decoration，移除內嵌固定 chip 實作。
  - reveal 點擊命中範圍擴充，支援 `plain` 樣式 DOM（`.fc-answer-inline-text`）。
- style
  - `editor.css` 新增 `plain` 樣式基礎外觀（純文字高亮）。

### 驗證
- `npm run check:docs-encoding`：通過
- `npm test`：通過（69 tests）
- `npm run build`：通過

---

## V0.1.24（本地定版）— 啟動流程、同步穩定性與提交防呆強化（2026-04-01 08:08）

### 目標
- 在繼續功能開發前，先完成五項架構補強：儲存錯誤傳遞、啟動順序修正、同步 debounce 調整、編輯器解析快取、pre-commit 防呆。

### 主要調整
- storage / queue
  - `FlashcardRepository.save()` 改為錯誤向上拋出，不再靜默吞錯。
  - `SaveQueue` 加入失敗後可恢復鏈結（不中斷後續保存），並在排程保存失敗時保留 pending 狀態以便重試。
  - 新增 `SaveQueue` 回歸測試：驗證首次儲存失敗後，後續儲存仍可成功執行。
- startup / lifecycle
  - `main.ts` 啟動順序調整為：先 `dataStore.load()`，再註冊 `blockId/sync` 事件，降低啟動競態風險。
- sync service
  - `FlashcardSyncService` 改為「收集變更檔案 + trailing debounce flush」，避免 leading debounce 漏掉最後一次編輯。
- editor performance
  - `answerHighlightRules` 新增單次 build parse cache（多行區塊與起始行索引）。
  - `AnswerHighlighter` 套用 parse cache，並重用文件解析結果處理 reveal 目標，減少重複 `parseDocument`。
- commit guardrails
  - 新增 `.githooks/pre-commit`，提交前固定執行 `npm run check:docs-encoding`。
  - 新增 `scripts/setup-hooks.js` 與 `npm run setup:hooks`，用於設定 `core.hooksPath=.githooks`（受限環境改為提示手動設定）。

### 驗證
- `npm run check:docs-encoding`：通過（含 JSON validity check）
- `npm test`：通過（69 tests）
- `npm run build`：通過

---

## V0.1.23（正式版）— 內嵌語法重做、填充卡整合與編輯模式互動修正（2026-04-01 02:26）

### 目標
- 依 `V0.1.23重做步驟.md` 重做內嵌語法流程，避免重複踩到 Case 003 的錯誤模式。
- 完成內嵌單行卡 + 內嵌填充卡（cloze）的一致解析與高亮行為。
- 修正編輯模式互動：進入 reveal 後，點卡片內編修位置不應跳回閱讀模式。

### 主要調整
- parser / syntax
  - 新增 `src/parser/inlineFlashcardSyntax.ts`，集中內嵌語法匹配邏輯。
  - `FlashcardParser` 加入 inline forward 與 inline cloze wrapper 解析。
  - 建立 inline 硬邊界：有 `{{fc` 或 `/fc}}` 但不合法時，不做 fallback 解析。
- highlight / token hiding
  - `answerHighlightRules` 新增 inline forward / inline cloze 的高亮與 token 隱藏規則。
  - 填充卡只高亮 `==...==`，不高亮整段包裹內容。
  - `{{fc: ...}}` 視為 deprecated，不解析、不高亮。
- editor interaction
  - `AnswerHighlighter` 改為同一行 decorations 先 `collect -> sort -> add`，避免 out-of-order 造成全域高亮失效。
  - reveal 狀態改為可讀取 active range；在 reveal 中點卡片內位置保持編輯模式，不清除 reveal。
- tests
  - 補齊 parser / highlight / block id 規則與內嵌語法回歸測試（含 malformed 與 deprecated 案例）。

### 驗證
- `npm test`：通過（68 tests）
- `npm run build`：通過
- git：`release: v0.1.23` 已 push 至 `origin/master`

---

## V0.1.22（本地定版）— `fc` 快速輸入教學與路線補強（2026-03-31 18:54）

### 目標
- 將 `fc` 包裹語法的快速輸入方式補進使用者文件，降低手打成本。
- 將「選取文字一鍵包裝」納入 RoadMap 的語法實作路線。

### 主要調整
- `Manual.md`
  - 新增「`fc` 語法快速輸入方式（建議）」三種工作方式：
    - 方式 1：模板片段快速插入
    - 方式 2：選取文字後一鍵包裝（規劃中）
    - 方式 3：文字縮寫自動展開
- `RoadMap.md`
  - 在「語法實作路線（建議）」新增 `P1.5`：
    - `Wrap selection as flashcard` 命令，支援將選取內容一鍵包裝為 `{{fc ... /fc}}`，且可綁定快捷鍵。
- 版本同步
  - `manifest.json` / `package.json` / `package-lock.json` 升版為 `0.1.22`。

### 驗證
- 文件與版本欄位一致性檢查：通過
- 備註：本次僅文件與版本定義調整，未執行 build/test

---

## V0.1.21（正式版）— 答案高亮點擊觸發編輯顯示修正（2026-03-31 14:12）

### 目標
- 將編輯顯示觸發改為「點擊答案高亮區塊才 reveal」，避免一般點擊行內位置就顯示卡片語法與 Block ID。
- 修正多行/清單答案在點擊高亮區時未能顯示對應 Block ID 的問題。

### 主要調整
- `src/editor/revealState.ts`
  - 新增 editor reveal 狀態管理，支援 reveal 行與作用範圍（多行卡可維持在同一張卡內有效）。
- `src/editor/AnswerHighlighter.ts`
  - 新增點擊高亮區塊觸發 reveal 的互動邏輯（`fc-answer-chip` 與多行答案樣式區塊）。
  - reveal 目標改為對齊卡片起始行，並保留多行卡的有效範圍。
- `src/editor/BlockIdHider.ts`
  - Block ID 顯示條件改為依 reveal 狀態，而非單純以游標行判斷。
- 版本同步
  - `manifest.json` / `package.json` / `package-lock.json` 升版為 `0.1.21`。
- 文件同步
  - `RoadMap.md`、`Instruction.md`、`Manual.md`、`dev_log.md`。

### 驗證
- `npx tsc --noEmit`：通過
- `npm test`：通過（40 tests）
- `npm run build`：通過

---

## V0.1.20（正式版）— 架構規劃整理與時間戳規範（2026-03-31 13:49）

### 目標
- 在 Sprint E 前降低 UI 與資料流程耦合，並補上可觀測的同步狀態層。

### 主要調整
- `.codex/skill/SKILL.md`
  - 新增文件時間戳規則：之後 `RoadMap.md` 與 `dev_log.md` 的新增完成時間、更新時間或里程碑時間戳一律使用 `YYYY-MM-DD HH:mm`（24 小時制），既有歷史紀錄不追溯修改。
- `RoadMap.md`
  - 補齊卡片管理的 V0.2 開發框架：Cards Query Layer、來源健康度、分組/列表檢視切換、`inheritedTags / cardTags / effectiveTags`、單卡標籤主儲存策略。
  - 新增大規模卡片量下的性能與延遲控制規劃（derived indexes、job coalescing、增量同步、背景重建、虛擬清單）。
- `dev_log.md`
  - 同步寫入時間戳規則，並將本次文件/規劃整理收斂為 `V0.1.20` 正式版紀錄。
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
  - 補入兩步驟（Action Layer / Sync State Layer）並同步收斂到 `V0.1.20` 發版內容。
- 版本同步
  - `manifest.json` / `package.json` / `package-lock.json` 升版為 `0.1.20`。

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
