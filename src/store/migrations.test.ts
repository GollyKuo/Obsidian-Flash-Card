import { describe, expect, it } from "vitest";
import { FlashcardType } from "../parser/types";
import { FLASHCARD_DATA_VERSION } from "./types";
import { migrateFlashcardData } from "./migrations";

describe("migrateFlashcardData", () => {
    it("creates empty default data from invalid payload", () => {
        const result = migrateFlashcardData(null);

        expect(result.migrated).toBe(true);
        expect(result.data).toEqual({
            version: FLASHCARD_DATA_VERSION,
            cards: {},
        });
    });

    it("normalizes legacy cards with missing fields", () => {
        const result = migrateFlashcardData({
            version: "0.0.1",
            cards: {
                "fc-abc123": {
                    sourcePath: "note.md",
                    type: "forward",
                    front: "Q",
                    back: "A",
                },
            },
        });

        const card = result.data.cards["fc-abc123"];

        expect(result.migrated).toBe(true);
        expect(result.data.version).toBe(FLASHCARD_DATA_VERSION);
        expect(card.blockId).toBe("fc-abc123");
        expect(card.sourcePath).toBe("note.md");
        expect(card.type).toBe(FlashcardType.Forward);
        expect(card.fsrs.state).toBe("new");
        expect(typeof card.createdAt).toBe("string");
        expect(typeof card.updatedAt).toBe("string");
    });

    it("keeps stable payload values and only upgrades schema version", () => {
        const result = migrateFlashcardData({
            version: "1.0.0",
            cards: {
                "fc-good01": {
                    blockId: "fc-good01",
                    sourcePath: "deck.md",
                    type: "cloze",
                    front: "The capital is ==Taipei==.",
                    back: "The capital is ==Taipei==.",
                    fsrs: {
                        difficulty: 1,
                        stability: 2,
                        retrievability: 0.9,
                        due: "2026-03-29T00:00:00.000Z",
                        reps: 3,
                        lapses: 0,
                        state: "review",
                        lastReview: "2026-03-28T00:00:00.000Z",
                    },
                    createdAt: "2026-03-01T00:00:00.000Z",
                    updatedAt: "2026-03-28T00:00:00.000Z",
                    enrichment: {
                        explanation: "sample",
                    },
                },
            },
        });

        const card = result.data.cards["fc-good01"];

        expect(result.migrated).toBe(true);
        expect(card.type).toBe(FlashcardType.Cloze);
        expect(card.fsrs.state).toBe("review");
        expect(card.fsrs.reps).toBe(3);
        expect(card.enrichment?.explanation).toBe("sample");
    });
});
