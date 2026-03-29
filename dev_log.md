# 開發者日誌 (Developer Log)

本文件記錄專案所有的版本更動、架構調整與重要事件。

## V0.1.15 — 答案高亮行層級覆蓋修正 (2026-03-30)

### 修正
- **Line-level 覆蓋策略**：`src/editor/AnswerHighlighter.ts` 針對所有有答案高亮的行新增 `fc-answer-highlight-line` decoration，讓 CSS 可從整行容器層級覆蓋內部所有 `cm-highlight` 相關節點。
- **Selector 擴充**：`src/styles/main.css` 新增 `.fc-answer-highlight-line .cm-highlight`、`.cm-formatting-highlight` 與相關 descendant 規則，避免 `==填空==` 在答案高亮行中仍殘留原生黃底。
- **Build 白名單同步**：`esbuild.config.mjs` 新增 `.cm-editor .fc-answer-highlight-line` ignored selector，確保這批新規則在打包後保持全域作用。

### 文件同步
- **Manual 更新**：補充答案高亮行層級覆蓋機制說明（V0.1.15）。

### 驗證
- **型別檢查**：`npx tsc --noEmit` 通過。
- **測試**：`npm test` 通過，共 31 項測試。
- **建置**：`npm run build` 通過。

---

## V0.1.14 — 內層原生高亮覆蓋補強 (2026-03-30)

### 修正
- **內層 highlight class 全面接管**：`src/styles/main.css` 進一步將 `.fc-answer-highlight` 內的 `.cm-highlight`、`.cm-formatting-highlight` 與其他 `cm-highlight` 相關子節點統一改套外掛底色，避免答案高亮範圍內再次露出 Obsidian 原生黃底。
- **背景覆蓋強化**：同時覆蓋 `background`、`background-color`、`background-image`、`box-shadow`，降低不同主題或語法 token class 對高亮視覺的一致性干擾。

### 文件同步
- **Manual 更新**：補充答案高亮範圍內的內層 `==填空==` 高亮覆蓋補強說明（V0.1.14）。

### 驗證
- **型別檢查**：`npx tsc --noEmit` 通過。
- **測試**：`npm test` 通過，共 31 項測試。
- **建置**：`npm run build` 通過。

---

## V0.1.13 — 編輯器高亮覆蓋與邊框樣式修正 (2026-03-30)

### 修正
- **原生高亮覆蓋補強**：`src/styles/main.css` 新增 `.fc-answer-highlight.cm-highlight` 規則，確保當 CodeMirror 將 `fc-answer-highlight` 與 `.cm-highlight` 套在同一個元素時，仍由外掛底色接管，不再露出 Obsidian 原生黃底。
- **邊框視覺收斂**：編輯模式的答案高亮取消膠囊式 padding，並將圓角降到接近直角，減少因字體/符號切段造成的毛毛蟲狀邊框。
- **Build selector 白名單修正**：`esbuild.config.mjs` 將 `.cm-editor .fc-answer-highlight*` 納入 `ignoredSelectors`，避免新的覆蓋規則在打包時再次被前綴污染。

### 文件同步
- **Manual 更新**：補充編輯模式高亮覆蓋與平直樣式調整說明（V0.1.13）。

### 驗證
- **型別檢查**：`npx tsc --noEmit` 通過。
- **測試**：`npm test` 通過，共 31 項測試。
- **建置**：`npm run build` 通過。

---

## V0.1.12 — 語法自動隱藏與高亮主題修正 (2026-03-30)

### 新增
- **答案語法自動隱藏**：在 `src/editor/answerHighlightRules.ts` 新增 `collectAnswerSyntaxHideRanges`，支援 `::`、`;;`、`:::`、`問題 ::` 的語法位置判定。
- **Editor 自動隱藏行為**：`src/editor/AnswerHighlighter.ts` 新增語法隱藏 decoration；游標離開行時自動隱藏語法、回到該行時還原顯示。
- **高亮主題設定**：`FlashcardsPluginSettings` 新增 `answerHighlightColor`、`answerHighlightOpacity`，並在 `FlashcardsSettingTab` 提供色彩選擇器、透明度滑桿與重設按鈕。

