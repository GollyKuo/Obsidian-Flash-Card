import { Plugin } from "obsidian";
import {
    FlashcardData,
    FlashcardRecord,
    createDefaultFsrsState,
} from "./types";
import { FlashcardRaw } from "../parser/types";
import { FsrsScheduler, ReviewRating } from "../review/FsrsScheduler";
import { FlashcardsPluginSettings } from "../settings/types";
import { FlashcardRepository } from "./FlashcardRepository";
import { SaveQueue } from "./SaveQueue";

type SettingsAccessor = () => FlashcardsPluginSettings;

export class DataStore {
    private repository: FlashcardRepository;
    private scheduler: FsrsScheduler;
    private saveQueue: SaveQueue;

    constructor(
        plugin: Plugin,
        getSettings: SettingsAccessor,
        scheduler: FsrsScheduler = new FsrsScheduler()
    ) {
        this.repository = new FlashcardRepository(plugin, getSettings);
        this.scheduler = scheduler;
        this.saveQueue = new SaveQueue(() => this.repository.save());
    }

    async load(): Promise<FlashcardData> {
        return this.repository.load();
    }

    async save(): Promise<void> {
        await this.saveQueue.saveNow();
    }

    queueSave(): void {
        this.saveQueue.queue();
    }

    async flushQueuedSave(): Promise<void> {
        await this.saveQueue.flush();
    }

    async runInSaveBatch<T>(work: () => Promise<T>): Promise<T> {
        return this.saveQueue.runInBatch(work);
    }

    upsertCard(
        blockId: string,
        raw: FlashcardRaw,
        sourcePath: string
    ): FlashcardRecord {
        const now = new Date().toISOString();
        const existing = this.repository.getCardByBlockId(blockId);

        const record: FlashcardRecord = existing
            ? {
                  ...existing,
                  front: raw.front,
                  back: raw.back,
                  type: raw.type,
                  context: raw.context,
                  sourcePath,
                  updatedAt: now,
              }
            : {
                  blockId,
                  sourcePath,
                  type: raw.type,
                  front: raw.front,
                  back: raw.back,
                  context: raw.context,
                  fsrs: createDefaultFsrsState(new Date()),
                  createdAt: now,
                  updatedAt: now,
              };

        return this.repository.upsertCard(blockId, record);
    }

    upsertRecord(blockId: string, record: FlashcardRecord): FlashcardRecord {
        return this.repository.upsertCard(blockId, record);
    }

    getCardByBlockId(blockId: string): FlashcardRecord | null {
        return this.repository.getCardByBlockId(blockId);
    }

    getAllCards(): FlashcardRecord[] {
        return this.repository.getAllCards();
    }

    getDueCards(): FlashcardRecord[] {
        return this.repository.getDueCards(new Date());
    }

    deleteCard(blockId: string): boolean {
        return this.repository.deleteCard(blockId);
    }

    getData(): FlashcardData {
        return this.repository.getData();
    }

    getCardsBySourcePath(sourcePath: string): FlashcardRecord[] {
        return this.repository.getCardsBySourcePath(sourcePath);
    }

    removeMissingCardsFromSource(
        sourcePath: string,
        retainedBlockIds: Set<string>
    ): number {
        return this.repository.removeMissingCardsFromSource(
            sourcePath,
            retainedBlockIds
        );
    }

    removeCardsBySourcePath(sourcePath: string): number {
        return this.repository.removeCardsBySourcePath(sourcePath);
    }

    renameSourcePath(oldPath: string, newPath: string): number {
        return this.repository.renameSourcePath(oldPath, newPath);
    }

    getDataFilePath(): string {
        return this.repository.getDataFilePath();
    }

    getAssetsDirectory(): string {
        return this.repository.getAssetsDirectory();
    }

    async reviewCard(blockId: string, rating: ReviewRating): Promise<void> {
        const record = this.repository.getCardByBlockId(blockId);
        if (!record) return;

        const now = new Date();
        record.fsrs = this.scheduler.review(record.fsrs, rating, now);
        record.updatedAt = now.toISOString();
        this.repository.upsertCard(blockId, record);
        await this.save();
    }
}
