# RoadMap

## 目前狀態
> 記錄規則：自即日起，新增的完成時間一律使用 `YYYY-MM-DD HH:mm`（24 小時制）；既有歷史紀錄不追溯修改。

目前專案已完成可用原型，已有下列基礎能力：

- Markdown 閃卡語法解析
- On Blur 自動附加 Block ID
- 自動同步單檔 / 整庫重建閃卡索引
- `_Flashcards/data.json` manifest + `_Flashcards/Cards/*.json` 分片儲存
- Plugin settings tab 與資料目錄設定
- AI 設定預留欄位與維護工具（含 Block ID 清理）
- Schema migration 與查詢 in-memory index（sourcePath / due）
- FSRS 複習排程
- Review Modal 與基本指令 / Ribbon 操作
- 基礎單元測試與 build / test 驗證流程

目前較大的缺口已轉向「大規模卡片量下的效能與儲存縮放、清理工具、進階學習體驗、HUD 狀態提示與 AI 豐富化主線」。

## 術語基準（文件同步）

為避免規劃、實作與文件命名不一致，後續統一使用以下中英文名稱：

- 卡片型式（5 種）
  - `單行正向卡 (Single-line Forward Card)`
  - `單行反向卡 (Single-line Reverse Card)`
  - `單行雙向卡 (Single-line Bidirectional Card)`
  - `填充卡 (Cloze Card)`
  - `多行正向卡 (Multiline Forward Card)`
- 答案呈現型式（4 種）
  - `膠囊樣式 (chip)`
  - `純文字高亮 (plain)`
  - `淡色背景帶 (soft-band)`
  - `右側線條 (right-rail)`

補充規則：
- `{{fc ... /fc}}` 為內嵌包裹語法，不獨立算一種卡片型式。
- 若未來新增型式或重新命名，需同步更新 `Manual.md`、`Instruction.md`、`RoadMap.md`。

## 開發環境與 SOP 優化專區（Efficiency Ops）

目標：降低開發過程中的等待時間、重工與無效驗證成本，讓「日常迭代快、發版前嚴格、流程可重複」成為固定節奏。

- Step 1：一鍵發版流程（已完成：2026-04-01 09:08，待下版發佈）
  - 新增 `scripts/release.js`（`npm run release -- <version>`）
  - 固定流程：`validate:prepush -> npm version -> manifest version sync -> git add/commit`（可選 `--push`）
- Step 2：測試分層與回歸核心集（已完成：2026-04-01 09:08，待下版發佈）
  - 新增 `test:fast`（parser/highlight/block id 核心回歸）
  - 新增 `test:full`（全量）
  - 新增 `validate:fast`、`validate:prepush` 腳本，減少日常全量測試浪費
- Step 3：提交/推送雙層檢查（已完成：2026-04-01 09:08，待下版發佈）
  - `pre-commit` 保持輕量（文件編碼與 JSON 檢查）
  - 新增 `pre-push` 重檢查（`validate:prepush`）
- Step 4：變更類型 SOP 對應表（已完成：2026-04-01 09:08，待下版發佈）
  - docs-only、核心邏輯、發版三種流程對應固定驗證命令
  - 減少「每次都跑過多測試」與「漏跑必要驗證」的雙重風險
- Step 5：Windows 開發環境便利化（已完成：2026-04-01 09:08，待下版發佈）
  - 新增 `setup:dev-shell`：一鍵切換 PowerShell UTF-8（降低亂碼風險）
  - 新增 `setup:workspace-alias`：快速建立 `subst` 路徑別名（縮短長路徑操作）
- Step 6：效率監控治理（進行中）
  - 開發過程主動偵測效率不佳訊號（例如：無效重測、流程重工、token 浪費）
  - 若測試在受限環境出現 `spawn EPERM` 類型錯誤，先以非沙箱重跑確認，避免把環境問題誤判為程式回歸
  - 發現後主動提出「可執行修正」並同步回寫到本專區，形成持續優化迴圈

---

## 近期優先級

### Sprint A: Alpha 穩定化（進行中）

目標：先把核心流程做穩，讓外掛可以開始被長時間使用。

- 建立測試基礎（已完成：2026-03-29，V0.1.5）
- 補齊 `FlashcardParser` 的語法測試（已完成：2026-03-29，V0.1.5）
- 補齊 `DataStore` / FSRS 更新測試（已完成：2026-03-29，V0.1.5，現階段以 `FsrsScheduler` 測試為主）
- 補齊 Block ID 自動附加邏輯測試（已完成：2026-03-29，V0.1.6）
- 確認 build / test 流程與最小驗證標準（已完成：2026-03-29，V0.1.5）

