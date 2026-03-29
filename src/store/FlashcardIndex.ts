import { FlashcardRecord } from "./types";

export class FlashcardIndex {
    private sourcePathIndex = new Map<string, Set<string>>();
    private dueDayIndex = new Map<string, Set<string>>();
    private dueByBlockId = new Map<string, number>();
    private dueDaysDirty = true;
    private sortedDueDays: string[] = [];

    reindex(cards: Record<string, FlashcardRecord>): void {
        this.sourcePathIndex.clear();
        this.dueDayIndex.clear();
        this.dueByBlockId.clear();
        this.dueDaysDirty = true;

        for (const card of Object.values(cards)) {
            this.indexCard(card);
        }
    }

    onUpsert(previous: FlashcardRecord | null, next: FlashcardRecord): void {
        if (previous) {
            this.unindexCard(previous);
        }

        this.indexCard(next);
    }

    onDelete(previous: FlashcardRecord | null): void {
        if (!previous) {
            return;
        }

        this.unindexCard(previous);
    }

    getBlockIdsBySourcePath(sourcePath: string): string[] {
        return [...(this.sourcePathIndex.get(sourcePath) ?? [])];
    }

    getDueBlockIds(now: Date): string[] {
        const nowMs = now.getTime();
        const cutoffDay = now.toISOString().slice(0, 10);
        const ids: string[] = [];

        for (const day of this.getSortedDueDays()) {
            if (day > cutoffDay) {
                break;
            }

            const bucket = this.dueDayIndex.get(day);
            if (!bucket) {
                continue;
            }

            for (const blockId of bucket) {
                const dueMs = this.dueByBlockId.get(blockId);
                if (dueMs === undefined || dueMs > nowMs) {
                    continue;
                }

                ids.push(blockId);
            }
        }

        return ids;
    }

    private indexCard(card: FlashcardRecord): void {
        this.addSourcePathIndex(card.sourcePath, card.blockId);

        const dueMs = Date.parse(card.fsrs.due);
        if (Number.isNaN(dueMs)) {
            return;
        }

        this.dueByBlockId.set(card.blockId, dueMs);
        const dayKey = this.getDayKey(dueMs);
        this.addDueDayIndex(dayKey, card.blockId);
    }

    private unindexCard(card: FlashcardRecord): void {
        this.removeSourcePathIndex(card.sourcePath, card.blockId);

        const previousDue = this.dueByBlockId.get(card.blockId);
        this.dueByBlockId.delete(card.blockId);

        if (previousDue === undefined) {
            return;
        }

        const dayKey = this.getDayKey(previousDue);
        this.removeDueDayIndex(dayKey, card.blockId);
    }

    private addSourcePathIndex(sourcePath: string, blockId: string): void {
        let set = this.sourcePathIndex.get(sourcePath);
        if (!set) {
            set = new Set<string>();
            this.sourcePathIndex.set(sourcePath, set);
        }

        set.add(blockId);
    }

    private removeSourcePathIndex(sourcePath: string, blockId: string): void {
        const set = this.sourcePathIndex.get(sourcePath);
        if (!set) {
            return;
        }

        set.delete(blockId);
        if (set.size === 0) {
            this.sourcePathIndex.delete(sourcePath);
        }
    }

    private addDueDayIndex(dayKey: string, blockId: string): void {
        let set = this.dueDayIndex.get(dayKey);
        if (!set) {
            set = new Set<string>();
            this.dueDayIndex.set(dayKey, set);
            this.dueDaysDirty = true;
        }

        set.add(blockId);
    }

    private removeDueDayIndex(dayKey: string, blockId: string): void {
        const set = this.dueDayIndex.get(dayKey);
        if (!set) {
            return;
        }

        set.delete(blockId);
        if (set.size === 0) {
            this.dueDayIndex.delete(dayKey);
            this.dueDaysDirty = true;
        }
    }

    private getSortedDueDays(): string[] {
        if (!this.dueDaysDirty) {
            return this.sortedDueDays;
        }

        this.sortedDueDays = [...this.dueDayIndex.keys()].sort();
        this.dueDaysDirty = false;
        return this.sortedDueDays;
    }

    private getDayKey(timestamp: number): string {
        return new Date(timestamp).toISOString().slice(0, 10);
    }
}
