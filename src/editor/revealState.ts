import { EditorView } from "@codemirror/view";

interface RevealState {
    revealLineNumber: number;
    activeStartLineNumber: number;
    activeEndLineNumber: number;
}

const revealStateByView = new WeakMap<EditorView, RevealState>();

export function setRevealLine(
    view: EditorView,
    revealLineNumber: number,
    activeStartLineNumber: number = revealLineNumber,
    activeEndLineNumber: number = revealLineNumber
): void {
    if (revealLineNumber <= 0 || activeStartLineNumber <= 0 || activeEndLineNumber <= 0) {
        return;
    }

    if (activeStartLineNumber > activeEndLineNumber) {
        return;
    }

    revealStateByView.set(view, {
        revealLineNumber,
        activeStartLineNumber,
        activeEndLineNumber,
    });
}

export function clearRevealLine(view: EditorView): void {
    revealStateByView.delete(view);
}

export function getActiveRevealState(view: EditorView): Readonly<RevealState> | null {
    const state = revealStateByView.get(view);
    if (!state) {
        return null;
    }

    const cursorLine = view.state.doc.lineAt(view.state.selection.main.head).number;
    if (
        cursorLine < state.activeStartLineNumber ||
        cursorLine > state.activeEndLineNumber
    ) {
        revealStateByView.delete(view);
        return null;
    }

    return state;
}

export function getActiveRevealLine(view: EditorView): number | null {
    const state = getActiveRevealState(view);
    return state ? state.revealLineNumber : null;
}
