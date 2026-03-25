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

/** 匹配行末 Block ID 的正則表達式（含前方空白） */
const BLOCK_ID_RE = /\s+\^fc-[a-zA-Z0-9_-]+\s*$/;

/** 用於替換（視覺隱藏）Block ID 的裝飾 */
const HIDE = Decoration.replace({});

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
        const cursorLine = view.state.doc.lineAt(view.state.selection.main.head);

        for (const { from, to } of view.visibleRanges) {
            let pos = from;
            while (pos <= to) {
                const line = view.state.doc.lineAt(pos);

                // 僅隱藏非游標行的 Block ID
                if (line.number !== cursorLine.number) {
                    const m = line.text.match(BLOCK_ID_RE);
                    if (m && m.index !== undefined) {
                        const start = line.from + m.index;
                        if (start < line.to) {
                            builder.add(start, line.to, HIDE);
                        }
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
