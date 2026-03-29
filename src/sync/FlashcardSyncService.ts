import { MarkdownView, Plugin, TAbstractFile, TFile, debounce } from "obsidian";
import { FlashcardSyncEngine } from "./FlashcardSyncEngine";
import { SyncResult, VaultSyncResult } from "./types";
import { FlashcardsPluginSettings } from "../settings/types";
import { DataStore } from "../store/DataStore";

type SettingsAccessor = () => FlashcardsPluginSettings;

export class FlashcardSyncService {
    private plugin: Plugin;
    private engine: FlashcardSyncEngine;
    private dataStore: DataStore;
    private getSettings: SettingsAccessor;
    private syncModifiedFile: (file: TAbstractFile) => void;

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
        if (!view?.file) {
            return null;
        }

        const result = this.engine.syncDocument(
            view.file.path,
            view.editor.getValue()
        );

        await this.dataStore.save();
        return result;
    }

    async syncFile(file: TFile): Promise<SyncResult | null> {
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

    async syncVault(): Promise<VaultSyncResult> {
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
                const result = await this.syncFile(file);
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
    }

    private async handleModifiedFile(file: TAbstractFile): Promise<void> {
        if (!(file instanceof TFile) || !this.isMarkdownFile(file)) {
            return;
        }

        await this.syncFile(file);
    }

    private async handleRename(
        file: TAbstractFile,
        oldPath: string
    ): Promise<void> {
        if (!(file instanceof TFile) || !this.isMarkdownFile(file)) {
            return;
        }

        const renamedCount = this.dataStore.renameSourcePath(oldPath, file.path);
        const result = await this.syncFile(file);

        if (renamedCount > 0 || (result && this.hasChanges(result))) {
            this.dataStore.queueSave();
        }
    }

    private async handleDelete(file: TAbstractFile): Promise<void> {
        if (!(file instanceof TFile) || !this.isMarkdownFile(file)) {
            return;
        }

        const removedCount = this.dataStore.removeCardsBySourcePath(file.path);
        if (removedCount > 0) {
            this.dataStore.queueSave();
        }
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
}
