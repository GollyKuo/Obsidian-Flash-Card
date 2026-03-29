import { describe, expect, it } from "vitest";
import {
    SHARDED_STORAGE_KIND,
    createShardedStorageManifest,
    getCardStoragePath,
    isShardedStorageManifest,
} from "./shardedStorage";

describe("shardedStorage helpers", () => {
    it("builds sorted deduplicated manifest", () => {
        const manifest = createShardedStorageManifest("1.2.0", [
            "fc-2",
            "fc-1",
            "fc-2",
        ]);

        expect(manifest).toEqual({
            version: "1.2.0",
            storage: SHARDED_STORAGE_KIND,
            cardIds: ["fc-1", "fc-2"],
        });
    });

    it("detects valid sharded manifest", () => {
        expect(
            isShardedStorageManifest({
                version: "1.2.0",
                storage: "sharded",
                cardIds: ["fc-a", "fc-b"],
            })
        ).toBe(true);

        expect(
            isShardedStorageManifest({
                version: "1.2.0",
                storage: "legacy",
                cardIds: ["fc-a"],
            })
        ).toBe(false);
    });

    it("maps block id to encoded card storage path", () => {
        const path = getCardStoragePath("_Flashcards/Cards", "fc-a/b+c");
        expect(path).toBe("_Flashcards/Cards/fc-a%2Fb%2Bc.json");
    });
});
