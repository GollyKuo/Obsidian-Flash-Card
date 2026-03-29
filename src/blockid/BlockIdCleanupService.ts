import { Plugin, TFile } from "obsidian";
import { FlashcardSyncService } from "../sync/FlashcardSyncService";
import { stripBlockIdsFromMarkdown } from "./blockIdCleanup";

export interface BlockIdCleanupSummary {
    filesScanned: number;
    filesChanged: number;
    idsRemoved: number;
    cardsRemoved: number;
}

export class BlockIdCleanupService {
    private plugin: Plugin;
    private syncService: FlashcardSyncService;

    constructor(plugin: Plugin, syncService: FlashcardSyncService) {
        this.plugin = plugin;
        this.syncService = syncService;
    }

    async stripAllBlockIdsFromVault(): Promise<BlockIdCleanupSummary> {
        const markdownFiles = this.plugin.app.vault.getMarkdownFiles();
        let filesChanged = 0;
        let idsRemoved = 0;

        for (const file of markdownFiles) {
            const removedInFile = await this.stripFileBlockIds(file);
            if (removedInFile <= 0) {
                continue;
            }

            filesChanged++;
            idsRemoved += removedInFile;
        }

        let cardsRemoved = 0;
        if (idsRemoved > 0) {
            const syncSummary = await this.syncService.syncVault();
            cardsRemoved = syncSummary.removedCount;
        }

        return {
            filesScanned: markdownFiles.length,
            filesChanged,
            idsRemoved,
            cardsRemoved,
        };
    }

    private async stripFileBlockIds(file: TFile): Promise<number> {
        const content = await this.plugin.app.vault.read(file);
        if (!content.includes("^fc-")) {
            return 0;
        }

        let removedInProcess = 0;
        await this.plugin.app.vault.process(file, (latestContent) => {
            const cleaned = stripBlockIdsFromMarkdown(latestContent);
            removedInProcess = cleaned.idsRemoved;
            return cleaned.content;
        });

        return removedInProcess;
    }
}
