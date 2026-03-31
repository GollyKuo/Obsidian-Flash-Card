# 專案回顧與除錯紀錄

這份文件用來記錄：

- 反覆嘗試後才定位出的真正根因
- 哪些修法證明是錯誤方向
- 下次遇到類似問題時，應先檢查的順序

原則：

- 不只記錄「怎麼修好」，也記錄「為什麼前面會繞遠路」
- 先記根因，再記症狀，再記排查順序
- 若未來有相似事件，直接在這份文件新增章節

---

## Case 001：V0.1.12 - V0.1.14 閃卡高亮與編輯器渲染衝突

### 症狀

- `==填空==` 在編輯器裡只看到 Obsidian 原生高亮，外掛高亮不穩定或完全不生效
- 滾動後高亮消失，或只剩原生高亮
- 點進卡片時，語法沒有正常顯示
- `block id` 不出現，並伴隨大塊無法刪除的陰影/空白

### 最關鍵的問題點

真正的核心問題有三個：

1. 編輯器樣式與預覽樣式混在同一份 CSS 中  
   `CodeMirror` 的 `.cm-editor` 規則，不應跟 `#fc-plugin-root` 的預覽樣式走同一套 prefix 包裝。

2. Build 後的最終 CSS 沒有被檢查  
   問題不只可能出在原始碼，也可能出在編譯後的 `dist/main.css`。這次真正的致命點，就是 editor selector 被錯誤加上前綴，導致規則根本匹配不到。

3. 同一個目標被多層機制同時控制  
   例如 `block id` 一度同時被 CSS 與 decoration 嘗試隱藏，結果容易出現「文字不見了，但空間還在」的假象。

### 這次證明是錯誤方向的做法

- 一開始先靠調高 CSS 優先權去硬壓 Obsidian 原生高亮
- 在沒有先確認最終編譯 CSS 與實際 DOM 結構前，就反覆調整 widget / decoration replace
- 同時讓 CSS 與 decoration 共同控制 `block id` 顯示/隱藏
- 先修視覺症狀，而不是先確認「規則有沒有真的命中元素」

### 最後有效的做法

1. 將 editor 專用樣式拆到 `src/styles/editor.css`
2. 讓 `editor.css` 不經過 `#fc-plugin-root` 的 prefix-wrap
3. 用編譯後的 `dist/main.css` 驗證 selector 是否真的正確
4. 用 decoration 控制編輯器中的顯示/隱藏，用 CSS 只負責樣式
5. 游標所在行不套用閃卡高亮，讓語法在編輯時完整顯示
6. `:: / ;; / :::` 在非作用中行用 replace 隱藏，而不是只靠 CSS 假裝消失
7. `block id` 需同時支援兩種形態：
   - 行尾型：`Answer ^fc-abc123`
   - 獨立一行型：`^fc-abc123`

### 這次的工程教訓

- 先看編譯結果，再懷疑 selector
- 先確認 DOM 命中與資料形態，再調視覺樣式
- 同一個 UI 行為盡量只交給一種機制控制
- 遇到 editor 問題時，要分成三層看：
  - 原始碼的規則有沒有寫對
  - 編譯後的 CSS 有沒有變形
  - 最後 DOM 上有沒有真的套到 class

### 下次遇到類似問題的排查順序

1. 先確認 `dist/main.css` 是否包含預期 selector
2. 確認 selector 沒有被錯誤加上 prefix
3. 確認畫面上的實際 DOM class 是否命中
4. 確認是不是同時有 CSS 與 decoration 在控制同一個元素
5. 最後才調整顏色、圓角、透明度等視覺細節

### 後續規範

- 新的 editor 規則優先放在 `src/styles/editor.css`
- 預覽/設定面板/UI 容器規則放在 `src/styles/main.css`
- 遇到「看起來沒變」的問題時，先檢查：
  - `src`
  - `dist`
  - Vault 內實際載入的 `styles.css`

---

