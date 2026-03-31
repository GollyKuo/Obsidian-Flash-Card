import { describe, expect, it } from "vitest";
import { FlashcardParser } from "../parser/FlashcardParser";
import {
    collectAnswerHighlightRanges,
    collectClozeTokenRanges,
    collectFlashcardSyntaxTokenRanges,
    collectMultilineAnswerBlock,
    collectMultilineAnswerRange,
} from "./answerHighlightRules";

describe("collectAnswerHighlightRanges", () => {
    const parser = new FlashcardParser();

    it("highlights cloze syntax when cloze scope is enabled", () => {
        const lines = ["This is ==test== line"];
        const ranges = collectAnswerHighlightRanges({
            lines,
            lineNumber: 0,
            parser,
            scopes: new Set(["cloze"]),
        });

        expect(ranges).toEqual([{ from: 8, to: 16 }]);
    });

    it("highlights single-line forward answer only", () => {
        const lines = ["Question :: Answer"];
        const ranges = collectAnswerHighlightRanges({
            lines,
            lineNumber: 0,
            parser,
            scopes: new Set(["single-line"]),
        });

        expect(ranges).toEqual([{ from: 12, to: 18 }]);
    });

    it("highlights inline single-line answer without optional spaces", () => {
        const lines = ["Read {{fcwriting :: critical thinking/fc}} now"];
        const ranges = collectAnswerHighlightRanges({
            lines,
            lineNumber: 0,
            parser,
            scopes: new Set(["single-line"]),
        });

        expect(ranges).toEqual([{ from: 20, to: 37 }]);
    });

    it("highlights inline single-line answer with optional spaces", () => {
        const lines = ["Read {{fc writing :: critical thinking /fc}} now"];
        const ranges = collectAnswerHighlightRanges({
            lines,
            lineNumber: 0,
            parser,
            scopes: new Set(["single-line"]),
        });

        expect(ranges).toEqual([{ from: 21, to: 38 }]);
    });

    it("highlights inline cloze token when cloze scope is enabled", () => {
        const lines = [
            "Read {{fcability :: writing, ==critical thinking==, judgement/fc}} now",
        ];
        const ranges = collectAnswerHighlightRanges({
            lines,
            lineNumber: 0,
            parser,
            scopes: new Set(["cloze"]),
        });

        expect(ranges).toEqual([{ from: 29, to: 50 }]);
    });

    it("highlights inline cloze wrapper token when cloze scope is enabled", () => {
        const lines = ["Read {{fc writing, ==critical thinking==, judgement /fc}} now"];
        const ranges = collectAnswerHighlightRanges({
            lines,
            lineNumber: 0,
            parser,
            scopes: new Set(["cloze"]),
        });

        expect(ranges).toEqual([{ from: 19, to: 40 }]);
    });

    it("prefers inline cloze token over full-back replacement when both scopes are enabled", () => {
        const lines = [
            "Read {{fcability :: writing, ==critical thinking==, judgement/fc}} now",
        ];
        const ranges = collectAnswerHighlightRanges({
            lines,
            lineNumber: 0,
            parser,
            scopes: new Set(["single-line", "cloze"]),
        });

        expect(ranges).toEqual([{ from: 29, to: 50 }]);
    });

    it("returns empty range list for deprecated inline syntax with colon", () => {
        const lines = ["Read {{fc: writing :: critical thinking/fc}} now"];
        const ranges = collectAnswerHighlightRanges({
            lines,
            lineNumber: 0,
            parser,
            scopes: new Set(["single-line", "cloze"]),
        });

        expect(ranges).toEqual([]);
    });

    it("returns empty range list for malformed inline wrapper syntax", () => {
        const lines = ["Read {{fcwriting :: critical thinking/fc} now"];
        const ranges = collectAnswerHighlightRanges({
            lines,
            lineNumber: 0,
            parser,
            scopes: new Set(["single-line", "cloze"]),
        });

        expect(ranges).toEqual([]);
    });

    it("highlights reverse answer only", () => {
        const lines = ["Answer ;; Question"];
        const ranges = collectAnswerHighlightRanges({
            lines,
            lineNumber: 0,
            parser,
            scopes: new Set(["single-line"]),
        });

        expect(ranges).toEqual([{ from: 10, to: 18 }]);
    });

    it("highlights bidirectional right side only", () => {
        const lines = ["A ::: B"];
        const ranges = collectAnswerHighlightRanges({
            lines,
            lineNumber: 0,
            parser,
            scopes: new Set(["bidirectional"]),
        });

        expect(ranges).toEqual([{ from: 6, to: 7 }]);
    });

    it("highlights multiline answer lines without indent", () => {
        const lines = ["Prompt ::", "    line one", "    line two", "tail"];
        const firstLineRanges = collectAnswerHighlightRanges({
            lines,
            lineNumber: 1,
            parser,
            scopes: new Set(["multi-line"]),
        });
        const secondLineRanges = collectAnswerHighlightRanges({
            lines,
            lineNumber: 2,
            parser,
            scopes: new Set(["multi-line"]),
        });

        expect(firstLineRanges).toEqual([{ from: 4, to: 12 }]);
        expect(secondLineRanges).toEqual([{ from: 4, to: 12 }]);
    });
});

