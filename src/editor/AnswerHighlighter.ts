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
    collectClozeTokenRanges,
    collectFlashcardSyntaxTokenRanges,
} from "./answerHighlightRules";

const ANSWER_HIGHLIGHT = Decoration.mark({
    class: "fc-answer-highlight",
});
const HIDE_FLASHCARD_SYNTAX = Decoration.replace({});

const CLOZE_LINE_HIGHLIGHT = Decoration.line({
    class: "fc-cloze-line",
});

type SettingsAccessor = () => FlashcardsPluginSettings;

export function createAnswerHighlighterExtension(
    parser: FlashcardParser,
    getSettings: SettingsAccessor
) {
    return ViewPlugin.fromClass(
        class implements PluginValue {
            decorations: DecorationSet;

            constructor(view: EditorView) {
                this.decorations = safeBuildDecorations(
                    view,
                    parser,
                    getSettings
                );
            }

            update(update: ViewUpdate): void {
                if (
                    update.docChanged ||
                    update.viewportChanged ||
                    update.selectionSet
                ) {
                    this.decorations = safeBuildDecorations(
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

function safeBuildDecorations(
    view: EditorView,
    parser: FlashcardParser,
    getSettings: SettingsAccessor
): DecorationSet {
    try {
        return buildDecorations(view, parser, getSettings);
    } catch (error) {
        console.error(
            "[Flashcards] AnswerHighlighter build failed. Decorations are reset for safety.",
            error
        );
        return Decoration.none;
    }
}

function buildDecorations(
    view: EditorView,
    parser: FlashcardParser,
    getSettings: SettingsAccessor
): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    const scopes = new Set(getSettings().answerHighlightScopes);
    const cursorLineNumber = view.state.doc.lineAt(
        view.state.selection.main.head
    ).number;

    if (scopes.size === 0) {
        return builder.finish();
    }

    const lines = view.state.doc.toString().split("\n");

    for (const { from, to } of view.visibleRanges) {
        let pos = from;
        while (pos <= to) {
            const line = view.state.doc.lineAt(pos);
            const lineNumber = line.number - 1;
            const isCursorLine = line.number === cursorLineNumber;
            const clozeTokenRanges = scopes.has("cloze")
                ? collectClozeTokenRanges({
                      line: line.text,
                      parser,
                  })
                : [];

            if (!isCursorLine && clozeTokenRanges.length > 0) {
                builder.add(line.from, line.from, CLOZE_LINE_HIGHLIGHT);
            }

            if (!isCursorLine) {
                const syntaxTokenRanges = collectFlashcardSyntaxTokenRanges({
                    lines,
                    lineNumber,
                    parser,
                });
                for (const syntaxTokenRange of syntaxTokenRanges) {
                    const start = line.from + syntaxTokenRange.from;
                    const end = line.from + syntaxTokenRange.to;
                    if (end > start) {
                        builder.add(start, end, HIDE_FLASHCARD_SYNTAX);
                    }
                }

                const ranges = collectAnswerHighlightRanges({
                    lines,
                    lineNumber,
                    parser,
                    scopes,
                });
                const filteredRanges =
                    clozeTokenRanges.length === 0
                        ? ranges
                        : ranges.filter(
                              (range) =>
                                  !clozeTokenRanges.some(
                                      (clozeRange) =>
                                          clozeRange.from === range.from &&
                                          clozeRange.to === range.to
                                  )
                          );

                for (const range of filteredRanges) {
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
