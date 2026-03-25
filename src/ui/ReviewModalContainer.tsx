/**
 * ReviewModalContainer — Obsidian Modal 與 React 的橋接
 *
 * 在 Obsidian Modal 內掛載 / 卸載 ReviewModal React 元件。
 */

import { App, Modal } from "obsidian";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import { ReviewModal } from "./ReviewModal";
import { DataStore } from "../store/DataStore";

export class ReviewModalContainer extends Modal {
    private root: Root | null = null;
    private dataStore: DataStore;

    constructor(app: App, dataStore: DataStore) {
        super(app);
        this.dataStore = dataStore;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        this.modalEl.style.width = "540px";
        this.modalEl.style.maxWidth = "90vw";

        const dueCards = this.dataStore.getDueCards();

        this.root = createRoot(contentEl);
        this.root.render(
            React.createElement(ReviewModal, {
                cards: dueCards,
                dataStore: this.dataStore,
                onClose: () => this.close(),
            })
        );
    }

    onClose(): void {
        if (this.root) {
            this.root.unmount();
            this.root = null;
        }
        this.contentEl.empty();
    }
}
