export const SHARDED_STORAGE_KIND = "sharded";

export interface ShardedStorageManifest {
    version: string;
    storage: typeof SHARDED_STORAGE_KIND;
    cardIds: string[];
}

export function isShardedStorageManifest(
    value: unknown
): value is ShardedStorageManifest {
    if (!isRecord(value)) {
        return false;
    }

    if (value.storage !== SHARDED_STORAGE_KIND) {
        return false;
    }

    if (typeof value.version !== "string") {
        return false;
    }

    if (!Array.isArray(value.cardIds)) {
        return false;
    }

    return value.cardIds.every((id) => typeof id === "string");
}

export function createShardedStorageManifest(
    version: string,
    cardIds: string[]
): ShardedStorageManifest {
    return {
        version,
        storage: SHARDED_STORAGE_KIND,
        cardIds: [...new Set(cardIds)].sort(),
    };
}

export function getCardStoragePath(cardsDirectory: string, blockId: string): string {
    return normalizePathLocal(
        `${cardsDirectory}/${encodeURIComponent(blockId)}.json`
    );
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizePathLocal(path: string): string {
    return path.replace(/\\/g, "/").replace(/\/+/g, "/");
}
