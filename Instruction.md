# 開發指令 (Instruction)

## 版本

- `v1.6`

## 專案目標 (Objective)

- 建置一套 **AI-Enriched Flashcards Obsidian Plugin**。
- 核心方向為：**strict CSS isolation**、**RemNote-inspired interaction model**、**FSRS-based review scheduling**、**Obsidian-native editing workflow**。
- 產品定位是學習與複習系統，不是一般筆記小工具或單純的 note widget。

## 技術堆疊 (Tech Stack)

- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
  - prefix 使用 `fc-`
  - `Preflight` 關閉
  - 搭配 `PostCSS PrefixWrap` 將 UI 隔離於 `#fc-plugin-root`
- **Icons**: `lucide-react`
- **AI Layer**: Gemini 3 Flash SDK (`@google/generative-ai`)
- **Persistence Layer**: sharded JSON storage (`_Flashcards/data.json` manifest + `_Flashcards/Cards/*.json`)

## 里程碑 (Milestones)

### M1. Sandbox 與樣式隔離

- 建立 plugin sandbox 環境
- 完成 PostCSS isolation
- 建立隱藏 `^fc-` Block ID 的 CSS / rendering 規則

### M2. Flashcard Parser 與 ID 流程

- 完成 `FlashcardParser`
- 支援 `On Blur` Block ID generation
- 支援 indentation-aware multiline parsing

### M3. HUD 與編輯器狀態提示

- 以 `CodeMirror 6 View Plugin` 建立 **Notion-style HUD**
- 在行尾顯示 mastery icon、due state 與相關狀態提示

### M4. AI Enrichment

- 整合 Gemini 3 Flash
- 支援 **Manual Enrichment** 與 **Batch Requesting**
- 預留圖片、音訊與多模態流程

### M5. Review Experience

- 建立 `Review Modal`
- 接入 FSRS review logic
- 提供 4-button、low-saturation UI

## 實作細節 (Implementation Details)

- **ID Persistence**: 使用 `nanoid(6)` 生成 `^fc-xxxxxx`。
- **Context Awareness**: 將 H1-H6 headers、parent indentation、source relationship 自動帶入 AI context。
- **Data Isolation**: 使用者原始筆記不應被 review metadata 汙染；學習狀態集中存於 `_Flashcards` 儲存層（manifest + card shards）。
- **Asset Management**:
  - AI generated images 存於 `_Flashcards/Assets/images/`
  - AI generated audio 存於 `_Flashcards/Assets/audio/`
  - `data.json` 僅記錄 relative path，不直接內嵌大型資產內容
- **Answer Highlight Theme**: 支援低對比答案底色主題，並提供顏色/透明度與套用範圍（cloze-only / mixed / all answers）設定。
- **Cloze Editor Rendering Ownership**: 編輯模式下 `==填空==` 由 plugin decoration 接管高亮樣式，非游標行隱藏語法符號並套用答案樣式，游標行保留原始語法以利編輯。
- **Single-line Answer Rendering Strategy**: 單行答案採策略式渲染（`chip` / `plain`，預設 `chip`）；`chip` 模式仍使用單一 widget 以降低符號分詞造成的高亮邊緣破碎，且需保留常見內聯語法的顯示語意（例如 wikilink alias）。
- **Cleaning Tool**: 提供 settings-based maintenance tool，可移除所有 Block ID，讓筆記回到 pure Markdown。
- **Storage Principle**: index 應優先視為可重建的 derived structure，而不是無限制膨脹的 primary schema；單卡更新應避免整包重寫。
- **Highlight Scope Control**: 答案底色應由使用者設定決定套用範圍，避免將所有語法一律強制高亮。

## 手機相容硬規範 (Mobile Compatibility Baseline)

- 自即日起，所有新增功能皆必須評估 Obsidian 手機端（iOS / Android）相容性，不得僅以桌面行為為預設。
- 每次涉及 UI / 互動 / 渲染 / 資產流程的變更，至少檢查：
  - 事件層：`pointer/touch` 相容，避免只依賴 `mousedown`。
  - UI：小螢幕可操作（按鈕尺寸、間距、排版層級）。
  - 互動：不依賴 hover；關鍵流程有可觸控替代操作。
  - 效能：長文與多卡片情境不出現明顯卡頓或過度重算。
  - 多模態：圖片/音訊在手機端可讀取、可播放、可清理。
- 若某功能本版暫不支援手機，必須在 `RoadMap.md` 與 `dev_log.md` 明確標記「暫不支援、原因、補齊版本」。

## 名詞基準 (Terminology Baseline)

### 卡片型式（5 種，中英文固定命名）

- `單行正向卡 (Single-line Forward Card)`：`正面 :: 背面`
- `單行反向卡 (Single-line Reverse Card)`：`正面 ;; 背面`
- `單行雙向卡 (Single-line Bidirectional Card)`：`正面 ::: 背面`
- `填充卡 (Cloze Card)`：`==答案==`
- `多行正向卡 (Multiline Forward Card)`：`問題 ::` + 後續縮排答案

