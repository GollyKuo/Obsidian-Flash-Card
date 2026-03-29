import { describe, expect, it } from "vitest";
import { FlashcardParser } from "../parser/FlashcardParser";
import {
    appendBlockId,
    hasBlockId,
    shouldAttachBlockIdOnBlur,
} from "./blockIdRules";

describe("blockIdRules", () => {
    it("appends block id once and keeps existing ids untouched", () => {
        expect(appendBlockId("Q :: A", "fc-test01")).toBe("Q :: A ^fc-test01");
        expect(appendBlockId("Q :: A ^fc-kept99", "fc-new001")).toBe(
            "Q :: A ^fc-kept99"
        );
    });

    it("detects block id suffix reliably", () => {
        expect(hasBlockId("Question :: Answer ^fc-abc123")).toBe(true);
        expect(hasBlockId("Question :: Answer")).toBe(false);
    });

    it("decides auto-attach on blur for single-line and multiline cards", () => {
        const parser = new FlashcardParser();

        const single = shouldAttachBlockIdOnBlur({
            parser,
            lineContent: "Question :: Answer",
            lineNumber: 0,
            allLines: ["Question :: Answer"],
        });

        const multiline = shouldAttachBlockIdOnBlur({
            parser,
            lineContent: "Question ::",
            lineNumber: 0,
            allLines: ["Question ::", "    First line", "    Second line"],
        });

        const plainText = shouldAttachBlockIdOnBlur({
            parser,
            lineContent: "Just a normal note line",
            lineNumber: 0,
            allLines: ["Just a normal note line"],
        });

        expect(single).toBe(true);
        expect(multiline).toBe(true);
        expect(plainText).toBe(false);
    });
});
