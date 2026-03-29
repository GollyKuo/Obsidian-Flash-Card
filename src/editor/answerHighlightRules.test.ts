import { describe, expect, it } from "vitest";
import { FlashcardParser } from "../parser/FlashcardParser";
import { collectAnswerHighlightRanges } from "./answerHighlightRules";

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