### 架構調整
- **主題變數集中管理**：`src/main.ts` 新增 `applyAnswerHighlightThemeVariables()`，以 CSS 變數統一控制高亮底色與透明度，設定變更即時生效。
- **高亮衝突修正**：`src/styles/main.css` 新增 `.fc-answer-highlight .cm-highlight` 覆蓋規則，避免 Obsidian 原生 `== ==` 黃底蓋掉外掛高亮。
- **樣式作用域修正**：`esbuild.config.mjs` 更新 `ignoredSelectors`，確保主題變數與衝突修正規則不被 `#fc-plugin-root` 前綴污染。

### 文件同步
- **RoadMap 更新**：`Sprint F` 新增並標記完成 `語法離行隱藏`、`高亮主題設定`、`== == 重疊衝突修正`（2026-03-30，V0.1.12）。
- **Instruction 更新**：補充 `Syntax Visibility Rule` 與 `Highlight Conflict Guard` 實作原則。
- **Manual 更新**：新增語法自動隱藏、高亮主題設定與高亮衝突修正說明。

### 驗證
- **型別檢查**：`npx tsc --noEmit` 通過。
- **測試**：`npm test` 通過，共 31 項測試（含新增語法隱藏規則測試）。
- **建置**：`npm run build` 通過。

---

## V0.1.11 — 答案高亮範圍多選設定 (2026-03-29)

### 新增
- **答案高亮範圍設定**：在 `src/settings/FlashcardsSettingTab.ts` 新增可重複多選的設定項目，支援 `填空`、`單行答案`、`多行答案`、`雙向卡`。
- **高亮規則模組**：新增 `src/editor/answerHighlightRules.ts` 與對應測試 `answerHighlightRules.test.ts`，集中管理各類語法的答案區段判定。
- **Editor 高亮 Extension**：新增 `src/editor/AnswerHighlighter.ts`，依設定範圍對答案區段加上 `fc-answer-highlight` decoration。

### 架構調整
- **設定模型擴充**：`FlashcardsPluginSettings` 新增 `answerHighlightScopes`，預設為 `["cloze"]`，維持現有體驗不突變。
- **樣式責任收斂**：`src/styles/main.css` 不再直接依賴 `.cm-highlight`，改為插件專屬的 `.fc-answer-highlight` class，避免誤影響一般 Markdown highlight。
- **設定即時生效**：`src/main.ts` 在儲存設定後呼叫 `workspace.updateOptions()`，讓 editor extension 可反映最新勾選項目。

### 文件同步
- **RoadMap 更新**：`Sprint F` 已納入答案高亮主題與套用範圍設定規劃。
- **Instruction 更新**：新增 `Answer Highlight Theme` 原則，明確定義範圍選項。
- **Manual 更新**：補充使用者可於設定頁多選答案高亮範圍（V0.1.11）。

### 驗證
- **型別檢查**：`npx tsc --noEmit` 通過。
- **測試**：`npm test` 通過，新增答案高亮規則測試。
- **建置**：`npm run build` 通過。

---

## V0.1.10 — 回到 V0.1.9 基線後重做視覺與觸發體驗 (2026-03-29)

### 架構調整
- **版本基線回退**：先將 `V0.1.10 ~ V0.1.12` 以 revert 方式回到 `V0.1.9` 架構，再以最小變更重做需求，避免樣式試驗歷史持續疊加。
- **Block ID 觸發即時化（保留）**：`src/blockid/BlockIdManager.ts` 移除 `500ms debounce`，改為下一個事件迴圈即時檢查游標離行（`setTimeout(..., 0)` + 防重入）。
- **Cloze 樣式重做**：`src/styles/main.css` 新增低對比淺灰膠囊樣式（`mark` / `.cm-highlight`），降低刺眼感。
- **樣式作用範圍修正**：`esbuild.config.mjs` 的 `PrefixWrap` 新增 `ignoredSelectors`，確保 cloze 樣式不被包進 `#fc-plugin-root` 而失效。

### 文件同步
- **Manual 更新**：新增 `==填空==` 低對比淺灰樣式說明，並註記 Block ID 即時附加行為（V0.1.10）。

### 驗證
- **型別檢查**：`npx tsc --noEmit` 通過。
- **測試**：`npm test` 通過，共 22 項測試。
- **建置**：`npm run build` 通過。

---

## V0.1.9 — Sprint D 第三階段：分片儲存與增量寫入 (2026-03-29)

### 新增
- **Sharded Storage Helper**：新增 `src/store/shardedStorage.ts` 與 `shardedStorage.test.ts`，統一定義 manifest 格式與 `Cards/<blockId>.json` 路徑規則。
- **儲存基準測試補強**：新增 `FlashcardStorage.bench.ts`，比較「整包 `data.json` 重寫」與「單卡 + manifest 寫入」成本。

