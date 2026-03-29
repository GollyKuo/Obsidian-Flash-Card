import { describe, expect, it } from "vitest";
import { FlashcardParser } from "../parser/FlashcardParser";
import { FlashcardSyncEngine, FlashcardSyncStore } from "./FlashcardSyncEngine";
import { FlashcardRecord, createDefaultFsrsState } from "../store/types";
import { FlashcardType } from "../parser/types";

class InMemorySyncStore implements FlashcardSyncStore {
    cards = new Map<string, FlashcardRecord>();

    getCardByBlockId(blockId: string): FlashcardRecord | null {
        return this.cards.get(blockId) ?? null;
    }

    getCardsBySourcePath(sourcePath: string): FlashcardRecord[] {
        return [...this.cards.values()].filter(
            (card) => card.sourcePath === sourcePath
        );
    }

    upsertRecord(blockId: string, record: FlashcardRecord): FlashcardRecord {
        this.cards.set(blockId, record);
        return record;
    }

    removeMissingCardsFromSource(
        sourcePath: string,
        retainedBlockIds: Set<string>
    ): number {
        let removedCount = 0;

        for (const [blockId, card] of this.cards.entries()) {
            if (card.sourcePath !== sourcePath || retainedBlockIds.has(blockId)) {
                continue;
            }

            this.cards.delete(blockId);
            removedCount++;
        }

        return removedCount;
    }
}

describe("FlashcardSyncEngine", () => {
    it("adds new block-id cards to the store", () => {
        const store = new InMemorySyncStore();
        const engine = new FlashcardSyncEngine(new FlashcardParser(), store);

        const result = engine.syncDocument(
            "note.md",
            "Question :: Answer ^fc-abc123"
        );

        expect(result).toMatchObject({
            totalCards: 1,
            withBlockId: 1,
            newCount: 1,
            updatedCount: 0,
            removedCount: 0,
        });
        expect(store.getCardByBlockId("fc-abc123")).toMatchObject({
            sourcePath: "note.md",
            type: FlashcardType.Forward,
            front: "Question",
            back: "Answer",
        });
    });

    it("updates changed cards and removes missing ones from the same source", () => {
        const store = new InMemorySyncStore();
        const oldNow = new Date("2026-03-28T00:00:00.000Z").toISOString();

        store.upsertRecord("fc-keep123", {
            blockId: "fc-keep123",
            sourcePath: "note.md",
            type: FlashcardType.Forward,
            front: "Old",
            back: "Answer",
            fsrs: createDefaultFsrsState(new Date(oldNow)),
            createdAt: oldNow,
            updatedAt: oldNow,
        });
        store.upsertRecord("fc-drop123", {
            blockId: "fc-drop123",
            sourcePath: "note.md",
            type: FlashcardType.Forward,
            front: "Drop",
            back: "Me",
            fsrs: createDefaultFsrsState(new Date(oldNow)),
            createdAt: oldNow,
            updatedAt: oldNow,
        });

        const engine = new FlashcardSyncEngine(new FlashcardParser(), store);
        const result = engine.syncDocument(
            "note.md",
            "New :: Answer ^fc-keep123"
        );

        expect(result).toMatchObject({
            totalCards: 1,
            withBlockId: 1,
            newCount: 0,
            updatedCount: 1,
            removedCount: 1,
        });
        expect(store.getCardByBlockId("fc-drop123")).toBeNull();
        expect(store.getCardByBlockId("fc-keep123")?.front).toBe("New");
    });

    it("keeps multiline and cloze cards consistent during sync", () => {
        const store = new InMemorySyncStore();
        const engine = new FlashcardSyncEngine(new FlashcardParser(), store);

        const firstPass = engine.syncDocument(
            "deck.md",
            [
                "Prompt :: ^fc-multi01",
                "    first answer line",
                "    second answer line",
                "The capital is ==Taipei==. ^fc-cloze01",
            ].join("\n")
        );

        expect(firstPass).toMatchObject({
            totalCards: 2,
            withBlockId: 2,
            newCount: 2,
            updatedCount: 0,
            removedCount: 0,
        });
        expect(store.getCardByBlockId("fc-multi01")?.back).toBe(
            "first answer line\nsecond answer line"
        );
        expect(store.getCardByBlockId("fc-cloze01")?.type).toBe(
            FlashcardType.Cloze
        );

        const secondPass = engine.syncDocument(
            "deck.md",
            [
                "Prompt :: ^fc-multi01",
                "    rewritten answer",
                "The capital is ==Taipei==. ^fc-cloze01",
            ].join("\n")
        );

        expect(secondPass).toMatchObject({
            totalCards: 2,
            withBlockId: 2,
            newCount: 0,
            updatedCount: 1,
            removedCount: 0,
        });
        expect(store.getCardByBlockId("fc-multi01")?.back).toBe("rewritten answer");
    });
});
