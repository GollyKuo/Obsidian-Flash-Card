import { AnswerHighlightScope } from "./answerHighlightScopes";
import { MultiLineAnswerRenderStyle } from "./multiLineAnswerRenderStyles";

export interface FlashcardsPluginSettings {
    dataDirectory: string;
    autoSyncOnModify: boolean;
    answerHighlightScopes: AnswerHighlightScope[];
    multiLineAnswerRenderStyle: MultiLineAnswerRenderStyle;
    aiEnabled: boolean;
    aiProvider: "gemini";
    aiModel: string;
    aiApiKey: string;
}

export const DEFAULT_SETTINGS: FlashcardsPluginSettings = {
    dataDirectory: "_Flashcards",
    autoSyncOnModify: true,
    answerHighlightScopes: ["cloze"],
    multiLineAnswerRenderStyle: "soft-band",
    aiEnabled: false,
    aiProvider: "gemini",
    aiModel: "gemini-3-flash",
    aiApiKey: "",
};
