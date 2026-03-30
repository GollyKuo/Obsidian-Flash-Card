# RoadMap

## 目前狀態

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

---

## 中期計畫

### Sprint E: Dashboard Workspace（整合式）

目標：以單一 UI 入口整合卡片管理與學習分析，不拆成兩個分離 dashboard。

- 建立統一 Dashboard Workspace（單一入口）
- 第一階段優先完成 `Cards` 分區（列表、搜尋、篩選、排序、來源跳轉、due / sync 狀態）
- 第二階段擴充 `Insights` 分區（熱點圖、趨勢、streak、到期量分析）
- 保持資料層分責：UI 可整合，但管理查詢與分析查詢維持模組邊界
- 規劃已納入：2026-03-29，V0.1.5（先加入 RoadMap，尚未執行）

### Sprint F: 學習體驗強化

目標：讓複習流程更接近真正可日用的學習工具。

- 強化 Review Modal 的資訊密度
- 顯示預估下次間隔 / due 資訊
- 支援鍵盤快捷鍵
- 補上複習結束摘要
- 優化 queue 排序與到期卡片呈現
- 新增可自訂答案高亮主題（顏色/透明度），預設維持低對比深色半透明風格
- 新增高亮套用範圍選項（已完成：2026-03-29，V0.1.11；目前支援 `填空`、`單行答案`、`多行答案`、`雙向卡` 多選）
- 高亮渲染重構第一階段：編輯模式 `==填空==` 由 plugin decoration 接管（非游標行），並完成原生 `.cm-highlight` 衝突處理與語法顯示切換（已完成：2026-03-30，V0.1.12）
- 高亮渲染重構第二階段：答案改為單一 chip 膠囊渲染，修正符號場景邊緣破碎，並補上 `[[target|alias]]` 與 markdown link 顯示正規化（已完成：2026-03-30，V0.1.13）

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