## Case 002：V0.1.18 設定頁主次標題對齊失敗

### 症狀

- 設定頁主標題（`h3`）與次標題（`p`）視覺上無法左對齊
- 反覆調整 `margin-left` 後，畫面仍看起來「沒有改變」

### 最關鍵的問題點

1. 設定頁不在 `#fc-plugin-root` 內  
   `main.css` 經 `PrefixWrap("#fc-plugin-root")` 後，若 selector 沒被排除，設定頁規則不會命中。

2. Obsidian / 主題對 `h3` 可能有預設偏移  
   只調整次標題不足以保證對齊，主標題也必須一併納入控制。

### 這次證明是錯誤方向的做法

- 先用 inline style 強行修正（可暫時解，但不夠乾淨）
- 只改次標題，不同步控制主標題樣式

### 最後有效的做法

1. 回收 inline style，改回 class-based 樣式
2. 在 `esbuild.config.mjs` 的 `ignoredSelectors` 加入：
   - `^\\.fc-settings-section-title\\b`
   - `^\\.fc-settings-subtitle\\b`
3. 主標題與次標題分別套專用 class，統一左側定位規則
4. 對齊場景加上保險（必要時 `!important`）避免被主題覆蓋

### 下次遇到類似問題的排查順序

1. 先看 selector 是否被 prefix-wrap 包住
2. 檢查 `dist/main.css` 是否出現未包前綴的目標規則
3. 同時檢查主標題與次標題的實際 computed style
4. 最後才做視覺微調（字距、行高、間距）


---

## Case 003：V0.1.22 之後到目前（V0.1.23 開發期）

### 錯誤總覽（依發生順序）
1. 內嵌語法初版上線後，造成既有閃卡語法（:: / ;; / :::）一度失效。
2. 內嵌填充卡高亮錯誤：整段 {{fc ... /fc}} 被高亮，沒有只高亮 ==答案==。
3. 語法隱藏錯誤：== ==、{{fc、/fc}} 在閱讀模式沒有正確隱藏。
4. 相容邏輯錯誤：同時嘗試支援 {{fc: ... /fc}} 與 {{fc ... /fc}}，造成判斷分支混亂。
5. 回退策略錯誤：內嵌語法匹配失敗時，回退到一般 :: 規則，導致「半解析」與錯誤 chip 顯示。
6. 內嵌填充卡漏規格：{{fc 寫作、==批判思考==、判斷力 /fc}}（無 ::）未被視為合法 cloze 包裹語法。
7. 修正節奏錯誤：連續 patch 沒先把規則鎖定與測試補齊，導致反覆修同類問題。

### 根因分析
- 規格未先定版就進入實作，導致 parser / highlighter / 文件三者不同步。
- 早期過度依賴「向下相容 + fallback」，沒有明確的「不合法即不解析」邊界。
- 測試覆蓋缺口：缺少 malformed inline、inline cloze wrapper（無 ::）與 token 隱藏的整合案例。
- Debug 過程受編碼顯示干擾，閱讀與判斷成本上升。

### 已落地修正
- 只保留並主推單一規格：{{fc 正面 :: 背面 /fc}}（舊語法 {{fc: ...}} 只保留拒絕測試，不作為有效語法）。
- 建立「內嵌標記硬邊界」：只要出現 {{fc 或 /fc}}，就必須符合合法 inline 規則；否則整行不解析。
- 新增 inline cloze wrapper 解析：允許 {{fc ...==答案==... /fc}}（無 ::）作為合法填充卡。
- 高亮規則修正：
  - inline forward：高亮背面區段。
  - inline cloze：只高亮 ==...== token，不高亮整段包裹內容。
- token 隱藏修正：合法 inline 語法在閱讀模式隱藏 {{fc、::（若有）與 /fc}}。
- AnswerHighlighter decoration 排序改為穩定輸出，降低 replace/mark 互相覆蓋風險。

