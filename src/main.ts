import { Notice, Plugin } from "obsidian";
import {
    FlashcardsRuntime,
    createFlashcardsRuntime,
} from "./app/createFlashcardsRuntime";
import { registerPluginUi } from "./app/registerPluginUi";
import { FlashcardsSettingTab } from "./settings/FlashcardsSettingTab";
import {
    DEFAULT_SETTINGS,
    FlashcardsPluginSettings,
} from "./settings/types";

// 引入樣式（由 esbuild + PostCSS 處理）
import "./styles/main.css";

export default class FlashcardsPlugin extends Plugin {
    settings: FlashcardsPluginSettings = { ...DEFAULT_SETTINGS };
    runtime!: FlashcardsRuntime;

    async onload(): Promise<void> {
        console.log("[Flashcards] 載入 AI-Enriched Flashcards 外掛");

        await this.loadSettings();
        this.applyAnswerHighlightScopeClasses();
        this.applyAnswerHighlightThemeVariables();

        this.runtime = createFlashcardsRuntime(this, () => this.settings);
        this.runtime.blockIdManager.registerEvents();
        this.runtime.syncService.registerEvents();

        registerPluginUi(this, this.runtime);
        this.addSettingTab(new FlashcardsSettingTab(this.app, this));

        await this.runtime.dataStore.load();

        new Notice("AI-Enriched Flashcards 已載入");
    }

    onunload(): void {
        if (this.runtime) {
            void this.runtime.dataStore.flushQueuedSave();
        }

        this.clearAnswerHighlightThemeVariables();

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
        this.settings.answerHighlightColor = this.normalizeHexColor(
            this.settings.answerHighlightColor
        );
        this.settings.answerHighlightOpacity = this.clampOpacity(
            this.settings.answerHighlightOpacity
        );
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
        this.applyAnswerHighlightScopeClasses();
        this.applyAnswerHighlightThemeVariables();
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

    private applyAnswerHighlightThemeVariables(): void {
        const rgb = this.hexToRgbTriplet(this.settings.answerHighlightColor);
        document.body.style.setProperty("--fc-answer-highlight-rgb", rgb);
        document.body.style.setProperty(
            "--fc-answer-highlight-opacity",
            String(this.settings.answerHighlightOpacity / 100)
        );
    }

    private clearAnswerHighlightThemeVariables(): void {
        document.body.style.removeProperty("--fc-answer-highlight-rgb");
        document.body.style.removeProperty("--fc-answer-highlight-opacity");
    }

    private hexToRgbTriplet(hex: string): string {
        const cleaned = this.normalizeHexColor(hex).replace(/^#/, "");
        if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) {
            return "77 77 77";
        }

        const r = parseInt(cleaned.slice(0, 2), 16);
        const g = parseInt(cleaned.slice(2, 4), 16);
        const b = parseInt(cleaned.slice(4, 6), 16);
        return `${r} ${g} ${b}`;
    }

    private normalizeHexColor(value: string): string {
        const cleaned = value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) {
            return cleaned;
        }

        return DEFAULT_SETTINGS.answerHighlightColor;
    }

    private clampOpacity(value: number): number {
        if (!Number.isFinite(value)) {
            return DEFAULT_SETTINGS.answerHighlightOpacity;
        }

        return Math.max(0, Math.min(100, Math.round(value)));
    }
}