### Sprint B: 同步完整化（進行中）

目標：讓卡片資料與筆記內容之間維持可靠同步。

- 支援整庫掃描，不只掃描目前檔案（已完成：2026-03-29，V0.1.5）
- 補上刪除卡片的清理策略（已完成：2026-03-29，V0.1.5）
- 補上檔案改名 / 搬移後的來源同步（已完成：2026-03-29，V0.1.5）
- 確認多行卡片、填空卡片與 Block ID 的同步一致性（已完成：2026-03-29，V0.1.6）
- 評估是否需要「重新建立索引」指令（已完成：2026-03-29，V0.1.5，已新增整庫重建指令）

### Sprint C: 設定頁與維護工具（進行中）

目標：補上使用者可控制的入口，降低日後維護成本。

- 建立 plugin settings tab（已完成：2026-03-29，V0.1.5）
- 加入資料目錄設定（已完成：2026-03-29，V0.1.5）
- 加入 AI 設定預留欄位（已完成：2026-03-29，V0.1.6）
- 加入清理工具：移除所有 `^fc-xxxxxx` Block ID（已完成：2026-03-29，V0.1.6）
- 加入手動重掃 / 重建資料的維護操作（已完成：2026-03-29，V0.1.5）
- 設定頁改為分頁式介面（一般 / 答案高亮 / AI / 維護工具）（已完成：2026-03-31，V0.1.19）
- 建立編碼治理基線（`.editorconfig`、`.gitattributes`、UTF-8 無 BOM 一致化）（已完成：2026-03-31，V0.1.19）
- 後續補強：抽離 Settings / Plugin State Layer，將設定正規化、DOM class 套用、theme variable 套用從 `main.ts` 分離（規劃中）

### Sprint D: 效能與儲存縮放優化（高優先，進行中）

目標：在閃卡數量大幅成長前，先規劃好資料索引、存檔策略與同步成本控制，避免未來卡片量一多就拖慢整體體驗。

- 將 index 視為可重建的衍生結構，避免把所有查詢欄位直接寫死進主資料模型（已完成：2026-03-29，V0.1.7）
- 保持主資料 schema 穩定，並預留 migration 機制以支援未來新增欄位（已完成：2026-03-29，V0.1.7）
- 建立 `sourcePath` / `due` 等常用查詢的 in-memory index（已完成：2026-03-29，V0.1.7）
- 避免每次小變更都整包重寫 `_Flashcards/data.json`（已完成：2026-03-29，V0.1.9）
- 將 sync / save 流程改為 queue 或 batch 化（已完成：2026-03-29，V0.1.8）
- 補上大量卡片情境下的 benchmark / profiling（已完成：2026-03-29，V0.1.8）
- repository 分片儲存落地（`data.json` manifest + `Cards/<blockId>.json`）（已完成：2026-03-29，V0.1.9）
- 規劃已納入：2026-03-29，V0.1.5

### Sprint D.5: 架構補強（Sprint E 前置）（進行中）

目標：在 Dashboard Workspace 進場前，先降低 UI 與資料流程耦合，並補上同步狀態層，避免後續擴充時回頭拆大樑。

- Step 1：抽離 Action Layer（`FlashcardsAppService`），將 command/ribbon 的業務流程集中管理（已完成：2026-03-31 13:49，V0.1.20）
- Step 2：新增 Sync State Layer（`idle/syncing/error` + activeJobs + lastSyncedAt/lastError + listener），提供後續 Dashboard/HUD 狀態來源（已完成：2026-03-31 13:49，V0.1.20）
- Step 3：建立 Cards Query Layer，提供 Dashboard `Cards` 分區所需的搜尋、篩選、排序、來源分組與 due/sync 衍生查詢（規劃中）
- Step 4：補強 Settings / Plugin State Layer，避免 `main.ts` 持續承擔設定驗證與副作用套用（規劃中）
- Step 5：為 derived indexes 預留擴充點，讓來源健康度、標籤、群組摘要、到期統計可在不改 primary schema 的前提下逐步加入（規劃中）
- Step 6：補強 sync orchestration，逐步加入 job coalescing、增量更新、背景索引重建入口，避免大量檔案變動時同步壅塞（規劃中）

---

## 中期計畫

### Sprint E: Dashboard Workspace（整合式）

目標：以單一 UI 入口整合卡片管理與學習分析，不拆成兩個分離 dashboard。