### 防呆規則（下次必做）
1. 先定規格再寫碼：先在 Manual / RoadMap 明確語法，確認後才進 parser。
2. 先測試後改碼：先補失敗測試（red），再實作（green），最後重構（refactor）。
3. 內嵌語法禁止 fallback：有 wrapper 標記但不合法時，直接視為普通文字，不做閃卡解析。
4. 每次改 parser 必同步驗證三層：
   - Parser 單元測試
   - Highlight/token 隱藏測試
   - 實際 Obsidian 編輯器手測（單行、填充、多行、錯誤語法）
5. 單次提交前必跑：
pm test + 
pm run build，並檢查與文件規格一致。

### 本案例新增的回歸測試重點
- malformed inline wrapper 不可回退到 :: 解析。
- inline cloze wrapper（無 ::）可正確解析、隱藏 token、且只高亮 ==...==。
- deprecated {{fc: ...}} 不被解析為有效卡。



---

## Case 003 補充（2026-04-01）：高亮全面失效

### 現象
- 編輯器內的高亮一次全部消失（單行、多行、填充都不顯示）。

### 這次的真正根因
- `AnswerHighlighter.buildDecorations` 在同一行分開加入兩種 decoration：
  - 語法隱藏範圍（`{{fc`、`::`、`/fc}}`）
  - 答案 chip replace 範圍
- 舊流程先把 syntax token 全部 `builder.add`（包含靠近行尾的 `/fc}}`），再加入答案區間（通常在同一行中段）。
- 這會產生「range 加入順序回頭」問題，觸發 CodeMirror `RangeSetBuilder` 的 out-of-order 例外。
- 例外被 `safeBuildDecorations` 捕捉後回傳 `Decoration.none`，因此外觀上會變成「所有高亮都壞掉」。

### 與 Case 003 的統整
- 這是 Case 003 第 7 點（修正節奏/整合缺口）的延伸：
  - parser 規則和 highlight 規則分開看都正確，但整合層缺少排序防呆。
- 也對應到原本 Case 003 提過的「decoration 排序要穩定」：問題不是方向錯，而是落地還不完整。

### 已落地修正
- 改成「同一行先收集全部 decoration，依 `from/to` 排序後再 add」。
- 避免 replace/hide 交疊時出現 out-of-order 導致整體失效。

### 防再發規則（追加）
1. 同一行會產生多種 decoration 時，不可邊算邊 `builder.add`。
2. 一律採用 collect -> sort -> add。
3. 每次改內嵌語法，必測「同一行同時有 syntax-hide 與 answer-chip」的整合情境。

---

## Case 004（2026-04-01）：文件編碼污染（Manual / RoadMap 亂碼）

### 現象
- `Manual.md`、`RoadMap.md` 在 `release: v0.1.23` 後出現大量亂碼。
- 檔案仍可被 UTF-8 讀取，但內容包含大量私用區字元（PUA），屬於「錯誤轉碼後再存檔」。

### 根因
- 進行文件批次改寫時，流程未鎖定 UTF-8 安全路徑，導致文字先被錯誤解碼，再以 UTF-8 寫回。
- 這類錯誤一旦寫回，屬內容層污染，不是 Vault 路徑或 Obsidian 設定問題。

### 防再發規則
1. 文件改寫優先使用 `apply_patch`，避免整檔讀出後再寫回。
2. 禁止使用未明確指定編碼的整檔轉寫流程。
3. 提交前固定執行：`npm run check:docs-encoding`。
4. `check:docs-encoding` 若失敗，先修復文件再允許 commit / push。

### 已落地防呆
- 新增 `scripts/check-docs-encoding.js`。
- 新增 npm script：`check:docs-encoding`。
- `check:docs-encoding` 納入 `Instruction.md`、`Retrospective.md`、`.codex/skill/SKILL.md`、`manifest.json`。
- `check:docs-encoding` 增加 JSON 合法性檢查（`manifest.json` / `package.json` / `package-lock.json`）。
