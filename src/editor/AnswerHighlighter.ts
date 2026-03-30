import { RangeSetBuilder } from "@codemirror/state";
import {
    Decoration,
    DecorationSet,
    EditorView,
    PluginValue,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
} from "@codemirror/view";
import { FlashcardParser } from "../parser/FlashcardParser";
import { FlashcardsPluginSettings } from "../settings/types";
import { toAnswerChipText } from "./answerChipText";
import {
    collectAnswerHighlightRanges,
    collectFlashcardSyntaxTokenRanges,
} from "./answerHighlightRules";

const HIDE_FLASHCARD_SYNTAX = Decoration.replace({});

type SettingsAccessor = () => FlashcardsPluginSettings;

class AnswerChipWidget extends WidgetType {
    private readonly text: string;

    constructor(text: string) {
        super();
        this.text = text;
    }

    eq(other: AnswerChipWidget): boolean {
        return other.text === this.text;
    }

    toDOM(): HTMLElement {
        const el = document.createElement("span");
        el.className = "fc-answer-chip";
        el.textContent = this.text;
        return el;
    }
}

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
            const cleanLine = parser.stripBlockId(line.text).trimEnd();

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

                for (const range of ranges) {
                    const start = line.from + range.from;
                    const end = line.from + range.to;
                    if (end > start) {
                        const rawText = cleanLine.slice(range.from, range.to);
                        const displayText = toAnswerChipText(rawText);
                        if (displayText) {
                            builder.add(
                                start,
                                end,
                                Decoration.replace({
                                    widget: new AnswerChipWidget(displayText),
                                })
                            );
                        }
                    }
                }
            }

            pos = line.to + 1;
        }
    }

    return builder.finish();
}
