/**
 * BlockIdHider — CodeMirror 6 ViewPlugin
 *
 * 在編輯器中隱藏 Block ID（`^fc-xxxxxx`）。
 * 僅當游標停留在該行時才顯示，以便使用者編輯。
 */

import { RangeSetBuilder } from "@codemirror/state";
import {
    ViewPlugin,
    DecorationSet,
    EditorView,
    Decoration,
    ViewUpdate,
    PluginValue,
} from "@codemirror/view";
import { getActiveRevealLine } from "./revealState";

/** 匹配行末 Block ID 的正則表達式（含前方空白） */
const INLINE_BLOCK_ID_RE = /\s+\^fc-[a-zA-Z0-9_-]+\s*$/;
const STANDALONE_BLOCK_ID_RE = /^\s*\^fc-[a-zA-Z0-9_-]+\s*$/;

/** 用於替換（視覺隱藏）Block ID 的裝飾 */
const HIDE = Decoration.replace({});
const HIDE_STANDALONE_LINE = Decoration.line({
    class: "fc-hidden-block-id-line",
});

/**
 * ViewPlugin 實作：掃描可見範圍，對非游標行的 Block ID 加上隱藏裝飾
 */
class BlockIdHiderPlugin implements PluginValue {
    decorations: DecorationSet;

    constructor(view: EditorView) {
        this.decorations = this.build(view);
    }

    update(update: ViewUpdate): void {
        if (update.docChanged || update.viewportChanged || update.selectionSet) {
            this.decorations = this.build(update.view);
        }
    }

    destroy(): void {}

    /** 建構隱藏裝飾集合 */
    private build(view: EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();
        const revealLine = getActiveRevealLine(view);

        for (const { from, to } of view.visibleRanges) {
            let pos = from;
            while (pos <= to) {
                const line = view.state.doc.lineAt(pos);

                // 僅隱藏非游標行的 Block ID
                const isRevealLine =
                    revealLine !== null && line.number === revealLine;
                const isAdjacentToReveal =
                    revealLine !== null && Math.abs(line.number - revealLine) <= 1;
                const isStandaloneBlockIdLine = STANDALONE_BLOCK_ID_RE.test(
                    line.text
                );

                if (!isRevealLine) {
                    const m = line.text.match(INLINE_BLOCK_ID_RE);
                    if (m && m.index !== undefined) {
                        const start = line.from + m.index;
                        if (start < line.to) {
                            builder.add(start, line.to, HIDE);
                        }
                    }
                }

                if (isStandaloneBlockIdLine && !isAdjacentToReveal) {
                    builder.add(line.from, line.from, HIDE_STANDALONE_LINE);
                    if (line.from < line.to) {
                        builder.add(line.from, line.to, HIDE);
                    }
                }

                pos = line.to + 1;
            }
        }

        return builder.finish();
    }
}

/** 可直接傳入 `registerEditorExtension` 的 CM6 擴充 */
export const blockIdHiderExtension = ViewPlugin.fromClass(BlockIdHiderPlugin, {
    decorations: (v) => v.decorations,
});