describe("collectClozeTokenRanges", () => {
    const parser = new FlashcardParser();

    it("extracts full token and inner content range", () => {
        const ranges = collectClozeTokenRanges({
            line: "This is ==test== line",
            parser,
        });

        expect(ranges).toEqual([
            {
                from: 8,
                to: 16,
                contentFrom: 10,
                contentTo: 14,
                content: "test",
            },
        ]);
    });

    it("supports multiple cloze tokens in one line", () => {
        const ranges = collectClozeTokenRanges({
            line: "A ==one== B ==two==",
            parser,
        });

        expect(ranges).toEqual([
            {
                from: 2,
                to: 9,
                contentFrom: 4,
                contentTo: 7,
                content: "one",
            },
            {
                from: 12,
                to: 19,
                contentFrom: 14,
                contentTo: 17,
                content: "two",
            },
        ]);
    });

    it("extracts cloze token ranges from inline syntax", () => {
        const ranges = collectClozeTokenRanges({
            line: "Read {{fcability :: writing, ==critical thinking==, judgement/fc}} now",
            parser,
        });

        expect(ranges).toEqual([
            {
                from: 29,
                to: 50,
                contentFrom: 31,
                contentTo: 48,
                content: "critical thinking",
            },
        ]);
    });

    it("extracts cloze token ranges from inline cloze wrapper syntax", () => {
        const ranges = collectClozeTokenRanges({
            line: "Read {{fc writing, ==critical thinking==, judgement /fc}} now",
            parser,
        });

        expect(ranges).toEqual([
            {
                from: 19,
                to: 40,
                contentFrom: 21,
                contentTo: 38,
                content: "critical thinking",
            },
        ]);
    });

    it("returns empty cloze ranges for malformed inline wrapper syntax", () => {
        const ranges = collectClozeTokenRanges({
            line: "Read {{fcwriting :: ==critical thinking==/fc} now",
            parser,
        });

        expect(ranges).toEqual([]);
    });
});

