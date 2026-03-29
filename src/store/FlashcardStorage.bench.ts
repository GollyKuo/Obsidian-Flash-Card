import { bench, describe } from "vitest";
import { FlashcardType } from "../parser/types";
import { createShardedStorageManifest } from "./shardedStorage";
import { FlashcardRecord, createDefaultFsrsState } from "./types";

function createCard(index: number): FlashcardRecord {
    const now = new Date("2026-03-29T00:00:00.000Z");
    return {
        blockId: `fc-${index.toString(36).padStart(6, "0")}`,
        sourcePath: `deck-${index % 100}.md`,
        type: FlashcardType.Forward,
        front: `Question-${index}`,
        back: `Answer-${index}`,
        fsrs: {
            ...createDefaultFsrsState(now),
            due: new Date(
                now.getTime() + (index % 30) * 24 * 60 * 60 * 1000
            ).toISOString(),
            state: "review",
        },
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
    };
}

function createCardsMap(size: number): Record<string, FlashcardRecord> {
    const cards: Record<string, FlashcardRecord> = {};
    for (let i = 0; i < size; i++) {
        const card = createCard(i);
        cards[card.blockId] = card;
    }
    return cards;
}

describe("Flashcard storage benchmark", () => {
    const cards5k = createCardsMap(5000);
    const cardIds = Object.keys(cards5k);
    const targetBlockId = cardIds[2500];
    const targetCard = {
        ...cards5k[targetBlockId],
        back: `${cards5k[targetBlockId].back} (updated)`,
    };

    bench("legacy-full-data-json-stringify-5k", () => {
        JSON.stringify(
            {
                version: "1.1.0",
                cards: {
                    ...cards5k,
                    [targetBlockId]: targetCard,
                },
            },
            null,
            2
        );
    });

    bench("sharded-single-card-plus-manifest-stringify-5k", () => {
        JSON.stringify(targetCard, null, 2);
        JSON.stringify(createShardedStorageManifest("1.1.0", cardIds), null, 2);
    });
});
