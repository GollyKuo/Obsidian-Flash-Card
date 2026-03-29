import { RangeSetBuilder } from "@codemirror/state";
import {
    Decoration,
    DecorationSet,
    EditorView,
    PluginValue,
    ViewPlugin,
    ViewUpdate,
} from "@codemirror/view";
import { FlashcardParser } from "../parser/FlashcardParser";
import { FlashcardsPluginSettings } from "../settings/types";
import {
    collectAnswerHighlightRanges,
    collectAnswerSyntaxHideRanges,
} from "./answerHighlightRules";

const ANSWER_HIGHLIGHT = Decoration.mark({
    class: "fc-answer-highlight",
});
const SYNTAX_HIDE = Decoration.replace({});

type SettingsAccessor = () => FlashcardsPluginSettings;

export function createAnswerHighlighterExtension(
    parser: FlashcardParser,
    getSettings: SettingsAccessor
) {
    return ViewPlugin.fromClass(
        class implements PluginValue {
            decorations: DecorationSet;

            constructor(view: EditorView) {
                this.decorations = buildDecorations(view, parser, getSettings);
            }

            update(update: ViewUpdate): void {
                if (
                    update.docChanged ||
                    update.viewportChanged ||
                    update.selectionSet
                ) {
                    this.decorations = buildDecorations(
                        update.view,
                        parser,
                        getSettings
                    );
                }
            }
        },
        {
            decorations: (value) => value.decorations,
        }
    );
}

function buildDecorations(
    view: EditorView,
    parser: FlashcardParser,
    getSettings: SettingsAccessor
): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    const scopes = new Set(getSettings().answerHighlightScopes);
    const activeLineNumber =
        view.state.doc.lineAt(view.state.selection.main.head).number - 1;

    const lines = view.state.doc.toString().split("\n");

    for (const { from, to } of view.visibleRanges) {
        let pos = from;

        while (pos <= to) {
            const line = view.state.doc.lineAt(pos);
            const lineNumber = line.number - 1;
            if (lineNumber !== activeLineNumber) {
                const syntaxRanges = collectAnswerSyntaxHideRanges({
                    line: line.text,
                    parser,
                });
                for (const range of syntaxRanges) {
                    const start = line.from + range.from;
                    const end = line.from + range.to;
                    if (end > start) {
                        builder.add(start, end, SYNTAX_HIDE);
                    }
                }
            }

            if (scopes.size > 0) {
                const ranges = collectAnswerHighlightRanges({
                    lines,
                    lineNumber,
                    parser,
                    scopes,
                });

                for (const range of ranges) {
                    const start = line.from + range.from;
                    const end = line.from + range.to;
                    if (end > start) {
                        builder.add(start, end, ANSWER_HIGHLIGHT);
                    }
                }
            }

            pos = line.to + 1;
        }
    }

    return builder.finish();
}
