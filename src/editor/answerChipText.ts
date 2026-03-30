const CLOZE_WRAPPER_PATTERN = /^==([\s\S]+)==$/;
const WIKI_LINK_PATTERN = /\[\[([^[\]]+)\]\]/g;
const IMAGE_LINK_PATTERN = /!\[([^\]]*)\]\([^)]+\)/g;
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\([^)]+\)/g;
const INLINE_CODE_PATTERN = /`([^`]+)`/g;
const STRONG_PATTERN = /\*\*([^*]+)\*\*|__([^_]+)__/g;
const EMPHASIS_PATTERN = /\*([^*]+)\*|_([^_]+)_/g;
const STRIKETHROUGH_PATTERN = /~~([^~]+)~~/g;

export function toAnswerChipText(rawText: string): string {
    let text = rawText.trim();

    const clozeMatch = text.match(CLOZE_WRAPPER_PATTERN);
    if (clozeMatch) {
        text = clozeMatch[1];
    }

    text = text.replace(WIKI_LINK_PATTERN, (_match, inner: string) =>
        getWikilinkDisplayText(inner)
    );
    text = text.replace(IMAGE_LINK_PATTERN, (_match, alt: string) => alt);
    text = text.replace(MARKDOWN_LINK_PATTERN, "$1");
    text = text.replace(INLINE_CODE_PATTERN, "$1");
    text = text.replace(STRONG_PATTERN, (_match, a: string, b: string) => a ?? b);
    text = text.replace(STRIKETHROUGH_PATTERN, "$1");
    text = text.replace(EMPHASIS_PATTERN, (_match, a: string, b: string) => a ?? b);

    return text;
}

function getWikilinkDisplayText(inner: string): string {
    const pipeIndex = inner.indexOf("|");
    if (pipeIndex >= 0) {
        return inner.slice(pipeIndex + 1);
    }

    const [target] = inner.split("#", 1);
    const basename = target.split("/").pop();
    return basename && basename.length > 0 ? basename : target;
}
