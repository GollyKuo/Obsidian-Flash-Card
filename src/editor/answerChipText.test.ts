import { describe, expect, it } from "vitest";
import { toAnswerChipText } from "./answerChipText";

describe("toAnswerChipText", () => {
    it("unwraps cloze text", () => {
        expect(toAnswerChipText("==維護==")).toBe("維護");
    });

    it("renders wikilink alias text", () => {
        expect(
            toAnswerChipText(
                '[[「維護」是讓一切持續運轉的力量|「維護」才是讓一切持續運轉的力量]]'
            )
        ).toBe("「維護」才是讓一切持續運轉的力量");
    });

    it("renders wikilink basename when no alias is provided", () => {
        expect(toAnswerChipText("[[folder/image.png]]")).toBe("image.png");
    });

    it("renders markdown links as their label text", () => {
        expect(toAnswerChipText("[官方文件](https://example.com)")).toBe(
            "官方文件"
        );
    });
});
