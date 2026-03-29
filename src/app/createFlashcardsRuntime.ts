import { Plugin } from "obsidian";
import { BlockIdManager } from "../blockid/BlockIdManager";
import { BlockIdCleanupService } from "../blockid/BlockIdCleanupService";
import { createAnswerHighlighterExtension } from "../editor/AnswerHighlighter";
import { blockIdHiderExtension } from "../editor/BlockIdHider";
import { blockIdPreviewCleaner } from "../editor/registerBlockIdPreviewCleaner";
import { FlashcardParser } from "../parser/FlashcardParser";
import { FsrsScheduler } from "../review/FsrsScheduler";
import { FlashcardsPluginSettings } from "../settings/types";
import { DataStore } from "../store/DataStore";
import { FlashcardSyncEngine } from "../sync/FlashcardSyncEngine";
import { FlashcardSyncService } from "../sync/FlashcardSyncService";

type SettingsAccessor = () => FlashcardsPluginSettings;

export interface FlashcardsRuntime {
    parser: FlashcardParser;
    dataStore: DataStore;
    blockIdManager: BlockIdManager;
    blockIdCleanupService: BlockIdCleanupService;
    syncService: FlashcardSyncService;
}

export function createFlashcardsRuntime(
    plugin: Plugin,
    getSettings: SettingsAccessor
): FlashcardsRuntime {
    const parser = new FlashcardParser();
    const dataStore = new DataStore(plugin, getSettings, new FsrsScheduler());
    const syncEngine = new FlashcardSyncEngine(parser, dataStore);
    const syncService = new FlashcardSyncService(
        plugin,
        syncEngine,
        dataStore,
        getSettings
    );
    const blockIdManager = new BlockIdManager(plugin, parser);
    const blockIdCleanupService = new BlockIdCleanupService(plugin, syncService);

    plugin.registerEditorExtension(blockIdHiderExtension);
    plugin.registerEditorExtension(
        createAnswerHighlighterExtension(parser, getSettings)
    );
    plugin.registerMarkdownPostProcessor(blockIdPreviewCleaner);

    return {
        parser,
        dataStore,
        blockIdManager,
        blockIdCleanupService,
        syncService,
    };
}
