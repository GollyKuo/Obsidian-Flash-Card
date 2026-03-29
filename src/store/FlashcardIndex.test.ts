import { describe, expect, it } from "vitest";
import { FlashcardType } from "../parser/types";
import { FlashcardRecord, createDefaultFsrsState } from "./types";
import { FlashcardIndex } from "./FlashcardIndex";

function createCard(params: {
    blockId: string;
    sourcePath: string;
    due: string;
}): FlashcardRecord {
    const now = "2026-03-29T00:00:00.000Z";
    return {
        blockId: params.blockId,
        sourcePath: params.sourcePath,
        type: FlashcardType.Forward,
        front: "Q",
        back: "A",
        fsrs: {
            ...createDefaultFsrsState(new Date(now)),
            due: params.due,
            state: "review",
        },
        createdAt: now,
        updatedAt: now,
    };
}

describe("FlashcardIndex", () => {
    it("indexes cards by source path", () => {
        const index = new FlashcardIndex();
        index.reindex({
            "fc-1": createCard({
                blockId: "fc-1",
                sourcePath: "a.md",
                due: "2026-03-30T00:00:00.000Z",
            }),
            "fc-2": createCard({
                blockId: "fc-2",
                sourcePath: "a.md",
                due: "2026-03-31T00:00:00.000Z",
            }),
            "fc-3": createCard({
                blockId: "fc-3",
                sourcePath: "b.md",
                due: "2026-04-01T00:00:00.000Z",
            }),
        });

        expect(index.getBlockIdsBySourcePath("a.md").sort()).toEqual([
            "fc-1",
            "fc-2",
        ]);
        expect(index.getBlockIdsBySourcePath("b.md")).toEqual(["fc-3"]);
    });

    it("returns due block ids using due-day index and timestamp check", () => {
        const index = new FlashcardIndex();
        index.reindex({
            "fc-due": createCard({
                blockId: "fc-due",
                sourcePath: "deck.md",
                due: "2026-03-29T01:00:00.000Z",
            }),
            "fc-later-same-day": createCard({
                blockId: "fc-later-same-day",
                sourcePath: "deck.md",
                due: "2026-03-29T23:59:00.000Z",
            }),
            "fc-future": createCard({
                blockId: "fc-future",
                sourcePath: "deck.md",
                due: "2026-03-30T00:00:00.000Z",
            }),
        });

        expect(
            index.getDueBlockIds(new Date("2026-03-29T12:00:00.000Z")).sort()
        ).toEqual(["fc-due"]);
    });

    it("keeps indexes in sync on upsert and delete", () => {
        const index = new FlashcardIndex();
        const previous = createCard({
            blockId: "fc-x",
            sourcePath: "old.md",
            due: "2026-03-29T00:00:00.000Z",
        });
        const next = createCard({
            blockId: "fc-x",
            sourcePath: "new.md",
            due: "2026-03-31T00:00:00.000Z",
        });

        index.onUpsert(null, previous);
        expect(index.getBlockIdsBySourcePath("old.md")).toEqual(["fc-x"]);

        index.onUpsert(previous, next);
        expect(index.getBlockIdsBySourcePath("old.md")).toEqual([]);
        expect(index.getBlockIdsBySourcePath("new.md")).toEqual(["fc-x"]);
        expect(index.getDueBlockIds(new Date("2026-03-29T12:00:00.000Z"))).toEqual(
            []
        );

        index.onDelete(next);
        expect(index.getBlockIdsBySourcePath("new.md")).toEqual([]);
    });
});
