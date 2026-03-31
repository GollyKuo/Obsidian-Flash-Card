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
