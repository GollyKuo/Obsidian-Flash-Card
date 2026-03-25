/**
 * AI-Enriched Flashcards — Obsidian 外掛主入口
 *
 * V0.1.1 功能：
 * - M1：CSS 隔離環境（Tailwind fc- 前綴 + #fc-plugin-root 包裹）
 * - M2：閃卡語法解析 + Block ID 自動生成（On Blur）
 * - M3：CM6 ViewPlugin — 隱藏 Block ID
 * - M5：FSRS 複習 Modal + 開始閃卡複習指令
 */

import { Plugin, MarkdownView, Notice } from "obsidian";
import { FlashcardParser } from "./parser/FlashcardParser";
import { BlockIdManager } from "./blockid/BlockIdManager";
import { DataStore } from "./store/DataStore";
import { blockIdHiderExtension } from "./editor/BlockIdHider";
import { ReviewModalContainer } from "./ui/ReviewModalContainer";

// 引入樣式（由 esbuild + PostCSS 處理）
import "./styles/main.css";

export default class FlashcardsPlugin extends Plugin {
    /** 閃卡解析器 */
    parser!: FlashcardParser;
    /** Block ID 管理器 */
    blockIdManager!: BlockIdManager;
    /** 資料儲存 */
    dataStore!: DataStore;

    async onload(): Promise<void> {
        console.log("[Flashcards] 載入 AI-Enriched Flashcards 外掛");

        // ── 初始化核心模組 ──
        this.parser = new FlashcardParser();
        this.blockIdManager = new BlockIdManager(this, this.parser);
        this.dataStore = new DataStore(this);

        // ── 註冊事件與擴充（不依賴 DataStore 資料） ──
        this.blockIdManager.registerEvents();
        this.registerEditorExtension(blockIdHiderExtension);

        // ── 註冊指令 ──
        this.addCommand({
            id: "scan-current-file",
            name: "掃描當前文件的閃卡",
            callback: () => this.scanCurrentFile(),
        });
        this.addCommand({
            id: "show-stats",
            name: "顯示閃卡統計",
            callback: () => this.showStats(),
        });
        this.addCommand({
            id: "start-review",
            name: "開始閃卡複習",
            callback: () => {
                new ReviewModalContainer(this.app, this.dataStore).open();
            },
        });

        // ── 註冊左側功能區圖示 (Ribbon) ──
        this.addRibbonIcon("scan", "掃描當前文件的閃卡", () => {
            this.scanCurrentFile();
        });
        
        this.addRibbonIcon("graduation-cap", "開始閃卡複習", () => {
            new ReviewModalContainer(this.app, this.dataStore).open();
        });

        this.addRibbonIcon("bar-chart", "顯示閃卡統計", () => {
            this.showStats();
        });

        // ── 註冊 MarkdownPostProcessor (隱藏閱讀模式的 Block ID) ──
        this.registerMarkdownPostProcessor((element) => {
            // 精準配對：空白 + ^fc- + 恰好 6 個英數字/減號/底線
            const blockIdRegex = /\s*\^fc-[A-Za-z0-9_-]{6}\b/g;

            // 遞迴尋找並替換 Element 內所有文字節點
            const walk = (node: Node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    if (node.textContent && blockIdRegex.test(node.textContent)) {
                        node.textContent = node.textContent.replace(blockIdRegex, "");
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const el = node as HTMLElement;
                    // 跳過程式碼區塊，避免誤刪
                    if (el.tagName === "CODE" || el.tagName === "PRE") {
                        return;
                    }
                    node.childNodes.forEach(walk);
                }
            };
            walk(element);
        });

        // ── 最後才載入儲存資料（即使失敗也不影響上方已註冊的功能） ──
        await this.dataStore.load();

        new Notice("✨ AI-Enriched Flashcards 已載入");
    }

    onunload(): void {
        console.log("[Flashcards] 卸載 AI-Enriched Flashcards 外掛");
    }

    /**
     * 掃描當前文件，解析所有閃卡並同步到 DataStore
     */
    private async scanCurrentFile(): Promise<void> {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view || !view.file) {
            new Notice("⚠️ 請先開啟一個 Markdown 文件");
            return;
        }

        const content = view.editor.getValue();
        const cards = this.parser.parseDocument(content);

        let newCount = 0;
        let updateCount = 0;

        for (const card of cards) {
            if (card.blockId) {
                const existing = this.dataStore.getCardByBlockId(card.blockId);
                this.dataStore.upsertCard(card.blockId, card, view.file.path);
                if (existing) {
                    updateCount++;
                } else {
                    newCount++;
                }
            }
        }

        await this.dataStore.save();

        const noIdCount = cards.filter((c) => !c.blockId).length;
        let msg = `📝 掃描完成：${cards.length} 張閃卡`;
        if (newCount > 0) msg += `，${newCount} 張新增`;
        if (updateCount > 0) msg += `，${updateCount} 張更新`;
        if (noIdCount > 0) msg += `\n⚠️ ${noIdCount} 張尚未生成 Block ID（請離開該行觸發自動生成）`;

        new Notice(msg, 5000);
    }

    /**
     * 顯示閃卡統計資訊
     */
    private showStats(): void {
        const allCards = this.dataStore.getAllCards();
        const dueCards = this.dataStore.getDueCards();

        const stats = {
            total: allCards.length,
            due: dueCards.length,
            new: allCards.filter((c) => c.fsrs.state === "new").length,
            learning: allCards.filter((c) => c.fsrs.state === "learning").length,
            review: allCards.filter((c) => c.fsrs.state === "review").length,
        };

        new Notice(
            `📊 閃卡統計\n` +
            `總計：${stats.total} 張\n` +
            `待複習：${stats.due} 張\n` +
            `新卡：${stats.new} | 學習中：${stats.learning} | 複習中：${stats.review}`,
            8000
        );
    }
}
