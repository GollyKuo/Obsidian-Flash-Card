import { MarkdownView, Notice, Plugin } from "obsidian";
import { FlashcardsRuntime } from "./createFlashcardsRuntime";
import { FlashcardsAppService, UiActionResult } from "./FlashcardsAppService";
import { FlashcardsPluginSettings } from "../settings/types";

type SettingsAccessor = () => FlashcardsPluginSettings;

export function registerPluginUi(
    plugin: Plugin,
    runtime: FlashcardsRuntime,
    getSettings: SettingsAccessor
): void {
    const appService = new FlashcardsAppService(plugin, runtime, getSettings);

    const showNotice = (result: UiActionResult): void => {
        if (result.logTag && result.logPayload) {
            console.log(result.logTag, result.logPayload);
        }

        new Notice(result.message, result.timeout);
    };

    const scanCurrentFile = async (): Promise<void> => {
        const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
        showNotice(await appService.scanCurrentView(view));
    };

    const scanVault = async (): Promise<void> => {
        showNotice(await appService.scanVault());
    };

    const stripAllBlockIds = async (): Promise<void> => {
        showNotice(await appService.stripAllBlockIds());
    };

    const showStats = (): void => {
        showNotice(appService.createStatsResult(false));
    };

    const showCompactStats = (): void => {
        showNotice(appService.createStatsResult(true));
    };

    const showAnswerHighlightDebug = (): void => {
        const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
        const result = appService.buildAnswerHighlightDebugResult(view);
        showNotice(result);
    };

    plugin.addCommand({
        id: "scan-current-file",
        name: "掃描目前文件中的閃卡",
        callback: scanCurrentFile,
    });

    plugin.addCommand({
        id: "scan-all-files",
        name: "重建整個 Vault 的閃卡索引",
        callback: scanVault,
    });

    plugin.addCommand({
        id: "strip-all-block-ids",
        name: "移除 Vault 內所有閃卡 Block ID",
        callback: stripAllBlockIds,
    });

    plugin.addCommand({
        id: "show-stats",
        name: "顯示閃卡統計",
        callback: showStats,
    });

    plugin.addCommand({
        id: "start-review",
        name: "開始閃卡複習",
        callback: () => appService.openReviewModal(),
    });

    plugin.addCommand({
        id: "debug-answer-highlight",
        name: "顯示答案高亮診斷",
        callback: showAnswerHighlightDebug,
    });

    plugin.addRibbonIcon("scan", "掃描目前文件中的閃卡", scanCurrentFile);
    plugin.addRibbonIcon("refresh-cw", "重建整個 Vault 的閃卡索引", scanVault);
    plugin.addRibbonIcon("eraser", "移除 Vault 內所有閃卡 Block ID", stripAllBlockIds);
    plugin.addRibbonIcon("graduation-cap", "開始閃卡複習", () =>
        appService.openReviewModal()
    );
    plugin.addRibbonIcon("bar-chart", "顯示閃卡統計", showCompactStats);
}
