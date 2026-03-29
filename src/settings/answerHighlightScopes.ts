export const ANSWER_HIGHLIGHT_SCOPES = [
    "cloze",
    "single-line",
    "multi-line",
    "bidirectional",
] as const;

export type AnswerHighlightScope = (typeof ANSWER_HIGHLIGHT_SCOPES)[number];

export const ANSWER_HIGHLIGHT_SCOPE_LABELS: Record<
    AnswerHighlightScope,
    string
> = {
    cloze: "填空",
    "single-line": "單行答案",
    "multi-line": "多行答案",
    bidirectional: "雙向卡",
};
