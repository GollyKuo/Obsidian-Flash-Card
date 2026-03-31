import { MarkdownView, Plugin } from "obsidian";
import { FlashcardsRuntime } from "./createFlashcardsRuntime";
import {
    collectAnswerHighlightRanges,
    collectClozeTokenRanges,
} from "../editor/answerHighlightRules";
import { FlashcardsPluginSettings } from "../settings/types";
import { ReviewModalContainer } from "../ui/ReviewModalContainer";

type SettingsAccessor = () => FlashcardsPluginSettings;

export interface UiActionResult {
    message: string;
    timeout: number;
    logTag?: string;
    logPayload?: unknown;
}

export class FlashcardsAppService {
    private plugin: Plugin;
    private runtime: FlashcardsRuntime;
    private getSettings: SettingsAccessor;

    constructor(
        plugin: Plugin,
        runtime: FlashcardsRuntime,
        getSettings: SettingsAccessor
    ) {
        this.plugin = plugin;
        this.runtime = runtime;
        this.getSettings = getSettings;
    }

    openReviewModal(): void {
        new ReviewModalContainer(this.plugin.app, this.runtime.dataStore).open();
    }

    async scanCurrentView(view: MarkdownView | null): Promise<UiActionResult> {
        const result = await this.runtime.syncService.syncCurrentView(view);
        if (!result) {
            return {
                message: "目前沒有開啟可掃描的 Markdown 文件",
                timeout: 6000,
            };
        }

        return {
            message: this.formatSyncNotice(result),
            timeout: 6000,
        };
    }

    async scanVault(): Promise<UiActionResult> {
        const summary = await this.runtime.syncService.syncVault();
        return {
            message: `整庫掃描完成：${summary.filesScanned} 個檔案，${summary.withBlockId} 張已編號卡片，新增 ${summary.newCount}，更新 ${summary.updatedCount}，移除 ${summary.removedCount}`,
            timeout: 8000,
        };
    }

    async stripAllBlockIds(): Promise<UiActionResult> {
        const summary =
            await this.runtime.blockIdCleanupService.stripAllBlockIdsFromVault();
        return {
            message: this.formatCleanupNotice(summary),
            timeout: 8000,
        };
    }

    createStatsResult(compact = false): UiActionResult {
        const allCards = this.runtime.dataStore.getAllCards();
        const dueCards = this.runtime.dataStore.getDueCards();

        if (compact) {
            return {
                message: `閃卡統計\n總數：${allCards.length}\n到期：${dueCards.length}`,
                timeout: 6000,
            };
        }

        const learning = allCards.filter(
            (card) => card.fsrs.state === "learning"
        ).length;
        const review = allCards.filter(
            (card) => card.fsrs.state === "review"
        ).length;
        const relearning = allCards.filter(
            (card) => card.fsrs.state === "relearning"
        ).length;

        return {
            message: `閃卡統計\n總數：${allCards.length}\n到期：${dueCards.length}\n新卡：${allCards.filter((card) => card.fsrs.state === "new").length} | 學習中：${learning} | 複習中：${review} | 重新學習：${relearning}`,
            timeout: 8000,
        };
    }

    buildAnswerHighlightDebugResult(view: MarkdownView | null): UiActionResult {
        if (!view) {
            return {
                message: "目前沒有開啟可診斷的 Markdown 文件",
                timeout: 6000,
            };
        }

        const cursor = view.editor.getCursor();
        const lineText = view.editor.getLine(cursor.line);
        const lines = view.editor.getValue().split("\n");
        const settings = this.getSettings();
        const scopes = new Set(settings.answerHighlightScopes);
        const highlightRanges = collectAnswerHighlightRanges({
            lines,
            lineNumber: cursor.line,
            parser: this.runtime.parser,
            scopes,
        });
        const clozeRanges = collectClozeTokenRanges({
            line: lineText,
            parser: this.runtime.parser,
        });

        const payload = {
            version: this.plugin.manifest.version,
            file: view.file?.path ?? "(unknown)",
            lineNumber: cursor.line + 1,
            scopes: settings.answerHighlightScopes,
            highlightRanges,
            clozeRanges,
            lineText,
        };

        return {
            message: `高亮診斷 v${payload.version}\n行 ${payload.lineNumber}\nscopes: ${payload.scopes.join(", ") || "(empty)"}\nanswers: ${payload.highlightRanges.length}\ncloze: ${payload.clozeRanges.length}\n詳情請看開發者主控台`,
            timeout: 12000,
            logTag: "[Flashcards][AnswerHighlightDebug]",
            logPayload: payload,
        };
    }

    private formatSyncNotice(result: {
        totalCards: number;
        withBlockId: number;
        noIdCount: number;
        newCount: number;
        updatedCount: number;
        removedCount: number;
    }): string {
        const lines = [
            `掃描完成：共解析 ${result.totalCards} 張卡片`,
            `已編號：${result.withBlockId} 張`,
        ];

        if (result.newCount > 0) {
            lines.push(`新增：${result.newCount} 張`);
        }

        if (result.updatedCount > 0) {
            lines.push(`更新：${result.updatedCount} 張`);
        }

        if (result.removedCount > 0) {
            lines.push(`移除：${result.removedCount} 張`);
        }

        if (result.noIdCount > 0) {
            lines.push(`待補 Block ID：${result.noIdCount} 張`);
        }

        return lines.join("\n");
    }

    private formatCleanupNotice(summary: {
        filesScanned: number;
        filesChanged: number;
        idsRemoved: number;
        cardsRemoved: number;
    }): string {
        if (summary.idsRemoved === 0) {
            return `清理完成：掃描 ${summary.filesScanned} 個檔案，未發現可移除的 Block ID`;
        }

        return `清理完成：掃描 ${summary.filesScanned} 個檔案，修改 ${summary.filesChanged} 個檔案，移除 ${summary.idsRemoved} 個 Block ID，刪除 ${summary.cardsRemoved} 筆卡片索引`;
    }
}
