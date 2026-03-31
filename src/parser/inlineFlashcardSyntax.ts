const INLINE_OPEN_TOKEN = "{{fc";
const INLINE_CLOSE_TOKEN = "/fc}}";

export interface InlineForwardCardMatch {
    front: string;
    back: string;
    frontFrom: number;
    frontTo: number;
    backFrom: number;
    backTo: number;
    openTokenFrom: number;
    openTokenTo: number;
    delimiterFrom: number;
    delimiterTo: number;
    closeTokenFrom: number;
    closeTokenTo: number;
}

export interface InlineClozeCardMatch {
    content: string;
    contentFrom: number;
    contentTo: number;
    openTokenFrom: number;
    openTokenTo: number;
    closeTokenFrom: number;
    closeTokenTo: number;
}

export function matchInlineForwardCard(
    line: string
): InlineForwardCardMatch | null {
    const openTokenFrom = line.indexOf(INLINE_OPEN_TOKEN);
    if (openTokenFrom < 0) {
        return null;
    }

    const afterOpenToken = openTokenFrom + INLINE_OPEN_TOKEN.length;
    const firstCharAfterOpen = line[afterOpenToken];
    if (!firstCharAfterOpen || firstCharAfterOpen === ":") {
        return null;
    }

    const closeTokenFrom = line.indexOf(INLINE_CLOSE_TOKEN, afterOpenToken);
    if (closeTokenFrom < 0) {
        return null;
    }

    const closeTokenTo = closeTokenFrom + INLINE_CLOSE_TOKEN.length;
    const insideFrom = afterOpenToken;
    const insideTo = closeTokenFrom;
    const inside = line.slice(insideFrom, insideTo);
    const delimiterOffset = inside.indexOf("::");
    if (delimiterOffset < 0) {
        return null;
    }

    const delimiterFrom = insideFrom + delimiterOffset;
    const delimiterTo = delimiterFrom + 2;

    const frontFrom = skipLeadingWhitespace(line, insideFrom, delimiterFrom);
    const frontTo = trimTrailingWhitespace(line, insideFrom, delimiterFrom);
    if (frontTo <= frontFrom) {
        return null;
    }

    const backFrom = skipLeadingWhitespace(line, delimiterTo, insideTo);
    const backTo = trimTrailingWhitespace(line, delimiterTo, insideTo);
    if (backTo <= backFrom) {
        return null;
    }

    return {
        front: line.slice(frontFrom, frontTo),
        back: line.slice(backFrom, backTo),
        frontFrom,
        frontTo,
        backFrom,
        backTo,
        openTokenFrom,
        openTokenTo: frontFrom,
        delimiterFrom: frontTo,
        delimiterTo: backFrom,
        closeTokenFrom: backTo,
        closeTokenTo,
    };
}

export function matchInlineClozeCard(
    line: string
): InlineClozeCardMatch | null {
    const openTokenFrom = line.indexOf(INLINE_OPEN_TOKEN);
    if (openTokenFrom < 0) {
        return null;
    }

    const afterOpenToken = openTokenFrom + INLINE_OPEN_TOKEN.length;
    const firstCharAfterOpen = line[afterOpenToken];
    if (!firstCharAfterOpen || firstCharAfterOpen === ":") {
        return null;
    }

    const closeTokenFrom = line.indexOf(INLINE_CLOSE_TOKEN, afterOpenToken);
    if (closeTokenFrom < 0) {
        return null;
    }

    const closeTokenTo = closeTokenFrom + INLINE_CLOSE_TOKEN.length;
    const contentFrom = skipLeadingWhitespace(line, afterOpenToken, closeTokenFrom);
    const contentTo = trimTrailingWhitespace(line, afterOpenToken, closeTokenFrom);
    if (contentTo <= contentFrom) {
        return null;
    }

    const content = line.slice(contentFrom, contentTo);
    if (content.includes("::")) {
        return null;
    }

    if (!/==[^=]+==/.test(content)) {
        return null;
    }

    return {
        content,
        contentFrom,
        contentTo,
        openTokenFrom,
        openTokenTo: contentFrom,
        closeTokenFrom: contentTo,
        closeTokenTo,
    };
}

export function hasInlineFlashcardMarkers(line: string): boolean {
    return line.includes(INLINE_OPEN_TOKEN) || line.includes(INLINE_CLOSE_TOKEN);
}

function skipLeadingWhitespace(text: string, from: number, to: number): number {
    let i = from;
    while (i < to && /\s/.test(text[i])) {
        i += 1;
    }
    return i;
}

function trimTrailingWhitespace(text: string, from: number, to: number): number {
    let i = to;
    while (i > from && /\s/.test(text[i - 1])) {
        i -= 1;
    }
    return i;
}
