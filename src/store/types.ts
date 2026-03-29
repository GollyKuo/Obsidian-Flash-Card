import { CardContext, FlashcardType } from "../parser/types";

export const FLASHCARD_DATA_VERSION = "1.1.0";

export interface FSRSState {
    difficulty: number;
    stability: number;
    retrievability: number;
    due: string;
    reps: number;
    lapses: number;
    state: "new" | "learning" | "review" | "relearning";
    lastReview?: string;
}

export interface FlashcardRecord {
    blockId: string;
    sourcePath: string;
    type: FlashcardType;
    front: string;
    back: string;
    context?: CardContext;
    fsrs: FSRSState;
    createdAt: string;
    updatedAt: string;
    enrichment?: {
        explanation?: string;
        imagePath?: string;
        audioPath?: string;
    };
}

export interface FlashcardData {
    version: string;
    cards: Record<string, FlashcardRecord>;
}

export function createDefaultFsrsState(now: Date = new Date()): FSRSState {
    return {
        difficulty: 0,
        stability: 0,
        retrievability: 0,
        due: now.toISOString(),
        reps: 0,
        lapses: 0,
        state: "new",
    };
}

export function createEmptyFlashcardData(): FlashcardData {
    return {
        version: FLASHCARD_DATA_VERSION,
        cards: {},
    };
}
