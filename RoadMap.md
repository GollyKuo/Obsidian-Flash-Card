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
- 第一階段優先完成 `Cards` 分區（列表、搜尋、篩選、排序、來源跳轉、due / sync 狀態）
- 以獨立的 Cards Query Layer 支撐 `Cards` 分區，避免 UI 直接耦合 `DataStore` / `FlashcardRepository`
- 第一版卡片管理以「卡片為主、來源為輔」：
  - 預設支援依來源筆記、來源資料夾、卡片類型、學習狀態進行分組與篩選
  - 原始筆記作為來源容器與追溯依據，而不是唯一管理單位
- 提供檢視模式切換功能，至少包含 `分組檢視` 與 `列表檢視`，且第一版預設為 `分組檢視`
- 在 `Cards` 分區提供來源健康度可見性，例如：來源筆記已移動、已遺失、已失聯等狀態提示
- 保留標籤系統擴充彈性：
  - 後續可接入筆記 tag 或卡片管理標籤，作為進階分組 / 篩選條件
  - 第一版不以標籤作為唯一核心分組依據，避免管理模型過度依賴使用者先整理 tag
- 卡片管理的標籤系統遵守「不污染原始筆記」原則：
  - 不新增會干擾閱讀的單卡標籤 Markdown 語法到使用者筆記
  - 筆記層標籤來自 Obsidian 原生 tag／frontmatter tag，作為卡片的 `inheritedTags`
  - 單卡標籤作為 plugin metadata 管理，不寫回原始筆記內容
- 標籤資料模型採雙來源、單一查詢視圖：
  - `inheritedTags`：由來源筆記同步而來，可因筆記 tag 變更而重建
  - `cardTags`：只屬於單張卡片，由卡片管理 UI 維護
  - `effectiveTags`：`inheritedTags + cardTags` 去重後的查詢／分組／篩選結果
- 單卡標籤的主儲存先落在 `_Flashcards/Cards/<blockId>.json`：
  - 讓卡片內容、FSRS 狀態、AI enrichment、單卡標籤維持同一張 card shard 作為 primary record
  - 避免過早抽出獨立標籤檔，降低同步複雜度與一致性風險
  - 若未來卡片量增大、標籤查詢需要加速，再考慮新增 derived tag index，而不是改用獨立標籤檔作為 primary schema
- 標籤同步規則：
  - 筆記 tag 變更時，重新同步受影響卡片的 `inheritedTags`
  - 單卡標籤 `cardTags` 不應被筆記重掃覆寫
  - `effectiveTags` 永遠由讀取層或索引層生成，不作為唯一事實來源
- `Cards` 分區的標籤互動：
  - 支援以 `繼承標籤`、`單卡標籤`、`合併標籤` 三種角度搜尋與篩選
  - UI 應能看出標籤來源，避免使用者誤以為所有 tag 都來自原始筆記
- V0.2 卡片管理框架先以 `_Flashcards/Cards/<blockId>.json` 承載單卡標籤，後續實作若有規模或效能新需求，再同步修正 RoadMap / Instruction / Manual
- 語法設計規格（V0.1.23 已定版）：
  - 內嵌單行卡：`{{fc 正面 :: 背面 /fc}}`
  - 內嵌填充卡：`{{fc 文字、==答案==、文字 /fc}}`
  - `{{fc` 後與 `/fc}}` 前可接受有或沒有空白（例如 `{{fc正面 :: 背面/fc}}`）
  - 已棄用 `{{fc: ...}}`，不解析也不高亮
  - 解析保護規則：`code block` / `inline code` / `math` 區塊內不解析 `fc` 包裹語法
  - 內嵌硬邊界：同一行只要出現 `{{fc` 或 `/fc}}` 但不合法，整行視為普通文字，不做 fallback 解析
- 語法實作路線（同步現況）：
  - P0（已完成，2026-04-01 02:26）：parser 新增內嵌單行卡與內嵌填充卡解析
  - P1（已完成，2026-04-01 02:26）：補齊 parser / highlight / block id 回歸測試（含 malformed 與 deprecated）
  - P1.5（規劃中）：新增編輯器命令 `Wrap selection as flashcard`，支援將選取內容一鍵包裝為 `{{fc ... /fc}}`（並可綁定快捷鍵）
  - P2（規劃中）：UI 診斷與錯誤提示（未閉合 `/fc}}`、區塊內語法衝突）
  - P3（規劃中）：視實測結果評估是否提供語法遷移工具
- V0.2 開發順序優先級建議：
  - P0：先完成 `Cards Query Layer`、來源健康度模型、`inheritedTags / cardTags / effectiveTags` 資料模型與查詢出口
  - P1：完成 `Cards` 分區第一版 UI（分組檢視預設、列表檢視切換、搜尋、篩選、排序、來源跳轉）
  - P2：補齊批次標籤操作、群組統計、細節抽屜或卡片詳情面板
  - P3：視資料量與實測結果，導入虛擬清單、延遲載入、群組 lazy expand 與 derived tag / source indexes
- 第二階段擴充 `Insights` 分區（熱點圖、趨勢、streak、到期量分析）
- 保持資料層分責：UI 可整合，但管理查詢與分析查詢維持模組邊界
- 規劃已納入：2026-03-29，V0.1.5（先加入 RoadMap，尚未執行）