補充：
- `{{fc ... /fc}}` 是「內嵌包裹語法」，不是第六種卡；它只是在同一行中包裹 `單行正向卡` 或 `填充卡`。
- parser 內部主型別仍維持 `forward / reverse / bidirectional / cloze`，其中多行正向卡屬於 `forward` 的多行形態。

### 答案呈現型式（4 種，中英文固定命名）

- `膠囊樣式 (chip)`：單行答案 / 填充卡
- `純文字高亮 (plain)`：單行答案 / 填充卡
- `淡色背景帶 (soft-band)`：多行/清單答案
- `右側線條 (right-rail)`：多行/清單答案

補充：
- `singleLineAnswerRenderStyle`：`chip | plain`
- `multiLineAnswerRenderStyle`：`soft-band | right-rail`

## 開發效率 SOP（Environment & Workflow）

### 變更類型對應流程

- `docs-only`（僅文件/版本欄位）
  - 命令：`npm run validate:docs`
- `core-change`（parser/editor/sync/store 等核心邏輯）
  - 命令：`npm run validate:fast`
  - 需要發版前再補：`npm run validate:prepush`
- `release`
  - 命令：`npm run release -- <version>`
  - 例如：`npm run release -- 0.1.27`

### 測試分層原則

- 快速回歸：`npm run test:fast`
- 全量回歸：`npm run test:full`
- 推送前固定：`npm run validate:prepush`

### Git Hook 原則

- `pre-commit`：只做輕量檢查（編碼/JSON），不阻塞日常提交速度
- `pre-push`：執行完整檢查（encoding + full test + build）

### Windows 開發環境便利腳本

- `npm run setup:dev-shell`：切換 PowerShell UTF-8 編碼模式
- `npm run setup:workspace-alias`：以 `subst` 建立工作路徑別名（預設 `O:`）

### 持續效率治理

- 開發過程需主動偵測效率異常（無效重測、重複 patch、token 浪費、流程重工）。
- `dev_log.md` 採「完整保存」策略，不刪減歷史內容；例行讀取預設僅讀 `Current Context Snapshot` 與最近 2~3 個版本，必要時再向前補讀。
- 若驗證命令在受限環境出現 `spawn EPERM`，先改用非沙箱重跑確認，避免錯把環境限制當成程式錯誤。
- 一旦確認為可持續問題，需提出具體修正，並同步更新 `RoadMap.md` 的「開發環境與 SOP 優化專區」。

## 當前執行原則 (Current Execution Focus)

- 優先保護 `buildability`、`sync correctness`、`note safety`
- 採用 `incremental delivery`
- 在每一步功能擴充前，先確認現有架構是否足以承接下一階段
- 修改前先確認驗證基線，修改後再執行回歸驗證

## 當前行動 (Action)

- 已完成 Sprint D 第一階段：schema migration 與 `sourcePath` / `due` in-memory index 基礎
- 已完成 Sprint D 第二階段：queue / batch 儲存策略與 benchmark/profiling
- 已完成 Sprint D 第三階段：`data.json` 改為 manifest，卡片資料改為 `Cards/<blockId>.json` 分片儲存，支援增量寫入
- 已完成答案高亮範圍多選設定：`填空`、`單行答案`、`多行答案`、`雙向卡`
- 已完成高亮渲染重構第一階段：`==填空==` 在編輯模式非游標行由 plugin decoration 接管，並處理原生高亮衝突（V0.1.12）
- 已完成高亮渲染重構第二階段（V0.1.13）：答案改為單一 chip 膠囊渲染，並補上內聯語法顯示正規化（wikilink alias / markdown link label）
- 已完成高亮渲染重構第三階段（V0.1.14）：單行答案與多行/清單答案已拆分渲染策略，並新增多行樣式選單（`淡色背景帶` / `右側線條`）；下一步銜接 Sprint E 的 Dashboard `Cards` 分區骨架
- 已完成（V0.1.18）：新增答案高亮主題自訂（主題色/透明度），並加入「各樣式獨立顏色」勾選欄位；同步完成設定頁主次標題對齊修正
- 已完成（V0.1.19）：設定頁改為分頁式結構（一般/答案高亮/AI/維護工具），並完成編碼治理（`.editorconfig`、`.gitattributes`、UTF-8 無 BOM 一致化）
- 已完成（V0.1.20）：抽離 `FlashcardsAppService` 作為 Action Layer，並為 `FlashcardSyncService` 補上 Sync State Layer（`idle/syncing/error`、`activeJobs`、`lastSyncedAt`、`lastError` 與 listener API）
- 已完成（V0.1.21）：高亮編輯顯示觸發改為「僅點擊答案高亮區塊才 reveal」，並修正多行/清單答案點擊高亮後未顯示 Block ID。
- 已完成（V0.1.25）：單行答案渲染改為 strategy layer，支援 `chip / plain` 切換並保留 `soft-band / right-rail` 多行樣式分工。
