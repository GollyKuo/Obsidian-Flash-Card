export const SINGLE_LINE_ANSWER_RENDER_STYLES = [
    "chip",
    "plain",
] as const;

export type SingleLineAnswerRenderStyle =
    (typeof SINGLE_LINE_ANSWER_RENDER_STYLES)[number];

export const SINGLE_LINE_ANSWER_RENDER_STYLE_LABELS: Record<
    SingleLineAnswerRenderStyle,
    string
> = {
    chip: "膠囊 chip",
    plain: "純文字高亮",
};
