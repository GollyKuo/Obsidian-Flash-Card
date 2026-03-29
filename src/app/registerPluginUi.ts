import { MarkdownView, Notice, Plugin } from "obsidian";
import { FlashcardsRuntime } from "./createFlashcardsRuntime";
import { ReviewModalContainer } from "../ui/ReviewModalContainer";

export function registerPluginUi(
    plugin: Plugin,
    runtime: FlashcardsRuntime
): void {
    const openReview = () => {
        new ReviewModalContainer(plugin.app, runtime.dataStore).open();
    };

    plugin.addCommand({
        id: "scan-current-file",
        name: "掃描目前文件中的閃卡",
        callback: async () => {
            const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
            const result = await runtime.syncService.syncCurrentView(view);

            if (!result) {
                new Notice("目前沒有開啟可掃描的 Markdown 文件");
                return;
            }

            new Notice(formatSyncNotice(result), 6000);
        },
    });

    plugin.addCommand({
        id: "scan-all-files",
        name: "重建整個 Vault 的閃卡索引",
        callback: async () => {
            const summary = await runtime.syncService.syncVault();
            new Notice(
                `整庫掃描完成：${summary.filesScanned} 個檔案，${summary.withBlockId} 張已編號卡片，新增 ${summary.newCount}，更新 ${summary.updatedCount}，移除 ${summary.removedCount}`,
                8000
            );
        },
    });

    plugin.addCommand({
        id: "strip-all-block-ids",
        name: "移除 Vault 內所有閃卡 Block ID",
        callback: async () => {
            const summary =
                await runtime.blockIdCleanupService.stripAllBlockIdsFromVault();
            new Notice(formatCleanupNotice(summary), 8000);
        },
    });

    plugin.addCommand({
        id: "show-stats",
        name: "顯示閃卡統計",
        callback: () => {
            const allCards = runtime.dataStore.getAllCards();
            const dueCards = runtime.dataStore.getDueCards();

            const learning = allCards.filter(
                (card) => card.fsrs.state === "learning"
            ).length;
            const review = allCards.filter(
                (card) => card.fsrs.state === "review"
            ).length;
            const relearning = allCards.filter(
                (card) => card.fsrs.state === "relearning"
            ).length;

            new Notice(
                `閃卡統計\n總數：${allCards.length}\n到期：${dueCards.length}\n新卡：${allCards.filter((card) => card.fsrs.state === "new").length} | 學習中：${learning} | 複習中：${review} | 重新學習：${relearning}`,
                8000
            );
        },
    });

    plugin.addCommand({
        id: "start-review",
        name: "開始閃卡複習",
        callback: openReview,
    });

    plugin.addRibbonIcon("scan", "掃描目前文件中的閃卡", async () => {
        const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
        const result = await runtime.syncService.syncCurrentView(view);

        if (!result) {
            new Notice("目前沒有開啟可掃描的 Markdown 文件");
            return;
        }

        new Notice(formatSyncNotice(result), 6000);
    });

    plugin.addRibbonIcon("refresh-cw", "重建整個 Vault 的閃卡索引", async () => {
        const summary = await runtime.syncService.syncVault();
        new Notice(
            `整庫掃描完成：${summary.filesScanned} 個檔案，${summary.withBlockId} 張已編號卡片，新增 ${summary.newCount}，更新 ${summary.updatedCount}，移除 ${summary.removedCount}`,
            8000
        );
    });

    plugin.addRibbonIcon("eraser", "移除 Vault 內所有閃卡 Block ID", async () => {
        const summary =
            await runtime.blockIdCleanupService.stripAllBlockIdsFromVault();
        new Notice(formatCleanupNotice(summary), 8000);
    });

    plugin.addRibbonIcon("graduation-cap", "開始閃卡複習", openReview);

    plugin.addRibbonIcon("bar-chart", "顯示閃卡統計", () => {
        const allCards = runtime.dataStore.getAllCards();
        const dueCards = runtime.dataStore.getDueCards();

        new Notice(
            `閃卡統計\n總數：${allCards.length}\n到期：${dueCards.length}`,
            6000
        );
    });
}

function formatSyncNotice(result: {
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

function formatCleanupNotice(summary: {
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
