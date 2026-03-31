import { MarkdownView, Plugin, TAbstractFile, TFile, debounce } from "obsidian";
import { FlashcardSyncEngine } from "./FlashcardSyncEngine";
import {
    SyncResult,
    VaultSyncResult,
    SyncStatusListener,
    SyncStatusState,
} from "./types";
import { FlashcardsPluginSettings } from "../settings/types";
import { DataStore } from "../store/DataStore";

type SettingsAccessor = () => FlashcardsPluginSettings;

export class FlashcardSyncService {
    private plugin: Plugin;
    private engine: FlashcardSyncEngine;
    private dataStore: DataStore;
    private getSettings: SettingsAccessor;
    private syncModifiedFile: (file: TAbstractFile) => void;
    private syncStatusListeners = new Set<SyncStatusListener>();
    private syncStatus: SyncStatusState = {
        phase: "idle",
        activeJobs: 0,
        lastSyncedAt: null,
        lastError: null,
    };

    constructor(
        plugin: Plugin,
        engine: FlashcardSyncEngine,
        dataStore: DataStore,
        getSettings: SettingsAccessor
    ) {
        this.plugin = plugin;
        this.engine = engine;
        this.dataStore = dataStore;
        this.getSettings = getSettings;
        this.syncModifiedFile = debounce(
            (file: TAbstractFile) => {
                void this.handleModifiedFile(file);
            },
            600,
            true
        );
    }

    registerEvents(): void {
        this.plugin.registerEvent(
            this.plugin.app.vault.on("modify", (file) => {
                if (!this.getSettings().autoSyncOnModify) {
                    return;
                }

                this.syncModifiedFile(file);
            })
        );

        this.plugin.registerEvent(
            this.plugin.app.vault.on("rename", (file, oldPath) => {
                void this.handleRename(file, oldPath);
            })
        );

        this.plugin.registerEvent(
            this.plugin.app.vault.on("delete", (file) => {
                void this.handleDelete(file);
            })
        );
    }

    async syncCurrentView(view: MarkdownView | null): Promise<SyncResult | null> {
        return this.runTrackedSync(async () => {
            if (!view?.file) {
                return null;
            }

            const result = this.engine.syncDocument(
                view.file.path,
                view.editor.getValue()
            );

            await this.dataStore.save();
            return result;
        });
    }

    async syncFile(file: TFile): Promise<SyncResult | null> {
        return this.runTrackedSync(() => this.syncFileCore(file));
    }

    async syncVault(): Promise<VaultSyncResult> {
        return this.runTrackedSync(async () => {
            return this.dataStore.runInSaveBatch(async () => {
                const markdownFiles = this.plugin.app.vault.getMarkdownFiles();
                const summary: VaultSyncResult = {
                    filesScanned: 0,
                    totalCards: 0,
                    withBlockId: 0,
                    noIdCount: 0,
                    newCount: 0,
                    updatedCount: 0,
                    removedCount: 0,
                };

                for (const file of markdownFiles) {
                    const result = await this.syncFileCore(file);
                    if (!result) {
                        continue;
                    }

                    summary.filesScanned++;
                    summary.totalCards += result.totalCards;
                    summary.withBlockId += result.withBlockId;
                    summary.noIdCount += result.noIdCount;
                    summary.newCount += result.newCount;
                    summary.updatedCount += result.updatedCount;
                    summary.removedCount += result.removedCount;
                }

                return summary;
            });
        });
    }

    getSyncStatus(): SyncStatusState {
        return { ...this.syncStatus };
    }

    onSyncStatusChange(listener: SyncStatusListener): () => void {
        this.syncStatusListeners.add(listener);
        return () => {
            this.syncStatusListeners.delete(listener);
        };
    }

    private async syncFileCore(file: TFile): Promise<SyncResult | null> {
        if (!this.isMarkdownFile(file)) {
            return null;
        }

        const content = await this.plugin.app.vault.read(file);
        const result = this.engine.syncDocument(file.path, content);

        if (this.hasChanges(result)) {
            this.dataStore.queueSave();
        }

        return result;
    }

    private async handleModifiedFile(file: TAbstractFile): Promise<void> {
        if (!(file instanceof TFile) || !this.isMarkdownFile(file)) {
            return;
        }

        await this.runTrackedSync(() => this.syncFileCore(file));
    }

    private async handleRename(
        file: TAbstractFile,
        oldPath: string
    ): Promise<void> {
        if (!(file instanceof TFile) || !this.isMarkdownFile(file)) {
            return;
        }

        await this.runTrackedSync(async () => {
            const renamedCount = this.dataStore.renameSourcePath(
                oldPath,
                file.path
            );
            const result = await this.syncFileCore(file);

            if (renamedCount > 0 || (result && this.hasChanges(result))) {
                this.dataStore.queueSave();
            }
        });
    }

    private async handleDelete(file: TAbstractFile): Promise<void> {
        if (!(file instanceof TFile) || !this.isMarkdownFile(file)) {
            return;
        }

        await this.runTrackedSync(async () => {
            const removedCount = this.dataStore.removeCardsBySourcePath(file.path);
            if (removedCount > 0) {
                this.dataStore.queueSave();
            }
        });
    }

    private hasChanges(result: SyncResult): boolean {
        return (
            result.newCount > 0 ||
            result.updatedCount > 0 ||
            result.removedCount > 0
        );
    }

    private isMarkdownFile(file: TFile): boolean {
        return file.extension === "md";
    }

    private async runTrackedSync<T>(work: () => Promise<T>): Promise<T> {
        this.syncStatus.activeJobs += 1;
        this.syncStatus.phase = "syncing";
        this.emitSyncStatus();

        try {
            const result = await work();
            this.syncStatus.lastSyncedAt = new Date().toISOString();
            this.syncStatus.lastError = null;
            return result;
        } catch (error) {
            this.syncStatus.lastError =
                error instanceof Error ? error.message : String(error);
            throw error;
        } finally {
            this.syncStatus.activeJobs = Math.max(
                0,
                this.syncStatus.activeJobs - 1
            );
            this.syncStatus.phase =
                this.syncStatus.activeJobs > 0
                    ? "syncing"
                    : this.syncStatus.lastError
                      ? "error"
                      : "idle";
            this.emitSyncStatus();
        }
    }

    private emitSyncStatus(): void {
        const snapshot = this.getSyncStatus();
        for (const listener of this.syncStatusListeners) {
            listener(snapshot);
        }
    }
}
