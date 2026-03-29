import { describe, expect, it } from "vitest";
import { stripBlockIdsFromMarkdown } from "./blockIdCleanup";

describe("blockIdCleanup", () => {
    it("removes trailing block ids from markdown lines", () => {
        const input = [
            "Q1 :: A1 ^fc-aaa111",
            "Q2 :: A2 ^fc-bbb222",
            "Plain text",
        ].join("\n");

        const result = stripBlockIdsFromMarkdown(input);

        expect(result.idsRemoved).toBe(2);
        expect(result.content).toBe(["Q1 :: A1", "Q2 :: A2", "Plain text"].join("\n"));
    });

    it("keeps block-id-looking strings inside fenced code blocks", () => {
        const input = [
            "Outside :: keep clean ^fc-abc123",
            "```ts",
            "const example = 'Question :: Answer ^fc-inside01';",
            "```",
        ].join("\n");

        const result = stripBlockIdsFromMarkdown(input);

        expect(result.idsRemoved).toBe(1);
        expect(result.content).toBe(
            [
                "Outside :: keep clean",
                "```ts",
                "const example = 'Question :: Answer ^fc-inside01';",
                "```",
            ].join("\n")
        );
    });
});
