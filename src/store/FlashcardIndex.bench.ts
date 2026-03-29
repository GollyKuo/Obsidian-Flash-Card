import { bench, describe } from "vitest";
import { FlashcardType } from "../parser/types";
import { FlashcardIndex } from "./FlashcardIndex";
import { FlashcardRecord, createDefaultFsrsState } from "./types";

function createCard(index: number, sourcePathPool: string[]): FlashcardRecord {
    const now = new Date("2026-03-29T00:00:00.000Z");
    const due = new Date(now.getTime() + (index % 30) * 24 * 60 * 60 * 1000);

    return {
        blockId: `fc-${index.toString(36).padStart(6, "0")}`,
        sourcePath: sourcePathPool[index % sourcePathPool.length],
        type: FlashcardType.Forward,
        front: `Q-${index}`,
        back: `A-${index}`,
        fsrs: {
            ...createDefaultFsrsState(now),
            due: due.toISOString(),
            state: "review",
        },
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
    };
}

function createDataset(size: number): Record<string, FlashcardRecord> {
    const sourcePathPool = Array.from({ length: 100 }, (_, idx) => {
        return `deck-${idx}.md`;
    });

    const cards: Record<string, FlashcardRecord> = {};
    for (let i = 0; i < size; i++) {
        const card = createCard(i, sourcePathPool);
        cards[card.blockId] = card;
    }

    return cards;
}

function runQueryWorkload(index: FlashcardIndex): void {
    index.getBlockIdsBySourcePath("deck-10.md");
    index.getBlockIdsBySourcePath("deck-55.md");
    index.getDueBlockIds(new Date("2026-04-10T00:00:00.000Z"));
    index.getDueBlockIds(new Date("2026-04-20T00:00:00.000Z"));
}

describe("FlashcardIndex benchmark", () => {
    const cards1k = createDataset(1000);
    const cards5k = createDataset(5000);

    bench("reindex-1k", () => {
        const index = new FlashcardIndex();
        index.reindex(cards1k);
    });

    bench("reindex-5k", () => {
        const index = new FlashcardIndex();
        index.reindex(cards5k);
    });

    bench("query-workload-1k", () => {
        const index = new FlashcardIndex();
        index.reindex(cards1k);
        runQueryWorkload(index);
    });

    bench("query-workload-5k", () => {
        const index = new FlashcardIndex();
        index.reindex(cards5k);
        runQueryWorkload(index);
    });
});
