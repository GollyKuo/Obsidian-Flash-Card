# 開發指令 (Instruction)

## 版本

- `v1.4`

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
- **Answer Chip Rendering**: 答案顯示採單一 chip widget，降低符號分詞造成的高亮邊緣破碎；chip 文字需保留常見內聯語法的顯示語意（例如 wikilink alias）。
- **Cleaning Tool**: 提供 settings-based maintenance tool，可移除所有 Block ID，讓筆記回到 pure Markdown。
- **Storage Principle**: index 應優先視為可重建的 derived structure，而不是無限制膨脹的 primary schema；單卡更新應避免整包重寫。
- **Highlight Scope Control**: 答案底色應由使用者設定決定套用範圍，避免將所有語法一律強制高亮。

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