- 建立統一 Dashboard Workspace（單一入口）
- 第一階段：先完成 `Cards` 與 `Insights` 的工作區骨架與導航
- `Cards` 分區的功能與資料模型細節，統一由「V0.2：卡片庫管理系統主線」維護
- 與資料層保持分責：UI 可整合，但管理查詢與分析查詢維持模組邊界
- 規劃已納入：2026-03-29，V0.1.5（先加入 RoadMap，尚未執行）

### Sprint E.5: 大規模卡片量性能與延遲控制（高優先，規劃中）

目標：在大量筆記與大量卡片情境下，維持 `Cards` 分區、同步與複習流程的可用性與低延遲，避免 V0.2 之後再進行高成本回補。

- 本節性能細項已整併至「V0.2-P3 / V0.2-P4」，避免多處重複維護
- 本節保留定位：提醒在 V0.2 完成前，性能補強不可後置

### Sprint F: 學習體驗強化

目標：讓複習流程更接近真正可日用的學習工具。

- 本節保留「複習體驗」里程碑定位
- 複習閃卡呈現樣式（答案渲染策略 / 主題 / 互動顯示）細節已整併至「V0.4：複習閃卡呈現樣式主線」
- 本節仍追蹤與排程/鍵盤/摘要等流程體驗相關項目

### Sprint G: 行尾 HUD / 狀態提示

目標：實作文件中規劃的 Notion 風格學習狀態提示。

- 以 CM6 View Plugin 顯示行尾 mastery icon
- 依卡片狀態顯示 new / due / review / overdue
- 加入過期過久的琥珀色提醒
- 評估與 AI enrich 按鈕共存的 UI 形式

---

## V0.2：卡片庫管理系統主線（整合規劃）

目標：先完成可日常使用的卡片庫管理能力，再進入 V0.3 的 AI 強化，避免流程倒掛。
本章為 V0.2 卡片庫管理系統的唯一主規劃來源；Sprint 區塊僅保留摘要與里程碑定位。

### V0.2 範圍（整併自 Sprint E / Sprint E.5）

- `Cards` 分區第一版 UI：搜尋、篩選、排序、來源跳轉、due/sync 狀態
- 檢視模式切換：`分組檢視`（預設）與 `列表檢視`
- `Cards Query Layer`：避免 UI 直接耦合 `DataStore` / `FlashcardRepository`
- 來源健康度模型：來源筆記已移動、已遺失、已失聯等可見提示
- 標籤雙來源模型：`inheritedTags`、`cardTags`、`effectiveTags`
- 單卡標籤主儲存：`_Flashcards/Cards/<blockId>.json`（不污染原始筆記）
- 大量資料性能策略：derived index、lazy expand、virtualization、增量同步、job coalescing

### V0.2 分階段優先級

- V0.2-P0：`Cards Query Layer` + 來源健康度模型 + `inheritedTags / cardTags / effectiveTags` 查詢出口
- V0.2-P1：`Cards` 分區 UI 第一版（分組檢視預設、列表檢視切換、搜尋、篩選、排序、來源跳轉）
- V0.2-P2：批次標籤操作、群組統計、細節抽屜／卡片詳情面板
- V0.2-P3：性能補強（虛擬清單、延遲載入、group lazy expand、derived tag/source indexes）
- V0.2-P4：benchmark/profiling 基線與延遲門檻，作為後續擴充的進入條件

### V0.2 與 V0.3 邊界

- V0.2 先完成卡片管理核心與性能底座
- V0.3 再承接 AI enrich、批次 AI、多模態資產

### V0.2 與 V0.4 邊界

- V0.2 聚焦「卡片庫管理」：查詢、分組、標籤、來源健康度、資料與效能模型
- V0.4 聚焦「複習呈現樣式」：複習時卡片/答案如何顯示與互動，不混入卡片庫管理資料模型

---

## V0.3：AI 功能主線（整合規劃）

目標：將「AI enrich、批次處理、多模態資產」集中為同一版主題，避免規劃分散在不同 Sprint。
本章為 V0.3 AI 規劃主來源；與 AI 相關的 Sprint 僅作歷史對照（Sprint H/I）。

### V0.3 前置條件（已完成，來自 V0.1.x）

- AI 設定預留欄位（已完成：2026-03-29，V0.1.6）
- 設定頁分頁包含 AI 分頁（已完成：2026-03-31，V0.1.19）
- 卡片分片儲存架構已就位（`_Flashcards/Cards/<blockId>.json`），可承接 AI enrichment 欄位
- HUD 區塊已預留「與 AI enrich 按鈕共存」的 UI 評估項目（Sprint G）

### V0.3 AI 能力清單（全量納入）

