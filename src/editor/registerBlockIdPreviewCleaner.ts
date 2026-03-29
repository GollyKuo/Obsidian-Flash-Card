import { MarkdownPostProcessor } from "obsidian";

const BLOCK_ID_IN_PREVIEW = /\s*\^fc-[A-Za-z0-9_-]{6}\b/g;
const BLOCK_ID_IN_PREVIEW_TEST = /\s*\^fc-[A-Za-z0-9_-]{6}\b/;

export const blockIdPreviewCleaner: MarkdownPostProcessor = (element) => {
    const walk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            if (
                node.textContent &&
                BLOCK_ID_IN_PREVIEW_TEST.test(node.textContent)
            ) {
                node.textContent = node.textContent.replace(BLOCK_ID_IN_PREVIEW, "");
            }
            return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return;
        }

        const elementNode = node as HTMLElement;
        if (elementNode.tagName === "CODE" || elementNode.tagName === "PRE") {
            return;
        }

        node.childNodes.forEach(walk);
    };

    walk(element);
};
