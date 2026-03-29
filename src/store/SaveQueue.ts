export class SaveQueue {
    private pendingSave = false;
    private saveTimer: ReturnType<typeof setTimeout> | null = null;
    private saveChain: Promise<void> = Promise.resolve();
    private batchDepth = 0;
    private debounceMs: number;
    private saveFn: () => Promise<void>;

    constructor(saveFn: () => Promise<void>, debounceMs: number = 300) {
        this.saveFn = saveFn;
        this.debounceMs = debounceMs;
    }

    queue(): void {
        this.pendingSave = true;

        if (this.batchDepth > 0 || this.saveTimer) {
            return;
        }

        this.saveTimer = setTimeout(() => {
            this.saveTimer = null;
            void this.flush();
        }, this.debounceMs);
    }

    async saveNow(): Promise<void> {
        this.pendingSave = false;
        this.clearTimer();
        await this.enqueueSave();
    }

    async flush(): Promise<void> {
        if (this.batchDepth > 0 || !this.pendingSave) {
            return;
        }

        this.pendingSave = false;
        await this.enqueueSave();
    }

    async runInBatch<T>(work: () => Promise<T>): Promise<T> {
        this.batchDepth++;

        try {
            return await work();
        } finally {
            this.batchDepth--;

            if (this.batchDepth === 0) {
                this.clearTimer();
                await this.flush();
            }
        }
    }

    private async enqueueSave(): Promise<void> {
        this.saveChain = this.saveChain.then(async () => {
            await this.saveFn();
        });

        await this.saveChain;
    }

    private clearTimer(): void {
        if (!this.saveTimer) {
            return;
        }

        clearTimeout(this.saveTimer);
        this.saveTimer = null;
    }
}
