import { describe, expect, it } from "vitest";
import {
    hasInlineFlashcardMarkers,
    matchInlineClozeCard,
    matchInlineForwardCard,
} from "./inlineFlashcardSyntax";

describe("inlineFlashcardSyntax", () => {
    it("matches inline syntax without optional spaces", () => {
        const match = matchInlineForwardCard(
            "Read {{fcwriting :: critical thinking/fc}} now"
        );

        expect(match).not.toBeNull();
        expect(match).toMatchObject({
            front: "writing",
            back: "critical thinking",
            openTokenFrom: 5,
            openTokenTo: 9,
            delimiterFrom: 16,
            delimiterTo: 20,
            closeTokenFrom: 37,
            closeTokenTo: 42,
        });
    });

    it("matches inline syntax with optional spaces around front and back", () => {
        const match = matchInlineForwardCard(
            "Read {{fc writing :: critical thinking /fc}} now"
        );

        expect(match).not.toBeNull();
        expect(match).toMatchObject({
            front: "writing",
            back: "critical thinking",
        });
    });

    it("accepts mixed optional spaces for inline forward syntax", () => {
        const frontSpaced = matchInlineForwardCard(
            "Read {{fc writing :: critical thinking/fc}} now"
        );
        const backSpaced = matchInlineForwardCard(
            "Read {{fcwriting :: critical thinking /fc}} now"
        );

        expect(frontSpaced).toMatchObject({
            front: "writing",
            back: "critical thinking",
        });
        expect(backSpaced).toMatchObject({
            front: "writing",
            back: "critical thinking",
        });
    });

    it("matches inline cloze wrapper syntax without :: delimiter", () => {
        const match = matchInlineClozeCard(
            "Read {{fc writing, ==critical thinking==, judgement /fc}} now"
        );

        expect(match).not.toBeNull();
        expect(match).toMatchObject({
            content: "writing, ==critical thinking==, judgement",
            openTokenFrom: 5,
            openTokenTo: 10,
            closeTokenFrom: 51,
            closeTokenTo: 57,
        });
    });

    it("matches inline cloze wrapper syntax without optional spaces", () => {
        const match = matchInlineClozeCard(
            "Read {{fcwriting, ==critical thinking==, judgement/fc}} now"
        );

        expect(match).not.toBeNull();
        expect(match).toMatchObject({
            content: "writing, ==critical thinking==, judgement",
        });
    });

    it("rejects missing front or back", () => {
        expect(matchInlineForwardCard("{{fc :: answer/fc}}")).toBeNull();
        expect(matchInlineForwardCard("{{fcfront :: /fc}}")).toBeNull();
    });

    it("detects inline wrapper markers", () => {
        expect(hasInlineFlashcardMarkers("{{fcfoo :: bar/fc}} and more")).toBe(true);
        expect(hasInlineFlashcardMarkers("plain text")).toBe(false);
    });

    it("rejects inline cloze wrapper with no cloze token", () => {
        expect(
            matchInlineClozeCard("Read {{fc writing, critical thinking, judgement /fc}} now")
        ).toBeNull();
    });
});
