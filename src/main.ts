import { Notice, Plugin } from "obsidian";
import {
    FlashcardsRuntime,
    createFlashcardsRuntime,
} from "./app/createFlashcardsRuntime";
import { registerPluginUi } from "./app/registerPluginUi";
import { ANSWER_HIGHLIGHT_SCOPES } from "./settings/answerHighlightScopes";
import { MULTI_LINE_ANSWER_RENDER_STYLES } from "./settings/multiLineAnswerRenderStyles";
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
        this.applyAnswerHighlightThemeVars();

        this.runtime = createFlashcardsRuntime(this, () => this.settings);
        await this.runtime.dataStore.load();

        this.runtime.blockIdManager.registerEvents();
        this.runtime.syncService.registerEvents();

        registerPluginUi(this, this.runtime, () => this.settings);
        this.addSettingTab(new FlashcardsSettingTab(this.app, this));

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

        if (
            !MULTI_LINE_ANSWER_RENDER_STYLES.includes(
                this.settings.multiLineAnswerRenderStyle
            )
        ) {
            this.settings.multiLineAnswerRenderStyle =
                DEFAULT_SETTINGS.multiLineAnswerRenderStyle;
        }

        this.settings.answerHighlightThemeOpacity = clampInteger(
            this.settings.answerHighlightThemeOpacity,
            8,
            60,
            DEFAULT_SETTINGS.answerHighlightThemeOpacity
        );

        this.settings.answerHighlightThemeColor = normalizeHexColor(
            this.settings.answerHighlightThemeColor,
            DEFAULT_SETTINGS.answerHighlightThemeColor
        );
        this.settings.answerHighlightChipColor = normalizeHexColor(
            this.settings.answerHighlightChipColor,
            DEFAULT_SETTINGS.answerHighlightChipColor
        );
        this.settings.answerHighlightSoftBandColor = normalizeHexColor(
            this.settings.answerHighlightSoftBandColor,
            DEFAULT_SETTINGS.answerHighlightSoftBandColor
        );
        this.settings.answerHighlightRightRailColor = normalizeHexColor(
            this.settings.answerHighlightRightRailColor,
            DEFAULT_SETTINGS.answerHighlightRightRailColor
        );
        this.settings.answerHighlightEnablePerStyleColors = Boolean(
            this.settings.answerHighlightEnablePerStyleColors
        );
    }

    async saveSettings(options?: { reloadDataStore?: boolean }): Promise<void> {
        const shouldReloadDataStore = options?.reloadDataStore ?? false;
        await this.saveData(this.settings);
        this.applyAnswerHighlightScopeClasses();
        this.applyAnswerHighlightThemeVars();
        this.app.workspace.updateOptions();

        if (shouldReloadDataStore && this.runtime) {
            await this.runtime.dataStore.load();
        }
    }

    private applyAnswerHighlightScopeClasses(): void {
        document.body.classList.toggle(
            "fc-answer-highlight-scope-cloze",
            this.settings.answerHighlightScopes.includes("cloze")
        );
    }

    private applyAnswerHighlightThemeVars(): void {
        const opacity = this.settings.answerHighlightThemeOpacity / 100;
        const usePerStyle = this.settings.answerHighlightEnablePerStyleColors;

        const baseColor = this.settings.answerHighlightThemeColor;
        const chipColor = usePerStyle
            ? this.settings.answerHighlightChipColor
            : baseColor;
        const softBandColor = usePerStyle
            ? this.settings.answerHighlightSoftBandColor
            : baseColor;
        const rightRailColor = usePerStyle
            ? this.settings.answerHighlightRightRailColor
            : baseColor;

        const chipBgAlpha = clampNumber(opacity, 0.08, 0.7);
        const chipBorderAlpha = clampNumber(opacity + 0.08, 0.14, 0.82);
        const softBandAlpha = clampNumber(opacity, 0.08, 0.68);

        document.body.style.setProperty(
            "--fc-answer-chip-bg",
            toRgbaString(chipColor, chipBgAlpha)
        );
        document.body.style.setProperty(
            "--fc-answer-chip-border",
            toRgbaString(chipColor, chipBorderAlpha)
        );
        document.body.style.setProperty(
            "--fc-answer-soft-band-bg",
            toRgbaString(softBandColor, softBandAlpha)
        );
        document.body.style.setProperty(
            "--fc-answer-right-rail-color",
            rightRailColor
        );
    }
}

function clampInteger(
    value: number | undefined,
    min: number,
    max: number,
    fallback: number
): number {
    if (typeof value !== "number" || Number.isNaN(value)) {
        return fallback;
    }
    return Math.min(max, Math.max(min, Math.round(value)));
}

function clampNumber(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function normalizeHexColor(value: string | undefined, fallback: string): string {
    if (typeof value !== "string") {
        return fallback;
    }

    const trimmed = value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
        return trimmed;
    }
    if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
        const r = trimmed[1];
        const g = trimmed[2];
        const b = trimmed[3];
        return `#${r}${r}${g}${g}${b}${b}`;
    }
    return fallback;
}

function toRgbaString(hex: string, alpha: number): string {
    const normalized = normalizeHexColor(hex, "#3a3f47");
    const r = parseInt(normalized.slice(1, 3), 16);
    const g = parseInt(normalized.slice(3, 5), 16);
    const b = parseInt(normalized.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${clampNumber(alpha, 0, 1).toFixed(3)})`;
}