### 架構調整
- **Repository 分片落地**：`FlashcardRepository` 改為 `data.json` manifest + `Cards/*.json` 卡片分片讀寫模型。
- **load 流程升級**：支援舊版整包資料自動遷移至分片儲存；若 manifest/card schema 需正規化，會自動重寫新格式。
- **save 流程增量化**：僅寫入 dirty card 檔案、刪除已刪卡片檔案，再更新 manifest，避免每次小變更都重寫全量資料。
- **一致性修正**：`removeCardsBySourcePath` / `removeMissingCardsFromSource` 改為走 `deleteCard` 流程，確保分片檔刪除與 manifest 更新一致。

### 文件同步
- **RoadMap 更新**：`Sprint D` 的「避免整包重寫」與「repository 分片 storage layout」標註為 `2026-03-29，V0.1.9` 已完成。
- **Instruction 更新**：`Persistence Layer` 明確改為 sharded storage，並將當前行動切換至 Sprint E（Dashboard Workspace Cards 分區）。
- **Manual 更新**：補充分片儲存結構說明（`data.json` manifest + `Cards/*.json`）。

### 驗證
- **型別檢查**：`npx tsc --noEmit` 通過。
- **測試**：`npm test` 通過，共 22 項測試。
- **Benchmark**：`npm run benchmark:store` 通過；`sharded-single-card-plus-manifest-stringify-5k` 約為 `legacy-full-data-json-stringify-5k` 的 **24.75x**。
- **建置**：`npm run build` 通過。

---

## V0.1.8 — Sprint D 第二階段：Save Queue 與 Benchmark (2026-03-29)

### 新增
- **SaveQueue 抽象**：新增 `src/store/SaveQueue.ts`，提供 `queue` / `saveNow` / `flush` / `runInBatch`，作為儲存排程的共用機制。
- **Benchmark 腳本與基準檔**：新增 `benchmark:store` 指令與 `FlashcardIndex.bench.ts`，可量測 1k / 5k 卡片下的 reindex 與 query workload。
- **測試補強**：新增 `DataStoreSaveQueue.test.ts`（實際驗證 `SaveQueue` debounce 與 batch flush 行為）。

### 架構調整
- **DataStore 儲存流程重構**：`DataStore` 改由 `SaveQueue` 管理儲存節流與序列化寫入，`save()` 保留即時落盤語意，新增 `queueSave` / `flushQueuedSave` / `runInSaveBatch`。
- **Sync 流程批次化**：`FlashcardSyncService` 在檔案修改、rename、delete 與 `syncVault()` 改用 queue/batch 儲存策略，降低高頻寫入成本。
- **Unload 安全收尾**：`main.ts` 在 `onunload` 觸發 `flushQueuedSave()`，降低尚未落盤的風險。

### 文件同步
- **RoadMap 更新**：`Sprint D` 的 `sync/save queue or batch` 與 `benchmark/profiling` 標註為 `2026-03-29，V0.1.8` 已完成。
- **Instruction 更新**：同步當前行動，明確聚焦 Sprint D 第二階段收尾與後續方向。

### 驗證
- **型別檢查**：`npx tsc --noEmit` 通過。
- **測試**：`npm test` 通過，共 19 項測試。
- **Benchmark**：`npm run benchmark:store` 通過（5k query workload 約 98 hz，mean 約 10.20ms）。
- **建置**：`npm run build` 通過，並成功複製到 Obsidian Vault 外掛目錄。

---

## V0.1.7 — Sprint D 第一階段：Migration 與索引基礎 (2026-03-29)

### 新增
- **Schema Migration**：新增 `src/store/migrations.ts`，在 repository `load()` 階段自動正規化舊資料、修補缺欄位並升級 schema version。
- **In-Memory Index**：新增 `src/store/FlashcardIndex.ts`，建立 `sourcePath` 與 `due` 查詢索引，降低常用查詢的全量掃描成本。
- **測試擴充**：新增 `migrations.test.ts` 與 `FlashcardIndex.test.ts`，驗證資料遷移與索引更新邏輯。