1. 卡片優化建議：檢查題幹與答案品質，提供可記憶化改寫建議
2. 自動產卡候選：由段落抽取單行卡/填充卡候選，採「建議清單」而非直接覆寫
3. 標籤建議：根據卡片內容推薦 `cardTags`，由使用者確認後套用
4. 難度與認知負荷評估：估計卡片難度並建議拆卡/合卡
5. 干擾選項生成：為單卡生成常見誤答，強化回想訓練
6. 複習前重點摘要：針對當日到期卡片生成預熱摘要
7. 錯題回顧分析：聚合常錯卡片並產出盲點主題建議
8. 多模態延伸：圖片/音訊輔助與 OCR 流程整合

### V0.3 互動模式規劃（Auto + Manual + Hybrid）

- `AI Auto`：AI 自動判斷內容類型並推薦協助流程
- `Manual Select`：使用者可勾選需要的 AI 協助項目（可覆蓋 AI 判斷）
- `Hybrid`（建議預設）：先由 AI 推薦，再由使用者確認後執行
- 規則：Manual 優先級高於 Auto；Hybrid 以「使用者最終勾選」作為執行依據

### V0.3 開發先後順序（依建議）

1. 卡片優化建議
2. 自動產卡候選
3. 標籤建議
4. 難度與認知負荷評估
5. 複習前重點摘要
6. 錯題回顧分析
7. 干擾選項生成
8. 多模態延伸

### V0.3-P1（原 Sprint H）：單卡 AI 豐富化（先做）

目標：先落地低風險、高價值且不污染原始筆記的 AI 能力。

- 針對單張卡片觸發 AI enrich
- 傳入標題、縮排父層與卡片內容作為 context
- 優先落地：卡片優化建議、自動產卡候選、標籤建議
- 補充落地：難度評估與拆卡/合卡建議
- 互動模式先落地：`Hybrid`（預設） + `Manual Select`（覆蓋）
- 將結果寫入對應卡片儲存檔（`_Flashcards/Cards/<blockId>.json`）

### V0.3-P2：學習分析與回顧增強

目標：在單卡能力穩定後，補強整體複習流程的 AI 輔助價值。

- 複習前重點摘要（到期卡片預熱）
- 錯題回顧分析（盲點主題建議）
- 干擾選項生成（進階回想訓練）
- 導入內容類型路由（文章/段落、單字、術語、流程）以強化 Auto 判斷品質

### V0.3-P3（原 Sprint I）：批次 AI 與多模態

目標：擴展 AI 流程，但不破壞目前穩定核心。

- 支援批次請求 AI enrich
- 整合圖片轉卡片 / OCR 流程
- 將 AI 生成資產分流存入 `_Flashcards/Assets/images/` 與 `_Flashcards/Assets/audio/`
- 設計失敗重試與模型切換機制
- 補齊 `AI Auto` 完整自動模式（含批次任務）與可追蹤的覆蓋紀錄

### V0.3 多模態資產檔名規則（定版）

1. 檔名以 `blockId` 作為主鍵起始。
2. 檔名包含用途欄位（例如 `mnemonic`、`explain`、`tts`）。
3. 檔名包含時間戳 `YYYYMMDDHHmm`。
4. 檔名包含短雜湊，預設使用 `h4`；若未來規模提升可升級為 `h8`。
5. 檔案保留真實副檔名（如 `.png`、`.webp`、`.mp3`、`.wav`）。
6. 檔名僅使用 ASCII 字元（避免跨平台與編碼問題）。
7. 詳細 metadata（`type` / `mime` / `model` / `createdAt` / `path`）記錄於 `_Flashcards/Cards/<blockId>.json`。

範例（目前規則）：
- `<blockId>__mnemonic__202604011425__a1b2.webp`
- `<blockId>__tts__202604011425__7f9c.mp3`

### V0.3 驗收重點

- 單卡流程穩定：可重試、可追蹤、可回寫
- 批次流程可控：有佇列狀態、錯誤隔離、不中斷整批
- 多模態資產可維護：圖片/音訊分流、索引與卡片關聯一致

---

## V0.4：複習閃卡呈現樣式主線（整合規劃）

目標：專注於「複習時」閃卡本身的視覺與互動樣式，不與 V0.2 卡片庫管理功能耦合。
本章為 V0.4 複習樣式規劃主來源；Sprint F 僅保留摘要定位。

### V0.4 範圍

- Review Modal 內卡片資訊密度與排版層級
- 答案呈現策略與樣式系統：
  - 單行答案：`chip / plain`
  - 多行答案：`soft-band / right-rail`
- 顯示主題與可讀性控制（顏色、透明度、對比）
- 互動顯示行為（reveal / edit mode 切換一致性）
- 複習流程體驗：鍵盤操作、摘要資訊、到期/間隔資訊呈現