### Sprint E.5: 大規模卡片量性能與延遲控制（高優先，規劃中）

目標：在大量筆記與大量卡片情境下，維持 `Cards` 分區、同步與複習流程的可用性與低延遲，避免 V0.2 之後再進行高成本回補。

- 以 `primary record + derived index` 為性能策略：
  - `_Flashcards/Cards/<blockId>.json` 持續作為單一卡片事實來源
  - 來源健康度、標籤查詢、群組摘要、到期統計可追加 derived index，不直接改寫 primary schema
- 查詢性能補強：
  - `Cards Query Layer` 應支援快取 view model、群組計數、排序 key 預先計算
  - 避免每次打開 `Cards` 分區都全量掃描所有 card shard 重新計算
- UI 響應補強：
  - `列表檢視` 預留 virtualization / windowing 能力
  - `分組檢視` 預留 lazy expand / 延遲載入群組內容
  - 卡片詳細資料與進階操作採按需載入，避免首屏載入過重
- 同步與索引補強：
  - 在 modify / rename / delete 流程中逐步改為增量更新索引
  - 對高頻變更導入 debounce + job coalescing，減少重複同步
  - 預留背景重建 derived indexes 的入口，避免前台操作卡頓
- 標籤性能策略：
  - 初期以 `Cards/<blockId>.json` 內的 `cardTags` 為主
  - 當標籤查詢、群組或批次操作成本上升時，再新增 derived tag index
- 驗證與門檻：
  - 建立 benchmark / profiling 基線，持續觀察 `Cards` 首次開啟、群組切換、搜尋篩選、整庫同步的延遲
  - 若實測顯示 UI 或同步延遲開始上升，再依序導入 derived indexes、虛擬清單、背景重建

### Sprint F: 學習體驗強化

目標：讓複習流程更接近真正可日用的學習工具。

- 強化 Review Modal 的資訊密度
- 補強 Review UI Layer：將單一元件拆成較穩定的 container / presentational 結構，逐步移除過度集中的 inline style
- 顯示預估下次間隔 / due 資訊
- 支援鍵盤快捷鍵
- 補上複習結束摘要
- 優化 queue 排序與到期卡片呈現
- 新增可自訂答案高亮主題（顏色/透明度），預設維持低對比深色半透明風格（已完成：2026-03-31，V0.1.18）
- 新增高亮套用範圍選項（已完成：2026-03-29，V0.1.11；目前支援 `填空`、`單行答案`、`多行答案`、`雙向卡` 多選）
- 高亮渲染重構第一階段：編輯模式 `==填空==` 由 plugin decoration 接管（非游標行），並完成原生 `.cm-highlight` 衝突處理與語法顯示切換（已完成：2026-03-30，V0.1.12）
- 高亮渲染重構第二階段：答案改為單一 chip 膠囊渲染，修正符號場景邊緣破碎，並補上 `[[target|alias]]` 與 markdown link 顯示正規化（已完成：2026-03-30，V0.1.13）
- 高亮渲染重構第三階段：將答案渲染策略依語法類型拆開；單行答案維持 chip，多行/清單答案改為獨立區塊渲染，並在設定頁提供 `淡色背景帶`、`右側線條` 兩種可選樣式（已完成：2026-03-31，V0.1.14）
- 單行答案渲染策略化：新增 `chip / plain` 切換並維持多行 `soft-band / right-rail` 分層（已完成：2026-04-01 08:16，V0.1.25）
- 高亮編輯顯示觸發修正：僅點擊答案高亮區塊才 reveal 語法與 Block ID，並修正多行/清單答案點擊高亮後未顯示 Block ID（已完成：2026-03-31 14:12，V0.1.21）

### Sprint G: 行尾 HUD / 狀態提示

目標：實作文件中規劃的 Notion 風格學習狀態提示。

- 以 CM6 View Plugin 顯示行尾 mastery icon
- 依卡片狀態顯示 new / due / review / overdue
- 加入過期過久的琥珀色提醒
- 評估與 AI enrich 按鈕共存的 UI 形式

---

## AI 主線

### Sprint H: 單卡 AI 豐富化

目標：先從最可控的單卡操作開始。

- 針對單張卡片觸發 AI enrich
- 傳入標題、縮排父層與卡片內容作為 context
- 將 explanation 結果寫入對應卡片儲存檔（`_Flashcards/Cards/<blockId>.json`）
- 預留 `_Flashcards/Assets/images/` 與 `_Flashcards/Assets/audio/` 資產路徑

### Sprint I: 批次 AI 與多模態

目標：擴展 AI 流程，但不破壞目前穩定核心。

- 支援批次請求 AI enrich
- 整合圖片轉卡片 / OCR 流程
- 將 AI 生成資產分流存入 `_Flashcards/Assets/images/` 與 `_Flashcards/Assets/audio/`
- 設計失敗重試與模型切換機制

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
6. Sprint F: 學習體驗強化
7. Sprint G: 行尾 HUD / 狀態提示
8. Sprint H: 單卡 AI 豐富化
9. Sprint I: 批次 AI 與多模態
10. v2.0 之後的長期功能
