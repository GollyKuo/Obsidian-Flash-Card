export interface SyncResult {
    totalCards: number;
    withBlockId: number;
    noIdCount: number;
    newCount: number;
    updatedCount: number;
    removedCount: number;
}

export interface VaultSyncResult extends SyncResult {
    filesScanned: number;
}

export type SyncPhase = "idle" | "syncing" | "error";

export interface SyncStatusState {
    phase: SyncPhase;
    activeJobs: number;
    lastSyncedAt: string | null;
    lastError: string | null;
}

export type SyncStatusListener = (state: SyncStatusState) => void;