### 架構調整
- **資料版本升級**：`FLASHCARD_DATA_VERSION` 由 `1.0.0` 提升至 `1.1.0`，由 migration 機制統一管理升級。
- **Repository 查詢加速**：`FlashcardRepository` 改為索引驅動查詢（`getCardsBySourcePath` / `getDueCards`），同步在 upsert/delete/rename/remove 流程維護索引一致性。
- **DataStore due 查詢改走索引**：`DataStore.getDueCards()` 改為透過 repository due index 取值。

### 文件同步
- **RoadMap 更新**：`Sprint D` 狀態改為「進行中」，並將 migration 與 `sourcePath` / `due` in-memory index 標註為 `2026-03-29，V0.1.7` 已完成。

### 驗證
- **型別檢查**：`npx tsc --noEmit` 通過。
- **測試**：`npm test` 通過，共 17 項測試。

---

## V0.1.6 — 維護工具與測試補強 (2026-03-29)

### 新增
- **Block ID 清理工具**：新增 `BlockIdCleanupService`，可批次移除 Vault 內所有 `^fc-xxxxxx`，並在清理後自動重建索引。
- **清理入口**：新增 command / ribbon / settings button，提供一鍵清理 Block ID 的維護操作。
- **AI 設定預留欄位**：於 settings schema 與設定頁新增 `aiEnabled`、`aiProvider`、`aiModel`、`aiApiKey`。
- **測試補強**：新增 `blockIdRules.test.ts`、`blockIdCleanup.test.ts`，並擴充 `FlashcardSyncEngine` 測試覆蓋多行卡與填空卡同步一致性。

### 架構調整
- **Block ID 決策邏輯抽離**：新增 `blockIdRules`，將 `hasBlockId`、`appendBlockId`、on-blur 附加判斷改為可獨立測試的純邏輯。
- **清理邏輯抽離**：新增 `blockIdCleanup` 純函式模組，將 markdown 清理規則與 Obsidian I/O 解耦。
- **Runtime 組裝擴充**：在 runtime 中註冊 `blockIdCleanupService`，供 UI 與設定頁共用，避免清理流程重複實作。
- **前後測試流程明文化**：將「修改前確認基線、修改後執行回歸驗證」納入 `SKILL.md` 工作流程規則，作為固定品質守門步驟。

### 文件同步
- **RoadMap 更新**：將 Sprint A/B/C 本次完成項目標註為 `2026-03-29，V0.1.6`（Block ID 測試、同步一致性、AI 設定預留、清理工具）。
- **Manual 更新**：新增設定頁與維護工具章節，補充 `V0.1.6` 新增的 AI 預留設定與 Block ID 清理功能。
- **Instruction 語系與規格重整**：將 `Instruction.md` 改為中文主體 + 專業英文術語版本，並明確定義 AI image/audio 資產路徑。
- **使用者手冊正名**：將 `Mannual.md` 正名為 `Manual.md`，並同步修正專案內文件引用。
- **Instruction / RoadMap 分工明文化**：新增規則，`Instruction.md` 專責產品方向、架構原則與功能規格，避免與 `RoadMap.md` 的時程與 sprint 狀態重複；未來若規劃方向變更，需同步更新 `Instruction.md`。
- **Instruction milestone 同步規則補充**：新增規則，若 `Instruction.md` 的 milestones 有新增規劃、優先順序調整，或完成／未完成狀態修正，也必須同步更新。
- **SKILL / Instruction 去重整理**：收斂 `SKILL.md` 中與 `Instruction.md` 重複的產品規格內容，改以 `Instruction.md` 作為產品方向與功能規格的單一主要來源，讓文件分工更清楚。

### 驗證
- **型別檢查**：`npx tsc --noEmit` 通過。
- **測試**：`npm test` 通過，共 11 項測試。
- **建置**：`npm run build` 通過，並成功複製到 Obsidian Vault 外掛目錄。

---

## V0.1.5 — 架構補強與同步層重整 (2026-03-29)

### 新增
- **FlashcardSyncEngine / FlashcardSyncService**：建立獨立同步層，支援單檔同步、整庫重建索引、檔案修改後自動同步、檔案重新命名同步與刪除清理。
- **Plugin Settings Tab**：新增外掛設定頁，提供資料目錄與自動同步開關。
- **整庫重建指令與 Ribbon**：新增整個 Vault 的閃卡索引重建入口，方便維護與救援同步狀態。
- **基礎測試**：新增 `FlashcardParser`、`FsrsScheduler`、`FlashcardSyncEngine` 的 Vitest 測試。

