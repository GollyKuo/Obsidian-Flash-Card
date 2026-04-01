import { Decoration, WidgetType } from "@codemirror/view";
import { SingleLineAnswerRenderStyle } from "../settings/singleLineAnswerRenderStyles";
import { toAnswerChipText } from "./answerChipText";

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

    ignoreEvent(): boolean {
        return false;
    }
}

class AnswerPlainTextWidget extends WidgetType {
    private readonly text: string;

    constructor(text: string) {
        super();
        this.text = text;
    }

    eq(other: AnswerPlainTextWidget): boolean {
        return other.text === this.text;
    }

    toDOM(): HTMLElement {
        const el = document.createElement("span");
        el.className = "fc-answer-inline-text";
        el.textContent = this.text;
        return el;
    }

    ignoreEvent(): boolean {
        return false;
    }
}

export function createSingleLineAnswerDecoration(params: {
    style: SingleLineAnswerRenderStyle;
    rawText: string;
}): Decoration | null {
    const displayText = toAnswerChipText(params.rawText);
    if (!displayText) {
        return null;
    }

    switch (params.style) {
        case "plain":
            return Decoration.replace({
                widget: new AnswerPlainTextWidget(displayText),
            });
        case "chip":
        default:
            return Decoration.replace({
                widget: new AnswerChipWidget(displayText),
            });
    }
}
