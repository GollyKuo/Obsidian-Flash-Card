export const MULTI_LINE_ANSWER_RENDER_STYLES = [
    "soft-band",
    "right-rail",
] as const;

export type MultiLineAnswerRenderStyle =
    (typeof MULTI_LINE_ANSWER_RENDER_STYLES)[number];

export const MULTI_LINE_ANSWER_RENDER_STYLE_LABELS: Record<
    MultiLineAnswerRenderStyle,
    string
> = {
    "soft-band": "淡色背景帶",
    "right-rail": "右側線條",
};
