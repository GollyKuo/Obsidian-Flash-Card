import { normalizePath, Plugin, TFile, TFolder } from "obsidian";
import {
    FLASHCARD_DATA_VERSION,
    FlashcardData,
    FlashcardRecord,
    createEmptyFlashcardData,
} from "./types";
import { FlashcardsPluginSettings } from "../settings/types";
import { FlashcardIndex } from "./FlashcardIndex";
import { migrateFlashcardData } from "./migrations";
import {
    createShardedStorageManifest,
    getCardStoragePath,
    isShardedStorageManifest,
} from "./shardedStorage";

type SettingsAccessor = () => FlashcardsPluginSettings;

export class FlashcardRepository {
    private plugin: Plugin;
    private getSettings: SettingsAccessor;
    private data: FlashcardData = createEmptyFlashcardData();
    private index = new FlashcardIndex();
    private dirtyCardIds = new Set<string>();
    private deletedCardIds = new Set<string>();
    private manifestDirty = false;

    constructor(plugin: Plugin, getSettings: SettingsAccessor) {
        this.plugin = plugin;
        this.getSettings = getSettings;
    }

    async load(): Promise<FlashcardData> {
        try {
            await this.ensureStorageReady();

            const file = this.plugin.app.vault.getAbstractFileByPath(
                this.getDataFilePath()
            );

            if (file instanceof TFile) {
                const content = await this.plugin.app.vault.read(file);
                const raw = JSON.parse(content) as unknown;

                if (isShardedStorageManifest(raw)) {
                    const loaded = await this.loadShardedData(raw);
                    this.data = loaded.data;

                    if (loaded.migrated) {
                        this.markAllCardsDirty();
                        this.manifestDirty = true;
                        await this.save();
                    }
                } else {
                    const migrated = migrateFlashcardData(raw);
                    this.data = migrated.data;
                    this.markAllCardsDirty();
                    this.manifestDirty = true;
                    await this.save();
                }
            } else {
                this.data = createEmptyFlashcardData();
                this.manifestDirty = true;
                await this.save();
            }
        } catch (error) {
            console.error("[Flashcards] Failed to load repository data", error);
            this.data = createEmptyFlashcardData();
        }

        this.rebuildIndexes();
        this.clearDirtyState();
        return this.data;
    }

    async save(): Promise<void> {
        await this.ensureStorageReady();

        if (
            this.dirtyCardIds.size === 0 &&
            this.deletedCardIds.size === 0 &&
            !this.manifestDirty
        ) {
            return;
        }

        for (const blockId of this.deletedCardIds) {
            await this.removeCardFile(blockId);
        }

        for (const blockId of this.dirtyCardIds) {
            const card = this.data.cards[blockId];
            if (!card) {
                continue;
            }

            const path = getCardStoragePath(this.getCardsDirectory(), blockId);
            await this.writeJsonFile(path, card);
        }

        await this.writeManifest();
        this.clearDirtyState();
    }

    getData(): FlashcardData {
        return this.data;
    }

    getAllCards(): FlashcardRecord[] {
        return Object.values(this.data.cards);
    }

    getDueCards(now: Date = new Date()): FlashcardRecord[] {
        return this.index
            .getDueBlockIds(now)
            .map((blockId) => this.data.cards[blockId])
            .filter((card): card is FlashcardRecord => !!card);
    }

    getCardByBlockId(blockId: string): FlashcardRecord | null {
        return this.data.cards[blockId] ?? null;
    }

    getCardsBySourcePath(sourcePath: string): FlashcardRecord[] {
        return this.index
            .getBlockIdsBySourcePath(sourcePath)
            .map((blockId) => this.data.cards[blockId])
            .filter((card): card is FlashcardRecord => !!card);
    }

    upsertCard(blockId: string, card: FlashcardRecord): FlashcardRecord {
        const previous = this.data.cards[blockId] ?? null;
        this.data.cards[blockId] = card;
        this.index.onUpsert(previous, card);
        this.deletedCardIds.delete(blockId);
        this.dirtyCardIds.add(blockId);
        if (!previous) {
            this.manifestDirty = true;
        }
        return card;
    }

    deleteCard(blockId: string): boolean {
        const existing = this.data.cards[blockId] ?? null;
        if (!existing) {
            return false;
        }

        this.index.onDelete(existing);
        delete this.data.cards[blockId];
        this.dirtyCardIds.delete(blockId);
        this.deletedCardIds.add(blockId);
        this.manifestDirty = true;
        return true;
    }

    renameSourcePath(oldPath: string, newPath: string): number {
        const blockIds = this.index.getBlockIdsBySourcePath(oldPath);
        if (blockIds.length === 0) {
            return 0;
        }

        let updatedCount = 0;
        for (const blockId of blockIds) {
            const card = this.data.cards[blockId];
            if (!card) {
                continue;
            }

            this.index.onDelete(card);
            card.sourcePath = newPath;
            card.updatedAt = new Date().toISOString();
            this.index.onUpsert(null, card);
            this.dirtyCardIds.add(blockId);
            updatedCount++;
        }

        return updatedCount;
    }

    removeCardsBySourcePath(sourcePath: string): number {
        const blockIds = this.index.getBlockIdsBySourcePath(sourcePath);
        let removedCount = 0;

        for (const blockId of blockIds) {
            if (this.deleteCard(blockId)) {
                removedCount++;
            }
        }

        return removedCount;
    }

