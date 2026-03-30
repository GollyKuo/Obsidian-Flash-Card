import { Notice, Plugin } from "obsidian";
import {
    FlashcardsRuntime,
    createFlashcardsRuntime,
} from "./app/createFlashcardsRuntime";
import { registerPluginUi } from "./app/registerPluginUi";
import { ANSWER_HIGHLIGHT_SCOPES } from "./settings/answerHighlightScopes";
import { FlashcardsSettingTab } from "./settings/FlashcardsSettingTab";
import {
    DEFAULT_SETTINGS,
    FlashcardsPluginSettings,
} from "./settings/types";

// 引入樣式（由 esbuild + PostCSS 處理）
import "./styles/main.css";
import "./styles/editor.css";

export default class FlashcardsPlugin extends Plugin {
    settings: FlashcardsPluginSettings = { ...DEFAULT_SETTINGS };
    runtime!: FlashcardsRuntime;

    async onload(): Promise<void> {
        console.log("[Flashcards] 載入 AI-Enriched Flashcards 外掛");

        await this.loadSettings();
        this.applyAnswerHighlightScopeClasses();

        this.runtime = createFlashcardsRuntime(this, () => this.settings);
        this.runtime.blockIdManager.registerEvents();
        this.runtime.syncService.registerEvents();

        registerPluginUi(this, this.runtime, () => this.settings);
        this.addSettingTab(new FlashcardsSettingTab(this.app, this));

        await this.runtime.dataStore.load();

        new Notice(`AI-Enriched Flashcards 已載入 v${this.manifest.version}`);
    }

    onunload(): void {
        if (this.runtime) {
            void this.runtime.dataStore.flushQueuedSave();
        }

        console.log("[Flashcards] 卸載 AI-Enriched Flashcards 外掛");
    }

    get dataStore() {
        return this.runtime.dataStore;
    }

    async loadSettings(): Promise<void> {
        const saved =
            (await this.loadData()) as Partial<FlashcardsPluginSettings> | null;
        this.settings = {
            ...DEFAULT_SETTINGS,
            ...saved,
        };

        const validScopes = new Set(ANSWER_HIGHLIGHT_SCOPES);
        const restoredScopes = Array.isArray(this.settings.answerHighlightScopes)
            ? this.settings.answerHighlightScopes.filter((scope) =>
                  validScopes.has(scope)
              )
            : [];
        this.settings.answerHighlightScopes =
            restoredScopes.length > 0 ? restoredScopes : ["cloze"];
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
        this.applyAnswerHighlightScopeClasses();
        this.app.workspace.updateOptions();

        if (this.runtime) {
            await this.runtime.dataStore.load();
        }
    }

    private applyAnswerHighlightScopeClasses(): void {
        document.body.classList.toggle(
            "fc-answer-highlight-scope-cloze",
            this.settings.answerHighlightScopes.includes("cloze")
        );
    }
}
