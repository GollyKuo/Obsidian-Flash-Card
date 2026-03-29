import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import { DEFAULT_SETTINGS } from "./types";
import type FlashcardsPlugin from "../main";

export class FlashcardsSettingTab extends PluginSettingTab {
    private plugin: FlashcardsPlugin;

    constructor(app: App, plugin: FlashcardsPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl("h2", { text: "AI-Enriched Flashcards 設定" });

        new Setting(containerEl)
            .setName("資料目錄")
            .setDesc("flashcard 狀態與資產資料夾位置，預設為 _Flashcards")
            .addText((text) => {
                text.setPlaceholder(DEFAULT_SETTINGS.dataDirectory);
                text.setValue(this.plugin.settings.dataDirectory);
                text.onChange((value) => {
                    this.plugin.settings.dataDirectory =
                        value.trim() || DEFAULT_SETTINGS.dataDirectory;
                });
                text.inputEl.addEventListener("change", async () => {
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("自動同步 Markdown 變更")
            .setDesc("當 Markdown 檔案被修改、重新命名或刪除時，自動同步 flashcard 索引")
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.autoSyncOnModify);
                toggle.onChange(async (value) => {
                    this.plugin.settings.autoSyncOnModify = value;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("目前資料檔路徑")
            .setDesc(this.plugin.dataStore.getDataFilePath());

        containerEl.createEl("h3", { text: "AI 設定（預留）" });

        new Setting(containerEl)
            .setName("啟用 AI 功能")
            .setDesc("預留開關。啟用後，未來可使用卡片 enrich 與多模態流程")
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.aiEnabled);
                toggle.onChange(async (value) => {
                    this.plugin.settings.aiEnabled = value;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("AI Provider")
            .setDesc("目前預留 Gemini，後續可擴充其他模型供應商")
            .addDropdown((dropdown) => {
                dropdown.addOption("gemini", "Gemini");
                dropdown.setValue(this.plugin.settings.aiProvider);
                dropdown.onChange(async (value) => {
                    this.plugin.settings.aiProvider = value as "gemini";
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("AI Model")
            .setDesc("預設 gemini-3-flash，可依需求調整")
            .addText((text) => {
                text.setPlaceholder(DEFAULT_SETTINGS.aiModel);
                text.setValue(this.plugin.settings.aiModel);
                text.onChange(async (value) => {
                    this.plugin.settings.aiModel =
                        value.trim() || DEFAULT_SETTINGS.aiModel;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Gemini API Key（預留）")
            .setDesc("目前僅儲存於 plugin settings，實際呼叫流程將於後續版本接入")
            .addText((text) => {
                text.inputEl.type = "password";
                text.setPlaceholder("AIza...");
                text.setValue(this.plugin.settings.aiApiKey);
                text.onChange(async (value) => {
                    this.plugin.settings.aiApiKey = value.trim();
                    await this.plugin.saveSettings();
                });
            });

        containerEl.createEl("h3", { text: "維護工具" });

        new Setting(containerEl)
            .setName("移除所有閃卡 Block ID")
            .setDesc("清理 Vault 內所有 `^fc-xxxxxx`，並同步刪除對應卡片索引")
            .addButton((button) => {
                button.setButtonText("開始清理");
                button.setCta();
                button.onClick(async () => {
                    button.setDisabled(true);
                    try {
                        const summary =
                            await this.plugin.runtime.blockIdCleanupService.stripAllBlockIdsFromVault();
                        new Notice(
                            summary.idsRemoved > 0
                                ? `清理完成：修改 ${summary.filesChanged} 個檔案，移除 ${summary.idsRemoved} 個 Block ID，刪除 ${summary.cardsRemoved} 筆索引`
                                : `清理完成：掃描 ${summary.filesScanned} 個檔案，未發現可移除的 Block ID`,
                            8000
                        );
                    } finally {
                        button.setDisabled(false);
                    }
                });
            });
    }
}
