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
import {
    collectAnswerHighlightRanges,
    collectClozeTokenRanges,
} from "./answerHighlightRules";

const ANSWER_HIGHLIGHT = Decoration.mark({
    class: "fc-answer-highlight",
});

type SettingsAccessor = () => FlashcardsPluginSettings;

class ClozeWidget extends WidgetType {
    private readonly text: string;

    constructor(text: string) {
        super();
        this.text = text;
    }

    eq(other: ClozeWidget): boolean {
        return other.text === this.text;
    }

    toDOM(): HTMLElement {
        const el = document.createElement("span");
        el.className = "fc-answer-highlight fc-cloze-widget";
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

    if (scopes.size === 0) {
        return builder.finish();
    }

    const lines = view.state.doc.toString().split("\n");

    for (const { from, to } of view.visibleRanges) {
        let pos = from;

        while (pos <= to) {
            const line = view.state.doc.lineAt(pos);
            const lineNumber = line.number - 1;

            const shouldUseClozeWidget =
                scopes.has("cloze") && lineNumber !== activeLineNumber;
            const clozeTokenRanges = shouldUseClozeWidget
                ? collectClozeTokenRanges({
                      line: line.text,
                      parser,
                  })
                : [];

            for (const clozeRange of clozeTokenRanges) {
                const start = line.from + clozeRange.from;
                const end = line.from + clozeRange.to;
                if (end > start) {
                    builder.add(
                        start,
                        end,
                        Decoration.replace({
                            widget: new ClozeWidget(clozeRange.content),
                        })
                    );
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

            pos = line.to + 1;
        }
    }

    return builder.finish();
}
