import { FlashcardParser } from "../parser/FlashcardParser";
import { AnswerHighlightScope } from "../settings/answerHighlightScopes";

const BIDIRECTIONAL_PATTERN = /^(.+?)\s*:::\s*(.+)$/;
const FORWARD_PATTERN = /^(.+?)\s*::\s*(.+)$/;
const FORWARD_MULTILINE_PATTERN = /^(.+?)\s*::\s*$/;
const REVERSE_PATTERN = /^(.+?)\s*;;\s*(.+)$/;
const CLOZE_PATTERN = /==([^=]+)==/g;

export interface AnswerHighlightRange {
    from: number;
    to: number;
}

export interface AnswerSyntaxHideRange {
    from: number;
    to: number;
}

export function collectAnswerHighlightRanges(params: {
    lines: string[];
    lineNumber: number;
    parser: FlashcardParser;
    scopes: Set<AnswerHighlightScope>;
}): AnswerHighlightRange[] {
    const { lines, lineNumber, parser, scopes } = params;
    if (scopes.size === 0) {
        return [];
    }

    const line = lines[lineNumber];
    if (!line) {
        return [];
    }

    const cleanLine = parser.stripBlockId(line).trimEnd();
    if (!cleanLine.trim()) {
        return [];
    }

    const ranges: AnswerHighlightRange[] = [];

    if (scopes.has("cloze")) {
        let match: RegExpExecArray | null;
        while ((match = CLOZE_PATTERN.exec(cleanLine)) !== null) {
            ranges.push({
                from: match.index,
                to: match.index + match[0].length,
            });
        }
        CLOZE_PATTERN.lastIndex = 0;
    }

    if (scopes.has("bidirectional")) {
        const match = cleanLine.match(BIDIRECTIONAL_PATTERN);
        if (match) {
            const start = cleanLine.length - match[2].length;
            ranges.push({ from: start, to: cleanLine.length });
            return mergeRanges(ranges);
        }
    }

    if (scopes.has("single-line")) {
        const forwardMatch = cleanLine.match(FORWARD_PATTERN);
        if (forwardMatch) {
            const start = cleanLine.length - forwardMatch[2].length;
            ranges.push({ from: start, to: cleanLine.length });
            return mergeRanges(ranges);
        }

        const reverseMatch = cleanLine.match(REVERSE_PATTERN);
        if (reverseMatch) {
            const start = cleanLine.length - reverseMatch[2].length;
            ranges.push({ from: start, to: cleanLine.length });
            return mergeRanges(ranges);
        }
    }

    if (scopes.has("multi-line")) {
        const multiLineRange = findMultilineAnswerRange(
            lines,
            lineNumber,
            parser
        );
        if (multiLineRange) {
            ranges.push(multiLineRange);
        }
    }

    return mergeRanges(ranges);
}

export function collectAnswerSyntaxHideRanges(params: {
    line: string;
    parser: FlashcardParser;
}): AnswerSyntaxHideRange[] {
    const cleanLine = params.parser.stripBlockId(params.line).trimEnd();
    if (!cleanLine.trim()) {
        return [];
    }

    const bidirectionalMatch = cleanLine.match(BIDIRECTIONAL_PATTERN);
    if (bidirectionalMatch) {
        return buildTokenRange(cleanLine, ":::", bidirectionalMatch[1].length);
    }

    const forwardMatch = cleanLine.match(FORWARD_PATTERN);
    if (forwardMatch) {
        return buildTokenRange(cleanLine, "::", forwardMatch[1].length);
    }

    const reverseMatch = cleanLine.match(REVERSE_PATTERN);
    if (reverseMatch) {
        return buildTokenRange(cleanLine, ";;", reverseMatch[1].length);
    }

    const multilineMatch = cleanLine.match(FORWARD_MULTILINE_PATTERN);
    if (multilineMatch) {
        return buildTokenRange(cleanLine, "::", multilineMatch[1].length);
    }

    return [];
}

function findMultilineAnswerRange(
    lines: string[],
    lineNumber: number,
    parser: FlashcardParser
): AnswerHighlightRange | null {
    const currentLine = lines[lineNumber];
    if (!currentLine || !/^\s+/.test(currentLine) || !currentLine.trim()) {
        return null;
    }

    for (let i = lineNumber - 1; i >= 0; i--) {
        const card = parser.parseMultiLine(lines, i);
        if (card?.endLineNumber !== undefined && lineNumber <= card.endLineNumber) {
            const start = currentLine.match(/^\s*/)?.[0].length ?? 0;
            const end = currentLine.trimEnd().length;
            return end > start ? { from: start, to: end } : null;
        }

        if (lines[i]?.trim() && !/^\s/.test(lines[i])) {
            break;
        }
    }

    return null;
}

function mergeRanges(ranges: AnswerHighlightRange[]): AnswerHighlightRange[] {
    if (ranges.length <= 1) {
        return ranges;
    }

    const sorted = [...ranges].sort((a, b) => a.from - b.from);
    const merged: AnswerHighlightRange[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
        const previous = merged[merged.length - 1];
        const current = sorted[i];

        if (current.from <= previous.to) {
            previous.to = Math.max(previous.to, current.to);
            continue;
        }

        merged.push({ ...current });
    }

    return merged;
}

function buildTokenRange(
    line: string,
    token: string,
    searchFrom: number
): AnswerSyntaxHideRange[] {
    const start = line.indexOf(token, searchFrom);
    if (start < 0) {
        return [];
    }

    return [{ from: start, to: start + token.length }];
}
