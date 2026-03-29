import { describe, expect, it, vi } from "vitest";
import { SaveQueue } from "./SaveQueue";

describe("SaveQueue", () => {
    it("debounces queued saves into a single write", async () => {
        vi.useFakeTimers();

        const saveMock = vi.fn(async () => undefined);
        const queue = new SaveQueue(saveMock, 300);
        queue.queue();
        queue.queue();

        await vi.advanceTimersByTimeAsync(299);
        expect(saveMock).toHaveBeenCalledTimes(0);

        await vi.advanceTimersByTimeAsync(1);
        await Promise.resolve();
        expect(saveMock).toHaveBeenCalledTimes(1);

        vi.useRealTimers();
    });

    it("flushes one save when multiple queued changes happen in a batch", async () => {
        vi.useFakeTimers();

        const saveMock = vi.fn(async () => undefined);
        const queue = new SaveQueue(saveMock, 300);

        await queue.runInBatch(async () => {
            queue.queue();
            queue.queue();
            await vi.advanceTimersByTimeAsync(1000);
            expect(saveMock).toHaveBeenCalledTimes(0);
        });

        expect(saveMock).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });
});