### V0.4 分階段優先級

- V0.4-P0：整理樣式 token 與 style strategy，建立可擴充主題架構
- V0.4-P1：統一 Review Modal 與編輯器中答案樣式語彙，避免同語法不同視覺
- V0.4-P2：補強互動一致性（點擊 reveal、保持編輯模式、回到閱讀模式規則）
- V0.4-P3：進行樣式效能與可讀性驗證（長文、多卡片、不同主題）

### V0.4 開工任務清單（可直接實作）

- Task V0.4-P0-1：建立樣式 token 與策略映射
  - 對應模組：`src/styles/editor.css`、`src/styles/main.css`、`src/settings/singleLineAnswerRenderStyles.ts`、`src/settings/multiLineAnswerRenderStyles.ts`
  - 驗收：樣式名稱、CSS 變數、設定值三者一致；新增樣式不需改 parser
- Task V0.4-P0-2：整理樣式設定入口
  - 對應模組：`src/settings/FlashcardsSettingTab.ts`、`src/settings/types.ts`
  - 驗收：單行/多行樣式切換可獨立設定，且與既有設定相容
- Task V0.4-P1-1：統一編輯器與複習面板答案視覺語彙
  - 對應模組：`src/editor/AnswerHighlighter.ts`、`src/editor/singleLineAnswerRenderStrategy.ts`、`src/ui/ReviewModal.tsx`、`src/ui/ReviewModalContainer.tsx`
  - 驗收：同語法在 editor/review 顯示風格一致，不出現同卡不同樣式
- Task V0.4-P1-2：補齊樣式回歸測試
  - 對應模組：`src/editor/answerHighlightRules.test.ts`、`src/editor/answerChipText.test.ts`
  - 驗收：`chip/plain/soft-band/right-rail` 切換不影響既有語法解析與高亮範圍
- Task V0.4-P2-1：互動狀態機一致化（reveal/edit/read）
  - 對應模組：`src/editor/revealState.ts`、`src/editor/BlockIdHider.ts`、`src/editor/AnswerHighlighter.ts`
  - 驗收：編輯模式下點擊內容不自動跳回閱讀模式；僅依明確規則切換
- Task V0.4-P2-2：Review Modal 互動細節補強
  - 對應模組：`src/ui/ReviewModal.tsx`、`src/ui/ReviewModalContainer.tsx`
  - 驗收：鍵盤操作、顯示摘要、到期資訊與樣式切換彼此不衝突
- Task V0.4-P3-1：樣式效能驗證
  - 對應模組：`src/store/FlashcardStorage.bench.ts`（延伸基線）、`src/editor/AnswerHighlighter.ts`
  - 驗收：大量卡片/長文場景下樣式切換不出現明顯卡頓與閃爍
- Task V0.4-P3-2：可讀性驗證與手測清單
  - 對應模組：`Manual.md`（使用說明同步）
  - 驗收：至少覆蓋單行卡、多行卡、填充卡三類；亮色/暗色主題可讀性達標

### V0.4 驗收重點

- 相同卡片語法在不同場景（編輯器/複習）視覺語意一致
- 不同樣式可切換且不影響解析與排程正確性
- 樣式切換不造成明顯延遲、閃爍或高亮失效

---

## 長期規劃

### v2.0: 進階分析視圖（Insights Expansion）

- 在既有 Dashboard Workspace 的 `Insights` 基礎上擴充進階分析
- 記憶流失預測
- 學習 Streak 深度分析
- 到期量與複習趨勢進階模型

### v2.1: 巢狀卡片支援

- 在 `::` 答案區塊中再次使用 `== ==` 挖空
- 評估多層卡片的解析規則與 UI 呈現方式

### v2.5: PDF 劃詞轉卡片

- 直接在 Obsidian PDF 視圖中選取文字生成閃卡
- 與既有資料模型、Block ID 與 AI enrich 流程整合

---

## 建議執行順序

1. Sprint A: Alpha 穩定化
2. Sprint B: 同步完整化
3. Sprint C: 設定頁與維護工具
4. Sprint D: 效能與儲存縮放優化
5. Sprint E: Dashboard Workspace（整合式）
6. V0.2: 卡片庫管理系統主線（整合規劃）
7. Sprint F: 學習體驗強化
8. Sprint G: 行尾 HUD / 狀態提示
9. V0.3-P1: 單卡 AI 豐富化（低風險高價值）
10. V0.3-P2: 學習分析與回顧增強
11. V0.3-P3: 批次 AI 與多模態
12. V0.4: 複習閃卡呈現樣式主線（整合規劃）
13. v2.0 之後的長期功能
