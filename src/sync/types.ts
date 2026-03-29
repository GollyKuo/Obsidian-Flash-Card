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
