import { describe, expect, it } from "vitest";
import { FlashcardParser } from "./FlashcardParser";
import { FlashcardType } from "./types";

describe("FlashcardParser", () => {
    it("parses multiline cards and preserves header context", () => {
        const parser = new FlashcardParser();
        const cards = parser.parseDocument(
            "# Biology\nCell ::\n    The basic unit of life\n    Present in all organisms"
        );

        expect(cards).toHaveLength(1);
        expect(cards[0]).toMatchObject({
            type: FlashcardType.Forward,
            front: "Cell",
            back: "The basic unit of life\nPresent in all organisms",
            context: {
                headers: ["# Biology"],
                parentIndent: "",
            },
        });
    });

    it("parses cloze cards and keeps cloze positions", () => {
        const parser = new FlashcardParser();
        const card = parser.parseLine("Water boils at ==100°C==.", 0);

        expect(card).not.toBeNull();
        expect(card).toMatchObject({
            type: FlashcardType.Cloze,
            front: "Water boils at ==100°C==.",
        });
        expect(card?.clozePositions).toEqual([
            {
                start: 15,
                end: 24,
                text: "100°C",
            },
        ]);
    });
});
