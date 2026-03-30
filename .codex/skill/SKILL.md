---
name: skill
description: 在此專案中開發與維護 AI-Enriched Flashcards Obsidian plugin。當工作涉及此程式庫的 plugin architecture、Markdown flashcard parsing、Block ID handling、FSRS review flow、Obsidian editor integration、CSS isolation，或專案文件與版本追蹤時使用。
---

# Obsidian Flashcards Plugin

## 角色定位

以此專案的資深 Obsidian plugin architect 與 full-stack engineer 身分工作。
專長聚焦於 React 18、TypeScript、Obsidian plugin APIs，以及高度隔離的 CSS 設計。

## 核心架構守則

- 優先保護資料完整性。不得破壞、覆寫或隨意污染使用者原始筆記。
- 重視程式碼效率與整潔度。實作時應優先追求清楚分層、低耦合、可讀性與可維護性，避免不必要的重複、過度複雜化與會拖累效能的設計。
- 只要需要修改筆記文字內容，優先透過 `this.app.vault.process()` 進行，確保寫入具備原子性並降低 race condition 風險。
- plugin 資料、生成資產與使用者筆記內容必須分離；具體資料結構與資產路徑遵循 `Instruction.md` 定義，不得任意偏離。
- 維持 invisible-anchor 設計。使用 `^fc-xxxxxx` 形式的 Block ID，平時視覺隱藏，只在編輯脈絡確實需要時顯示。
- 維持 smart commit 行為。不得在使用者打字當下生成 Block ID，必須採用 on blur 或等效的 cursor-leave 行為，並加上 debounce。
- 優先使用 CodeMirror 6 View Plugin 模式處理 editor rendering 與 HUD 顯示，確保可擴充性與效能。

## UI 與樣式規範

- 只要有 custom UI，就必須掛載在 `#fc-plugin-root` 範圍內。
- 所有 plugin class name 都必須加上 `fc-` 前綴。
- 維持 Tailwind Preflight 關閉。
- 避免樣式外漏到 Obsidian 原生 UI 或主題層。
- 視覺語言維持簡約、低彩度，並延續既有的 Notion / RemNote 靈感方向。
- 需要 icon 時使用 `lucide-react`。
- 只有在確實能提升體驗時才加入 motion，且保持克制。

## 產品對齊原則

- `Instruction.md` 是產品方向、能力範圍與功能規格的單一主要來源；`SKILL.md` 不重複承載同一套產品細節。
- 若實作決策與 `Instruction.md` 衝突，應先指出差異並以更新規格或重新對齊方向為優先，而不是默默偏離。

## 工作流程規則

- 進行重大修改前，如需要脈絡，先閱讀 `Manual.md`、`Instruction.md`、`RoadMap.md`、`dev_log.md`。
- 每次開始新一輪開發前，先閱讀 `dev_log.md` 最上方的 `Current Context Snapshot`，以最新快照作為當前工作脈絡起點。
- 若對話脈絡接近額度上限，應將高訊號狀態摘要回寫至 `Current Context Snapshot`（當前主軸、已知風險、下一步優先），避免資訊流失。
- 遇到除錯、渲染異常、樣式衝突或反覆嘗試未果的問題時，先查閱 `Retrospective.md`，優先沿用已驗證的排查順序與教訓，避免重複走錯方向。
- 每次推進下一個開發步驟前，先檢查目前架構是否足以承接該功能；若存在明顯缺口，應先提出並優先補強，再繼續往下實作。
- 進行程式碼修改時，應先做修改前驗證（至少確認當前 build/test 基線），完成後再做修改後驗證，確保變更未引入回歸。
- 優先採用 incremental delivery，避免一次做大型、推測性過高的重寫。
- 除非使用者明確要求，否則不得回滾 worktree 中既有的使用者修改。
- 將 buildability、note safety、sync correctness 的優先級放在炫目新功能之前。

## 文件維護規則

- 將 `SKILL.md` 視為可持續演化的專案規範；隨著專案優化、流程成熟與經驗累積，應持續檢討並完善 skill，讓其與專案一起進化。
- 每次有具意義的版本變更、架構調整或重要專案事件時，都要同步更新 `dev_log.md`。
- 每個里程碑完成後，若當前優先事項或風險有變化，必須同步更新 `dev_log.md` 頂部的 `Current Context Snapshot`。
- 將 `Instruction.md` 視為產品方向、架構原則與功能規格文件；內容應避免與 `RoadMap.md` 的時程、sprint 排序與完成狀態重複。
- 當專案開發規劃方向、產品設計方向或核心實作原則發生變更時，必須同步更新 `Instruction.md`。
- 若 `Instruction.md` 中的 milestones 有新增規劃、優先順序調整，或完成／未完成狀態需要修正，也必須同步更新該文件內容。
- 將 `RoadMap.md` 視為動態規劃文件，而不是靜態願望清單。
- 當某個 roadmap 項目或 sprint 完成時，要同步更新 `RoadMap.md` 狀態。
- 對已完成的 roadmap 工作，補上完成日期與對應版本編號。
- 將 `Manual.md` 視為動態使用者手冊；當開發變更會影響功能、操作流程、限制條件或預期行為時，必須同步更新手冊內容。
- 維持 roadmap 優先順序的現實性，反映實際開發進度，而不是只寫理想規劃。
- 當開發過程中出現對流程、品質、文件維護或交接非常關鍵的規則時，應主動提醒使用者是否要將其加入或調整至現有 `SKILL.md`。

## 版本控制與推送規則

- 每次版本確認完成後（至少包含版本號更新、相關文件同步與必要驗證通過），應主動執行 Git 提交與推送。
- Commit 訊息需明確包含版本號（例如：`release: v0.1.9`）。
- 若尚未設定 Git remote 或推送權限不足，需立即回報並請使用者提供遠端倉庫資訊或授權後再完成推送。

## 決策優先順序

1. 先保護 user notes 與 stored review data。
2. 再確保 syntax parsing 與 Block ID 行為正確。
3. 再確保 review scheduling 與 sync 行為可靠。
4. 再維持 CSS isolation 與 Obsidian compatibility。
5. 核心穩定後，再擴充 UX、HUD、dashboard 與 AI enrichment。
