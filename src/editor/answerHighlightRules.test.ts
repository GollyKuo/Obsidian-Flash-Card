import { describe, expect, it } from "vitest";
import { FlashcardParser } from "../parser/FlashcardParser";
import {
    collectAnswerHighlightRanges,
    collectClozeTokenRanges,
} from "./answerHighlightRules";

describe("collectAnswerHighlightRanges", () => {
    const parser = new FlashcardParser();

    it("highlights cloze syntax when cloze scope is enabled", () => {
        const lines = ["閱讀寫作、==批判思考==、溝通力"];
        const ranges = collectAnswerHighlightRanges({
            lines,
            lineNumber: 0,
            parser,
            scopes: new Set(["cloze"]),
        });

        expect(ranges).toEqual([{ from: 5, to: 13 }]);
    });

    it("highlights single-line forward answer only", () => {
        const lines = ["概念 :: 正向答案"];
        const ranges = collectAnswerHighlightRanges({
            lines,
            lineNumber: 0,
            parser,
            scopes: new Set(["single-line"]),
        });

        expect(ranges).toEqual([{ from: 6, to: 10 }]);
    });

    it("highlights reverse answer only", () => {
        const lines = ["解釋 ;; 概念"];
        const ranges = collectAnswerHighlightRanges({
            lines,
            lineNumber: 0,
            parser,
            scopes: new Set(["single-line"]),
        });

        expect(ranges).toEqual([{ from: 6, to: 8 }]);
    });

    it("highlights bidirectional right side only", () => {
        const lines = ["單字 ::: 翻譯"];
        const ranges = collectAnswerHighlightRanges({
            lines,
            lineNumber: 0,
            parser,
            scopes: new Set(["bidirectional"]),
        });

        expect(ranges).toEqual([{ from: 7, to: 9 }]);
    });

    it("highlights multiline answer lines without indent", () => {
        const lines = ["問題 ::", "    第一行答案", "    第二行答案", "下一段"];
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

        expect(firstLineRanges).toEqual([{ from: 4, to: 9 }]);
        expect(secondLineRanges).toEqual([{ from: 4, to: 9 }]);
    });
});

describe("collectClozeTokenRanges", () => {
    const parser = new FlashcardParser();

    it("extracts full token and inner content range", () => {
        const ranges = collectClozeTokenRanges({
            line: "閱讀寫作、==批判思考==、溝通力",
            parser,
        });

        expect(ranges).toEqual([
            {
                from: 5,
                to: 13,
                contentFrom: 7,
                contentTo: 11,
                content: "批判思考",
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
});
