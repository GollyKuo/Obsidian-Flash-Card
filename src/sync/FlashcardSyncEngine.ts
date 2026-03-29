import { FlashcardParser } from "../parser/FlashcardParser";
import { FlashcardRaw } from "../parser/types";
import { FlashcardRecord, createDefaultFsrsState } from "../store/types";
import { SyncResult } from "./types";

export interface FlashcardSyncStore {
    getCardByBlockId(blockId: string): FlashcardRecord | null;
    getCardsBySourcePath(sourcePath: string): FlashcardRecord[];
    upsertRecord(blockId: string, record: FlashcardRecord): FlashcardRecord;
    removeMissingCardsFromSource(
        sourcePath: string,
        retainedBlockIds: Set<string>
    ): number;
}

export class FlashcardSyncEngine {
    private parser: FlashcardParser;
    private store: FlashcardSyncStore;

    constructor(parser: FlashcardParser, store: FlashcardSyncStore) {
        this.parser = parser;
        this.store = store;
    }

    syncDocument(sourcePath: string, content: string): SyncResult {
        const cards = this.parser.parseDocument(content);
        const retainedBlockIds = new Set<string>();

        let newCount = 0;
        let updatedCount = 0;
        let withBlockId = 0;

        for (const card of cards) {
            if (!card.blockId) {
                continue;
            }

            withBlockId++;
            retainedBlockIds.add(card.blockId);

            const existing = this.store.getCardByBlockId(card.blockId);
            const record = this.buildRecord(card.blockId, card, sourcePath, existing);

            if (!existing) {
                this.store.upsertRecord(card.blockId, record);
                newCount++;
                continue;
            }

            if (this.hasRecordChanged(existing, record)) {
                this.store.upsertRecord(card.blockId, record);
                updatedCount++;
            }
        }

        const removedCount = this.store.removeMissingCardsFromSource(
            sourcePath,
            retainedBlockIds
        );

        return {
            totalCards: cards.length,
            withBlockId,
            noIdCount: cards.length - withBlockId,
            newCount,
            updatedCount,
            removedCount,
        };
    }

    private hasRecordChanged(
        existing: FlashcardRecord,
        next: FlashcardRecord
    ): boolean {
        return (
            existing.sourcePath !== next.sourcePath ||
            existing.type !== next.type ||
            existing.front !== next.front ||
            existing.back !== next.back ||
            JSON.stringify(existing.context ?? null) !==
                JSON.stringify(next.context ?? null)
        );
    }

    private buildRecord(
        blockId: string,
        raw: FlashcardRaw,
        sourcePath: string,
        existing: FlashcardRecord | null
    ): FlashcardRecord {
        const now = new Date().toISOString();

        if (existing) {
            return {
                ...existing,
                sourcePath,
                type: raw.type,
                front: raw.front,
                back: raw.back,
                context: raw.context,
                updatedAt: now,
            };
        }

        return {
            blockId,
            sourcePath,
            type: raw.type,
            front: raw.front,
            back: raw.back,
            context: raw.context,
            fsrs: createDefaultFsrsState(),
            createdAt: now,
            updatedAt: now,
        };
    }
}