### 架構調整
- **DataStore 分責**：將資料讀寫拆到 `FlashcardRepository`，將複習排程拆到 `FsrsScheduler`，保留 `DataStore` 作為較薄的 facade。
- **主程式瘦身**：`src/main.ts` 改為 composition root，將 UI 註冊、同步邏輯與設定入口交由獨立模組負責。
- **Preview Block ID 清理拆模組**：將閱讀模式的 Block ID 清理邏輯抽出為獨立 register helper，降低主入口耦合。
- **設定抽象化**：新增 `FlashcardsPluginSettings` 與預設值定義，避免資料目錄等配置散落在核心模組中。
- **文件流程補充**：明確規範 `Manual.md` 需隨開發變更同步更新，與 `RoadMap.md`、`dev_log.md` 一起維持動態一致。
- **Skill 演化理念明文化**：補充 `SKILL.md` 為可持續演化的專案規範，要求隨著專案優化與流程成熟持續完善。
- **效率與整潔標準明文化**：補充 `SKILL.md`，明確要求程式碼需兼顧效能、乾淨分層、低耦合與可維護性。
- **效能風險納入規劃**：將大量閃卡下的資料索引、整包寫入與同步成本風險正式納入 `RoadMap.md`，並提升為較前面的高優先規劃項目，暫不執行。
- **Index 演化原則定案**：確認未來新增的查詢 index 應視為可重建的衍生結構，主資料 schema 維持穩定並預留 migration 機制，已同步補入 `RoadMap.md` 的 Sprint D。
- **Dashboard 策略定案**：確認不採用 Obsidian Bases 作為卡片主管理來源，改採外掛內建單一 `Dashboard Workspace`，並在同一 UI 入口整合 `Cards`（管理）與 `Insights`（分析）分區，已同步納入 `RoadMap.md`。
- **架構前置檢查流程明文化**：新增規則，未來每次推進下一個開發步驟前，都需先檢查目前架構是否足以承接；若有明顯缺口，應先補強再繼續開發，已同步寫入 `SKILL.md`。

### 驗證
- **型別檢查**：`npx tsc --noEmit` 通過。
- **測試**：`npm test` 通過，共 5 項測試。
- **建置**：`npm run build` 通過，並成功複製到 Obsidian Vault 外掛目錄。

---

## V0.1.4 — 開發交接紀錄 (2026-03-29)

### 事件
- **文件理解確認**：已重新閱讀並確認 `Manual.md`、`Instruction.md`、`RoadMap.md`、`dev_log.md`、`manifest.json`、`package.json`，用於建立目前專案目標、里程碑與既有實作脈絡。
- **開發權責交接**：先前階段由 Antigravity 的 Claude 4.6 Opus 協助處理；自本日（2026-03-29）起，後續開發與維護交由 Codex 接手。
- **專案 Skill 正式化**：將 `.codex/skill/SKILL.txt` 升級整理為正式的 `.codex/skill/SKILL.md`，補上 YAML frontmatter、結構化規範與 `RoadMap.md` 的動態維護要求。
- **專案 Skill 中文化**：將 `.codex/skill/SKILL.md` 改為中文主體撰寫，並保留關鍵技術詞英文，以提升可讀性且維持執行精準度。
- **Skill 演化流程補充**：新增規則，當開發過程中出現對流程、品質、文件維護或交接非常關鍵的規則時，Codex 應主動提醒是否需要同步調整 `SKILL.md`。

### 目前理解
- **專案目標**：打造一套 Obsidian 外掛，將 Markdown 語法轉為可複習的閃卡系統，結合 Block ID、FSRS、AI 豐富化與嚴格 CSS 隔離。
- **延續原則**：維持既有的「資料至上、樣式隔離、隱形標記、智慧觸發、Notion/RemNote 風格」方向持續推進。

---

## V0.1.3 — 側邊欄捷徑按鈕 (2026-03-25)

### 新增
- **左側功能區 (Ribbon) 圖示**：新增三個按鈕，提供一鍵「掃描閃卡」、「開始複習」、「顯示統計」的快速操作。

---

## V0.1.2 — 隱藏閱讀模式 Block ID (2026-03-25)

### 修正
- **閱讀模式 Block ID 隱藏**：註冊 Obsidian 的 `MarkdownPostProcessor`，精準過濾並隱藏渲染後的 `^fc-xxxxxx`（自動避開程式碼區塊）。

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
