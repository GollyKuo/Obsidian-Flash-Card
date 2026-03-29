export interface FlashcardsPluginSettings {
    dataDirectory: string;
    autoSyncOnModify: boolean;
    aiEnabled: boolean;
    aiProvider: "gemini";
    aiModel: string;
    aiApiKey: string;
}

export const DEFAULT_SETTINGS: FlashcardsPluginSettings = {
    dataDirectory: "_Flashcards",
    autoSyncOnModify: true,
    aiEnabled: false,
    aiProvider: "gemini",
    aiModel: "gemini-3-flash",
    aiApiKey: "",
};
