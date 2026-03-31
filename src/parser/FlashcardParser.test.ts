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
        const card = parser.parseLine("Water boils at ==100C==.", 0);

        expect(card).not.toBeNull();
        expect(card).toMatchObject({
            type: FlashcardType.Cloze,
            front: "Water boils at ==100C==.",
        });
        expect(card?.clozePositions).toEqual([
            {
                start: 15,
                end: 23,
                text: "100C",
            },
        ]);
    });

    it("parses inline syntax without optional spaces", () => {
        const parser = new FlashcardParser();
        const card = parser.parseLine(
            "Read {{fcwriting :: critical thinking/fc}} now",
            0
        );

        expect(card).toMatchObject({
            type: FlashcardType.Forward,
            front: "writing",
            back: "critical thinking",
        });
    });

    it("parses inline syntax with optional spaces", () => {
        const parser = new FlashcardParser();
        const card = parser.parseLine(
            "Read {{fc writing :: critical thinking /fc}} now",
            0
        );

        expect(card).toMatchObject({
            type: FlashcardType.Forward,
            front: "writing",
            back: "critical thinking",
        });
    });

    it("parses inline cloze wrapper syntax", () => {
        const parser = new FlashcardParser();
        const card = parser.parseLine(
            "Read {{fc writing, ==critical thinking==, judgement /fc}} now",
            0
        );

        expect(card).toMatchObject({
            type: FlashcardType.Cloze,
            front: "writing, ==critical thinking==, judgement",
            back: "writing, ==critical thinking==, judgement",
        });
        expect(card?.clozePositions).toEqual([
            {
                start: 9,
                end: 30,
                text: "critical thinking",
            },
        ]);
    });

    it("rejects deprecated inline syntax with colon", () => {
        const parser = new FlashcardParser();
        const card = parser.parseLine(
            "Read {{fc: writing :: critical thinking/fc}} now",
            0
        );

        expect(card).toBeNull();
    });

    it("rejects malformed inline wrapper instead of falling back to plain :: parsing", () => {
        const parser = new FlashcardParser();
        const card = parser.parseLine(
            "Read {{fcwriting :: critical thinking/fc} now",
            0
        );

        expect(card).toBeNull();
    });
});
