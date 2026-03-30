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
import { MultiLineAnswerRenderStyle } from "../settings/multiLineAnswerRenderStyles";
import { FlashcardsPluginSettings } from "../settings/types";
import { toAnswerChipText } from "./answerChipText";
import {
    collectAnswerHighlightRanges,
    collectMultilineAnswerBlock,
    collectFlashcardSyntaxTokenRanges,
} from "./answerHighlightRules";

const HIDE_FLASHCARD_SYNTAX = Decoration.replace({});
const MULTILINE_SOFT_BAND = Decoration.mark({
    class: "fc-answer-multiline fc-answer-multiline-soft-band",
});
const MULTILINE_RIGHT_RAIL = Decoration.mark({
    class: "fc-answer-multiline fc-answer-multiline-right-rail",
});
const MULTILINE_RIGHT_RAIL_LINE = Decoration.line({
    class: "fc-answer-multiline-line fc-answer-multiline-line-right-rail",
});
const MULTILINE_RIGHT_RAIL_LINE_START = Decoration.line({
    class: "fc-answer-multiline-line fc-answer-multiline-line-right-rail fc-answer-multiline-line-right-rail-start",
});
const MULTILINE_RIGHT_RAIL_LINE_END = Decoration.line({
    class: "fc-answer-multiline-line fc-answer-multiline-line-right-rail fc-answer-multiline-line-right-rail-end",
});
const MULTILINE_RIGHT_RAIL_LINE_SINGLE = Decoration.line({
    class: "fc-answer-multiline-line fc-answer-multiline-line-right-rail fc-answer-multiline-line-right-rail-single",
});
const MULTILINE_SOFT_BAND_LINE = "fc-answer-multiline-line fc-answer-multiline-line-soft-band";
const MULTILINE_SOFT_BAND_LINE_START =
    "fc-answer-multiline-line fc-answer-multiline-line-soft-band fc-answer-multiline-line-soft-band-start";
const MULTILINE_SOFT_BAND_LINE_END =
    "fc-answer-multiline-line fc-answer-multiline-line-soft-band fc-answer-multiline-line-soft-band-end";
const MULTILINE_SOFT_BAND_LINE_SINGLE =
    "fc-answer-multiline-line fc-answer-multiline-line-soft-band fc-answer-multiline-line-soft-band-single";

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
    const settings = getSettings();
    const builder = new RangeSetBuilder<Decoration>();
    const scopes = new Set(settings.answerHighlightScopes);
    const multilineDecoration = getMultilineDecoration(
        settings.multiLineAnswerRenderStyle
    );
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

                const multiLineBlock = scopes.has("multi-line")
                    ? collectMultilineAnswerBlock({
                          lines,
                          lineNumber,
                          parser,
                      })
                    : null;
                if (multiLineBlock) {
                    if (settings.multiLineAnswerRenderStyle === "soft-band") {
                        builder.add(
                            line.from,
                            line.from,
                            getMultilineSoftBandLineDecoration(
                                multiLineBlock.startLineNumber,
                                multiLineBlock.endLineNumber,
                                lineNumber,
                                multiLineBlock.blockIndentColumns
                            )
                        );
                    }

                    if (settings.multiLineAnswerRenderStyle === "right-rail") {
                        builder.add(
                            line.from,
                            line.from,
                            getMultilineRightRailLineDecoration(
                                multiLineBlock.startLineNumber,
                                multiLineBlock.endLineNumber,
                                lineNumber
                            )
                        );
                    }

                    const start = line.from + multiLineBlock.from;
                    const end = line.from + multiLineBlock.to;
                    if (end > start) {
                        builder.add(start, end, multilineDecoration);
                    }

                    pos = line.to + 1;
                    continue;
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

function getMultilineDecoration(style: MultiLineAnswerRenderStyle): Decoration {
    switch (style) {
        case "right-rail":
            return MULTILINE_RIGHT_RAIL;
        case "soft-band":
        default:
            return MULTILINE_SOFT_BAND;
    }
}

function getMultilineRightRailLineDecoration(
    startLineNumber: number,
    endLineNumber: number,
    currentLineNumber: number
): Decoration {
    const answerStartLineNumber = startLineNumber + 1;
    if (answerStartLineNumber === endLineNumber) {
        return MULTILINE_RIGHT_RAIL_LINE_SINGLE;
    }

    if (currentLineNumber === answerStartLineNumber) {
        return MULTILINE_RIGHT_RAIL_LINE_START;
    }

    if (currentLineNumber === endLineNumber) {
        return MULTILINE_RIGHT_RAIL_LINE_END;
    }

    return MULTILINE_RIGHT_RAIL_LINE;
}

function getMultilineSoftBandLineDecoration(
    startLineNumber: number,
    endLineNumber: number,
    currentLineNumber: number,
    blockIndentColumns: number
): Decoration {
    const className = getMultilineSoftBandLineClassName(
        startLineNumber,
        endLineNumber,
        currentLineNumber
    );

    return Decoration.line({
        class: className,
        attributes: {
            style: `--fc-answer-block-indent: ${blockIndentColumns}ch;`,
        },
    });
}

function getMultilineSoftBandLineClassName(
    startLineNumber: number,
    endLineNumber: number,
    currentLineNumber: number
): string {
    if (startLineNumber + 1 === endLineNumber) {
        return MULTILINE_SOFT_BAND_LINE_SINGLE;
    }

    if (currentLineNumber === startLineNumber + 1) {
        return MULTILINE_SOFT_BAND_LINE_START;
    }

    if (currentLineNumber === endLineNumber) {
        return MULTILINE_SOFT_BAND_LINE_END;
    }

    return MULTILINE_SOFT_BAND_LINE;
}
