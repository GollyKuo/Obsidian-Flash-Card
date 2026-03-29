import { describe, expect, it } from "vitest";
import { Rating } from "ts-fsrs";
import { FsrsScheduler } from "./FsrsScheduler";
import { createDefaultFsrsState } from "../store/types";

describe("FsrsScheduler", () => {
    it("updates due date and review metadata after a rating", () => {
        const scheduler = new FsrsScheduler();
        const now = new Date("2026-03-29T00:00:00.000Z");
        const state = createDefaultFsrsState(now);

        const next = scheduler.review(state, Rating.Good, now);

        expect(next.lastReview).toBe(now.toISOString());
        expect(next.reps).toBeGreaterThan(state.reps);
        expect(new Date(next.due).getTime()).toBeGreaterThan(now.getTime());
        expect(next.state).not.toBe("new");
    });
});