    removeMissingCardsFromSource(
        sourcePath: string,
        retainedBlockIds: Set<string>
    ): number {
        const blockIds = this.index.getBlockIdsBySourcePath(sourcePath);
        let removedCount = 0;

        for (const blockId of blockIds) {
            if (retainedBlockIds.has(blockId)) {
                continue;
            }

            if (this.deleteCard(blockId)) {
                removedCount++;
            }
        }

        return removedCount;
    }

    getDataDirectory(): string {
        return normalizePath(
            this.getSettings().dataDirectory.trim() || "_Flashcards"
        );
    }

    getDataFilePath(): string {
        return normalizePath(`${this.getDataDirectory()}/data.json`);
    }

    getAssetsDirectory(): string {
        return normalizePath(`${this.getDataDirectory()}/Assets`);
    }

    getCardsDirectory(): string {
        return normalizePath(`${this.getDataDirectory()}/Cards`);
    }

    private async ensureStorageReady(): Promise<void> {
        await this.ensureDirectory(this.getDataDirectory());
        await this.ensureDirectory(this.getAssetsDirectory());
        await this.ensureDirectory(this.getCardsDirectory());
    }

    private async ensureDirectory(dirPath: string): Promise<void> {
        const existing = this.plugin.app.vault.getAbstractFileByPath(dirPath);

        if (!existing) {
            try {
                await this.plugin.app.vault.createFolder(dirPath);
            } catch (error: unknown) {
                if (!this.isAlreadyExistsError(error)) {
                    throw error;
                }
            }
            return;
        }

        if (!(existing instanceof TFolder)) {
            console.warn(
                `[Flashcards] ${dirPath} exists but is not a folder in the vault`
            );
        }
    }

    private async safeCreate(path: string, content: string): Promise<void> {
        try {
            await this.plugin.app.vault.create(path, content);
        } catch (error: unknown) {
            if (this.isAlreadyExistsError(error)) {
                await this.plugin.app.vault.adapter.write(path, content);
                return;
            }

            throw error;
        }
    }

    private isAlreadyExistsError(error: unknown): boolean {
        const message = error instanceof Error ? error.message : String(error);
        return message.includes("already exists");
    }

    private isMissingFileError(error: unknown): boolean {
        const message = error instanceof Error ? error.message : String(error);
        return message.includes("ENOENT") || message.includes("no such file");
    }

    private rebuildIndexes(): void {
        this.index.reindex(this.data.cards);
    }

    private markAllCardsDirty(): void {
        for (const blockId of Object.keys(this.data.cards)) {
            this.dirtyCardIds.add(blockId);
        }
    }

    private clearDirtyState(): void {
        this.dirtyCardIds.clear();
        this.deletedCardIds.clear();
        this.manifestDirty = false;
    }

    private async loadShardedData(rawManifest: {
        version: string;
        cardIds: string[];
    }): Promise<{ data: FlashcardData; migrated: boolean }> {
        const cards: Record<string, FlashcardRecord> = {};
        let migrated = rawManifest.version !== FLASHCARD_DATA_VERSION;

        for (const blockId of rawManifest.cardIds) {
            const path = getCardStoragePath(this.getCardsDirectory(), blockId);
            const file = this.plugin.app.vault.getAbstractFileByPath(path);
            if (!(file instanceof TFile)) {
                migrated = true;
                continue;
            }

            try {
                const content = await this.plugin.app.vault.read(file);
                const rawCard = JSON.parse(content) as unknown;
                const migratedCardData = migrateFlashcardData({
                    version: rawManifest.version,
                    cards: {
                        [blockId]: rawCard,
                    },
                });

                migrated ||= migratedCardData.migrated;

                const migratedCard = Object.values(migratedCardData.data.cards)[0];
                if (!migratedCard) {
                    migrated = true;
                    continue;
                }

                cards[migratedCard.blockId] = migratedCard;
                if (migratedCard.blockId !== blockId) {
                    migrated = true;
                    this.deletedCardIds.add(blockId);
                }
            } catch (error) {
                console.error(
                    `[Flashcards] Failed to read sharded card file: ${path}`,
                    error
                );
                migrated = true;
            }
        }

        return {
            migrated,
            data: {
                version: FLASHCARD_DATA_VERSION,
                cards,
            },
        };
    }

    private async writeManifest(): Promise<void> {
        const manifest = createShardedStorageManifest(
            FLASHCARD_DATA_VERSION,
            Object.keys(this.data.cards)
        );

        await this.writeJsonFile(this.getDataFilePath(), manifest);
    }

    private async writeJsonFile(path: string, value: unknown): Promise<void> {
        const content = JSON.stringify(value, null, 2);
        const file = this.plugin.app.vault.getAbstractFileByPath(path);

        if (file instanceof TFile) {
            await this.plugin.app.vault.modify(file, content);
        } else {
            await this.safeCreate(path, content);
        }
    }

    private async removeCardFile(blockId: string): Promise<void> {
        const path = getCardStoragePath(this.getCardsDirectory(), blockId);

        try {
            await this.plugin.app.vault.adapter.remove(path);
        } catch (error: unknown) {
            if (!this.isMissingFileError(error)) {
                throw error;
            }
        }
    }
}
