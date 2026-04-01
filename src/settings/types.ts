import { AnswerHighlightScope } from "./answerHighlightScopes";
import { MultiLineAnswerRenderStyle } from "./multiLineAnswerRenderStyles";
import { SingleLineAnswerRenderStyle } from "./singleLineAnswerRenderStyles";

export interface FlashcardsPluginSettings {
    dataDirectory: string;
    autoSyncOnModify: boolean;
    answerHighlightScopes: AnswerHighlightScope[];
    singleLineAnswerRenderStyle: SingleLineAnswerRenderStyle;
    multiLineAnswerRenderStyle: MultiLineAnswerRenderStyle;
    answerHighlightThemeColor: string;
    answerHighlightThemeOpacity: number;
    answerHighlightEnablePerStyleColors: boolean;
    answerHighlightChipColor: string;
    answerHighlightSoftBandColor: string;
    answerHighlightRightRailColor: string;
    aiEnabled: boolean;
    aiProvider: "gemini";
    aiModel: string;
    aiApiKey: string;
}

export const DEFAULT_SETTINGS: FlashcardsPluginSettings = {
    dataDirectory: "_Flashcards",
    autoSyncOnModify: true,
    answerHighlightScopes: ["cloze"],
    singleLineAnswerRenderStyle: "chip",
    multiLineAnswerRenderStyle: "soft-band",
    answerHighlightThemeColor: "#3a3f47",
    answerHighlightThemeOpacity: 28,
    answerHighlightEnablePerStyleColors: false,
    answerHighlightChipColor: "#3a3f47",
    answerHighlightSoftBandColor: "#3a3f47",
    answerHighlightRightRailColor: "#4f6ea6",
    aiEnabled: false,
    aiProvider: "gemini",
    aiModel: "gemini-3-flash",
    aiApiKey: "",
};
