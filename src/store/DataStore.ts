/**
 * DataStore — 閃卡資料儲存管理
 *
 * 職責：
 * 1. 管理 `_Flashcards/data.json` 的讀寫
 * 2. 確保 `_Flashcards/` 目錄存在
 * 3. 提供 CRUD 操作介面
 * 4. 整合 FSRS 演算法進行間隔重複排程
 */

import { Plugin, TFile, TFolder } from "obsidian";
import {
    FlashcardData,
    FlashcardRecord,
    FSRSState,
    DEFAULT_DATA,
    DEFAULT_FSRS_STATE,
} from "./types";
import { FlashcardRaw } from "../parser/types";
import { FSRS, Rating, State, Card as FSRSCard } from "ts-fsrs";

/** 資料目錄與檔案路徑 */
const DATA_DIR = "_Flashcards";
const DATA_FILE = `${DATA_DIR}/data.json`;
const ASSETS_DIR = `${DATA_DIR}/Assets`;

export class DataStore {
    private plugin: Plugin;
    private data: FlashcardData;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.data = { ...DEFAULT_DATA };
    }

    // ─── I/O ────────────────────────────────────────────────

    /**
     * 載入資料（從 `_Flashcards/data.json`）
     * 如果檔案不存在，建立預設資料
     */
    async load(): Promise<FlashcardData> {
        try {
            await this.ensureDirectory(DATA_DIR);
            await this.ensureDirectory(ASSETS_DIR);

            const file = this.plugin.app.vault.getAbstractFileByPath(DATA_FILE);
            if (file instanceof TFile) {
                const content = await this.plugin.app.vault.read(file);
                this.data = JSON.parse(content);
            } else {
                this.data = { ...DEFAULT_DATA };
                await this.save();
            }
        } catch (err) {
            console.error("[Flashcards] 載入資料時發生錯誤:", err);
            this.data = { ...DEFAULT_DATA };
        }

        return this.data;
    }

    /**
     * 儲存資料到 `_Flashcards/data.json`
     */
    async save(): Promise<void> {
        try {
            const content = JSON.stringify(this.data, null, 2);
            const file = this.plugin.app.vault.getAbstractFileByPath(DATA_FILE);
            if (file instanceof TFile) {
                await this.plugin.app.vault.modify(file, content);
            } else {
                await this.safeCreate(DATA_FILE, content);
            }
        } catch (err) {
            console.error("[Flashcards] 儲存資料時發生錯誤:", err);
        }
    }

    // ─── CRUD ───────────────────────────────────────────────

    /**
     * 新增或更新一張卡片
     */
    upsertCard(
        blockId: string,
        raw: FlashcardRaw,
        sourcePath: string
    ): FlashcardRecord {
        const now = new Date().toISOString();
        const existing = this.data.cards[blockId];

        if (existing) {
            existing.front = raw.front;
            existing.back = raw.back;
            existing.type = raw.type;
            existing.context = raw.context;
            existing.sourcePath = sourcePath;
            existing.updatedAt = now;
            return existing;
        } else {
            const record: FlashcardRecord = {
                blockId,
                sourcePath,
                type: raw.type,
                front: raw.front,
                back: raw.back,
                context: raw.context,
                fsrs: { ...DEFAULT_FSRS_STATE, due: now },
                createdAt: now,
                updatedAt: now,
            };
            this.data.cards[blockId] = record;
            return record;
        }
    }

    /** 根據 Block ID 取得卡片 */
    getCardByBlockId(blockId: string): FlashcardRecord | null {
        return this.data.cards[blockId] || null;
    }

    /** 取得所有卡片 */
    getAllCards(): FlashcardRecord[] {
        return Object.values(this.data.cards);
    }

    /** 取得到期需要複習的卡片 */
    getDueCards(): FlashcardRecord[] {
        const now = new Date();
        return this.getAllCards().filter((card) => {
            const due = new Date(card.fsrs.due);
            return due <= now;
        });
    }

    /** 刪除卡片 */
    deleteCard(blockId: string): boolean {
        if (this.data.cards[blockId]) {
            delete this.data.cards[blockId];
            return true;
        }
        return false;
    }

    /** 取得完整資料（唯讀） */
    getData(): FlashcardData {
        return this.data;
    }

    // ─── FSRS 排程 ──────────────────────────────────────────

    /**
     * 根據使用者評分更新閃卡的 FSRS 狀態
     */
    async reviewCard(blockId: string, rating: Rating): Promise<void> {
        const record = this.data.cards[blockId];
        if (!record) return;

        const now = new Date();
        const fsrs = new FSRS({});

        // 字串狀態轉 FSRS State 枚舉
        const stateMap: Record<string, State> = {
            new: State.New,
            learning: State.Learning,
            review: State.Review,
            relearning: State.Relearning,
        };

        // 從現有狀態還原 FSRSCard
        const card: FSRSCard = {
            due: new Date(record.fsrs.due),
            stability: record.fsrs.stability,
            difficulty: record.fsrs.difficulty,
            elapsed_days: 0,
            scheduled_days: 0,
            reps: record.fsrs.reps,
            lapses: record.fsrs.lapses,
            state: stateMap[record.fsrs.state] ?? State.New,
            last_review: record.fsrs.lastReview
                ? new Date(record.fsrs.lastReview)
                : undefined,
        };

        const result = fsrs.repeat(card, now);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const next = (result as any)[rating];
        const nextCard = next.card;

        // State 枚舉轉回字串
        const stateRevMap: Record<number, FSRSState["state"]> = {
            [State.New]: "new",
            [State.Learning]: "learning",
            [State.Review]: "review",
            [State.Relearning]: "relearning",
        };

        // 寫回 FSRS 狀態
        record.fsrs = {
            ...record.fsrs,
            lastReview: now.toISOString(),
            due: nextCard.due.toISOString(),
            state: stateRevMap[nextCard.state] ?? "new",
            reps: nextCard.reps,
            lapses: nextCard.lapses,
            difficulty: nextCard.difficulty,
            stability: nextCard.stability,
        };
        record.updatedAt = now.toISOString();
        await this.save();
    }

    // ─── 私有工具 ───────────────────────────────────────────

    /**
     * 確保目錄存在
     *
     * 注意：Obsidian Vault 初始化早期 `getAbstractFileByPath` 可能返回 null，
     * 即使資料夾已在磁碟上存在。因此 `createFolder` 需要 try/catch 保護。
     */
    private async ensureDirectory(dirPath: string): Promise<void> {
        const existing = this.plugin.app.vault.getAbstractFileByPath(dirPath);
        if (!existing) {
            try {
                await this.plugin.app.vault.createFolder(dirPath);
            } catch (e: unknown) {
                if (!this.isAlreadyExistsError(e)) throw e;
            }
        } else if (!(existing instanceof TFolder)) {
            console.warn(`[Flashcards] ${dirPath} 已存在但不是目錄`);
        }
    }

    /**
     * 安全建立檔案 — 若檔案已存在則改用 adapter.write
     */
    private async safeCreate(path: string, content: string): Promise<void> {
        try {
            await this.plugin.app.vault.create(path, content);
        } catch (e: unknown) {
            if (this.isAlreadyExistsError(e)) {
                await this.plugin.app.vault.adapter.write(path, content);
            } else {
                throw e;
            }
        }
    }

    /** 判斷錯誤是否為「已存在」類型 */
    private isAlreadyExistsError(e: unknown): boolean {
        const msg = e instanceof Error ? e.message : String(e);
        return msg.includes("already exists");
    }
}