describe("collectFlashcardSyntaxTokenRanges", () => {
    const parser = new FlashcardParser();

    it("extracts inline open, delimiter and close tokens without optional spaces", () => {
        const ranges = collectFlashcardSyntaxTokenRanges({
            lines: ["Read {{fcwriting :: critical thinking/fc}} now"],
            lineNumber: 0,
            parser,
        });

        expect(ranges).toEqual([
            { from: 5, to: 9 },
            { from: 16, to: 20 },
            { from: 37, to: 42 },
        ]);
    });

    it("extracts inline open, delimiter and close tokens with optional spaces", () => {
        const ranges = collectFlashcardSyntaxTokenRanges({
            lines: ["Read {{fc writing :: critical thinking /fc}} now"],
            lineNumber: 0,
            parser,
        });

        expect(ranges).toEqual([
            { from: 5, to: 10 },
            { from: 17, to: 21 },
            { from: 38, to: 44 },
        ]);
    });

    it("extracts inline cloze wrapper open and close tokens", () => {
        const ranges = collectFlashcardSyntaxTokenRanges({
            lines: ["Read {{fc writing, ==critical thinking==, judgement /fc}} now"],
            lineNumber: 0,
            parser,
        });

        expect(ranges).toEqual([
            { from: 5, to: 10 },
            { from: 51, to: 57 },
        ]);
    });

    it("returns empty syntax token ranges for deprecated inline syntax with colon", () => {
        const ranges = collectFlashcardSyntaxTokenRanges({
            lines: ["Read {{fc: writing :: critical thinking/fc}} now"],
            lineNumber: 0,
            parser,
        });

        expect(ranges).toEqual([]);
    });

    it("returns empty syntax token ranges for malformed inline wrapper syntax", () => {
        const ranges = collectFlashcardSyntaxTokenRanges({
            lines: ["Read {{fcwriting :: critical thinking/fc} now"],
            lineNumber: 0,
            parser,
        });

        expect(ranges).toEqual([]);
    });

    it("extracts forward delimiter token only", () => {
        const ranges = collectFlashcardSyntaxTokenRanges({
            lines: ["Question :: Answer"],
            lineNumber: 0,
            parser,
        });

        expect(ranges).toEqual([{ from: 9, to: 11 }]);
    });

    it("extracts reverse delimiter token only", () => {
        const ranges = collectFlashcardSyntaxTokenRanges({
            lines: ["Answer ;; Question"],
            lineNumber: 0,
            parser,
        });

        expect(ranges).toEqual([{ from: 7, to: 9 }]);
    });

    it("extracts bidirectional delimiter token only", () => {
        const ranges = collectFlashcardSyntaxTokenRanges({
            lines: ["A ::: B"],
            lineNumber: 0,
            parser,
        });

        expect(ranges).toEqual([{ from: 2, to: 5 }]);
    });

    it("extracts multiline question delimiter token only", () => {
        const ranges = collectFlashcardSyntaxTokenRanges({
            lines: ["Prompt ::", "    Answer"],
            lineNumber: 0,
            parser,
        });

        expect(ranges).toEqual([{ from: 7, to: 9 }]);
    });
});

describe("collectMultilineAnswerRange", () => {
    const parser = new FlashcardParser();

    it("returns range for answer lines in multiline cards", () => {
        const lines = ["Prompt ::", "    line one", "    line two", "tail"];

        expect(
            collectMultilineAnswerRange({
                lines,
                lineNumber: 1,
                parser,
            })
        ).toEqual({ from: 4, to: 12 });
    });

    it("returns null for non-answer lines", () => {
        const lines = ["Prompt ::", "    line one", "tail"];

        expect(
            collectMultilineAnswerRange({
                lines,
                lineNumber: 0,
                parser,
            })
        ).toBeNull();
        expect(
            collectMultilineAnswerRange({
                lines,
                lineNumber: 2,
                parser,
            })
        ).toBeNull();
    });
});

describe("collectMultilineAnswerBlock", () => {
    const parser = new FlashcardParser();

    it("returns multiline block bounds for nested answer lines", () => {
        const lines = [
            "Prompt ::",
            "    - First answer",
            "        - Nested answer",
            "Outside",
        ];

        expect(
            collectMultilineAnswerBlock({
                lines,
                lineNumber: 2,
                parser,
            })
        ).toEqual({
            from: 8,
            to: 23,
            startLineNumber: 0,
            endLineNumber: 2,
            blockIndentColumns: 4,
        });
    });
});
