/**
 * DataStore — 閃卡資料儲存管理
 *
 * 職責：
 * 1. 管理 `_Flashcards/data.json` 的讀寫
 * 2. 確保 `_Flashcards/` 目錄存在
 * 3. 提供 CRUD 操作介面
 */

import { Plugin, TFile, TFolder } from "obsidian";
import {
    FlashcardData,
    FlashcardRecord,
    DEFAULT_DATA,
    DEFAULT_FSRS_STATE,
} from "./types";
import { FlashcardRaw } from "../parser/types";

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

    /**
     * 載入資料（從 `_Flashcards/data.json`）
     * 如果檔案不存在，建立預設資料
     */
    async load(): Promise<FlashcardData> {
        try {
            // 確保目錄存在
            await this.ensureDirectory(DATA_DIR);
            await this.ensureDirectory(ASSETS_DIR);

            const file = this.plugin.app.vault.getAbstractFileByPath(DATA_FILE);
            if (file instanceof TFile) {
                const content = await this.plugin.app.vault.read(file);
                this.data = JSON.parse(content);
            } else {
                // 檔案不存在，建立預設資料
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
                await this.plugin.app.vault.create(DATA_FILE, content);
            }
        } catch (err) {
            console.error("[Flashcards] 儲存資料時發生錯誤:", err);
        }
    }

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
            // 更新現有卡片（保留 FSRS 狀態、保留 enrichment）
            existing.front = raw.front;
            existing.back = raw.back;
            existing.type = raw.type;
            existing.context = raw.context;
            existing.sourcePath = sourcePath;
            existing.updatedAt = now;
            return existing;
        } else {
            // 建立新卡片
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

    /**
     * 根據 Block ID 取得卡片
     */
    getCardByBlockId(blockId: string): FlashcardRecord | null {
        return this.data.cards[blockId] || null;
    }

    /**
     * 取得所有卡片
     */
    getAllCards(): FlashcardRecord[] {
        return Object.values(this.data.cards);
    }

    /**
     * 取得到期需要複習的卡片
     */
    getDueCards(): FlashcardRecord[] {
        const now = new Date();
        return this.getAllCards().filter((card) => {
            const due = new Date(card.fsrs.due);
            return due <= now;
        });
    }

    /**
     * 刪除卡片
     */
    deleteCard(blockId: string): boolean {
        if (this.data.cards[blockId]) {
            delete this.data.cards[blockId];
            return true;
        }
        return false;
    }

    /**
     * 取得完整資料（唯讀）
     */
    getData(): FlashcardData {
        return this.data;
    }

    /**
     * 確保目錄存在
     */
    private async ensureDirectory(dirPath: string): Promise<void> {
        const existing = this.plugin.app.vault.getAbstractFileByPath(dirPath);
        if (!existing) {
            await this.plugin.app.vault.createFolder(dirPath);
        } else if (!(existing instanceof TFolder)) {
            console.warn(`[Flashcards] ${dirPath} 已存在但不是目錄`);
        }
    }
}
