import { FlashcardParser } from "../parser/FlashcardParser";
import {
    hasInlineFlashcardMarkers,
    matchInlineClozeCard,
    matchInlineForwardCard,
} from "../parser/inlineFlashcardSyntax";
import { AnswerHighlightScope } from "../settings/answerHighlightScopes";

const BIDIRECTIONAL_PATTERN = /^(.+?)\s*:::\s*(.+)$/;
const FORWARD_PATTERN = /^(.+?)\s*::\s*(.+)$/;
const REVERSE_PATTERN = /^(.+?)\s*;;\s*(.+)$/;
const BIDIRECTIONAL_TOKEN_PATTERN = /^(.+?)(\s*:::\s*)(.+)$/;
const FORWARD_TOKEN_PATTERN = /^(.+?)(\s*::\s*)(.+)$/;
const REVERSE_TOKEN_PATTERN = /^(.+?)(\s*;;\s*)(.+)$/;
const FORWARD_MULTILINE_TOKEN_PATTERN = /^(.+?)(\s*::\s*)$/;
const CLOZE_PATTERN = /==([^=]+)==/g;

export interface AnswerHighlightRange {
    from: number;
    to: number;
}

export interface ClozeTokenRange {
    from: number;
    to: number;
    contentFrom: number;
    contentTo: number;
    content: string;
}

export interface FlashcardSyntaxTokenRange {
    from: number;
    to: number;
}

export interface MultilineAnswerBlock {
    from: number;
    to: number;
    startLineNumber: number;
    endLineNumber: number;
    blockIndentColumns: number;
}

export interface FlashcardLineParseCache {
    multilineAnswerBlockByLine: Map<number, MultilineAnswerBlock>;
    multilineStartLines: Set<number>;
}

export function buildFlashcardLineParseCache(params: {
    lines: string[];
    parser: FlashcardParser;
}): FlashcardLineParseCache {
    const { lines, parser } = params;
    const cards = parser.parseDocument(lines.join("\n"));
    const multilineAnswerBlockByLine = new Map<number, MultilineAnswerBlock>();
    const multilineStartLines = new Set<number>();

    for (const card of cards) {
        if (card.endLineNumber === undefined) {
            continue;
        }

        multilineStartLines.add(card.lineNumber);
        const firstAnswerLine = lines[card.lineNumber + 1] ?? "";
        const blockIndentColumns = countLeadingIndentColumns(firstAnswerLine);

        for (
            let lineNumber = card.lineNumber + 1;
            lineNumber <= card.endLineNumber;
            lineNumber += 1
        ) {
            const line = lines[lineNumber];
            if (!line || !line.trim() || !/^\s+/.test(line)) {
                continue;
            }

            const from = line.match(/^\s*/)?.[0].length ?? 0;
            const to = line.trimEnd().length;
            if (to <= from) {
                continue;
            }

            multilineAnswerBlockByLine.set(lineNumber, {
                from,
                to,
                startLineNumber: card.lineNumber,
                endLineNumber: card.endLineNumber,
                blockIndentColumns,
            });
        }
    }

    return {
        multilineAnswerBlockByLine,
        multilineStartLines,
    };
}

export function collectAnswerHighlightRanges(params: {
    lines: string[];
    lineNumber: number;
    parser: FlashcardParser;
    scopes: Set<AnswerHighlightScope>;
    cache?: FlashcardLineParseCache;
}): AnswerHighlightRange[] {
    const { lines, lineNumber, parser, scopes, cache } = params;
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

    const inlineForwardMatch = matchInlineForwardCard(cleanLine);
    const inlineClozeMatch = matchInlineClozeCard(cleanLine);
    const hasMalformedInlineSyntax =
        hasInlineFlashcardMarkers(cleanLine) &&
        !inlineForwardMatch &&
        !inlineClozeMatch;
    if (hasMalformedInlineSyntax) {
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
        if (inlineForwardMatch) {
            const hasClozeInBack = ranges.some(
                (range) =>
                    range.from >= inlineForwardMatch.backFrom &&
                    range.to <= inlineForwardMatch.backTo
            );

            if (!hasClozeInBack) {
                ranges.push({
                    from: inlineForwardMatch.backFrom,
                    to: inlineForwardMatch.backTo,
                });
            }
            return mergeRanges(ranges);
        }

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
        const multilineRange = findMultilineAnswerBlock(
            lines,
            lineNumber,
            parser,
            cache
        );
        if (multilineRange) {
            ranges.push({
                from: multilineRange.from,
                to: multilineRange.to,
            });
        }
    }

    return mergeRanges(ranges);
}

export function collectClozeTokenRanges(params: {
    line: string;
    parser: FlashcardParser;
}): ClozeTokenRange[] {
    const cleanLine = params.parser.stripBlockId(params.line).trimEnd();
    if (!cleanLine.trim()) {
        return [];
    }

    const inlineForwardMatch = matchInlineForwardCard(cleanLine);
    const inlineClozeMatch = matchInlineClozeCard(cleanLine);
    const hasMalformedInlineSyntax =
        hasInlineFlashcardMarkers(cleanLine) &&
        !inlineForwardMatch &&
        !inlineClozeMatch;
    if (hasMalformedInlineSyntax) {
        return [];
    }

    const ranges: ClozeTokenRange[] = [];
    let match: RegExpExecArray | null;
    while ((match = CLOZE_PATTERN.exec(cleanLine)) !== null) {
        const from = match.index;
        const to = from + match[0].length;
        const contentFrom = from + 2;
        const contentTo = to - 2;
        ranges.push({
            from,
            to,
            contentFrom,
            contentTo,
            content: match[1],
        });
    }
    CLOZE_PATTERN.lastIndex = 0;

    return ranges;
}

export function collectFlashcardSyntaxTokenRanges(params: {
    lines: string[];
    lineNumber: number;
    parser: FlashcardParser;
    cache?: FlashcardLineParseCache;
}): FlashcardSyntaxTokenRange[] {
    const { lines, lineNumber, parser, cache } = params;
    const line = lines[lineNumber];
    if (!line) {
        return [];
    }

    const cleanLine = parser.stripBlockId(line).trimEnd();
    if (!cleanLine.trim()) {
        return [];
    }

    const inlineForwardMatch = matchInlineForwardCard(cleanLine);
    const inlineClozeMatch = matchInlineClozeCard(cleanLine);
    const hasMalformedInlineSyntax =
        hasInlineFlashcardMarkers(cleanLine) &&
        !inlineForwardMatch &&
        !inlineClozeMatch;
    if (hasMalformedInlineSyntax) {
        return [];
    }

    if (inlineForwardMatch) {
        return [
            toSyntaxRange(inlineForwardMatch.openTokenFrom, inlineForwardMatch.openTokenTo),
            toSyntaxRange(inlineForwardMatch.delimiterFrom, inlineForwardMatch.delimiterTo),
            toSyntaxRange(inlineForwardMatch.closeTokenFrom, inlineForwardMatch.closeTokenTo),
        ].filter((range): range is FlashcardSyntaxTokenRange => range !== null);
    }

    if (inlineClozeMatch) {
        return [
            toSyntaxRange(inlineClozeMatch.openTokenFrom, inlineClozeMatch.openTokenTo),
            toSyntaxRange(inlineClozeMatch.closeTokenFrom, inlineClozeMatch.closeTokenTo),
        ].filter((range): range is FlashcardSyntaxTokenRange => range !== null);
    }

    const bidirectionalMatch = cleanLine.match(BIDIRECTIONAL_TOKEN_PATTERN);
    if (bidirectionalMatch) {
        return [extractTokenRange(bidirectionalMatch[1], bidirectionalMatch[2])];
    }

    const forwardMatch = cleanLine.match(FORWARD_TOKEN_PATTERN);
    if (forwardMatch) {
        return [extractTokenRange(forwardMatch[1], forwardMatch[2])];
    }

    const reverseMatch = cleanLine.match(REVERSE_TOKEN_PATTERN);
    if (reverseMatch) {
        return [extractTokenRange(reverseMatch[1], reverseMatch[2])];
    }

    const multilineMatch = cleanLine.match(FORWARD_MULTILINE_TOKEN_PATTERN);
    const isMultilineStart =
        cache?.multilineStartLines.has(lineNumber) ??
        Boolean(parser.parseMultiLine(lines, lineNumber));
    if (multilineMatch && isMultilineStart) {
        return [extractTokenRange(multilineMatch[1], multilineMatch[2])];
    }

    return [];
}

export function collectMultilineAnswerRange(params: {
    lines: string[];
    lineNumber: number;
    parser: FlashcardParser;
    cache?: FlashcardLineParseCache;
}): AnswerHighlightRange | null {
    const { lines, lineNumber, parser, cache } = params;
    const block = findMultilineAnswerBlock(lines, lineNumber, parser, cache);
    return block ? { from: block.from, to: block.to } : null;
}

export function collectMultilineAnswerBlock(params: {
    lines: string[];
    lineNumber: number;
    parser: FlashcardParser;
    cache?: FlashcardLineParseCache;
}): MultilineAnswerBlock | null {
    const { lines, lineNumber, parser, cache } = params;
    return findMultilineAnswerBlock(lines, lineNumber, parser, cache);
}

function findMultilineAnswerBlock(
    lines: string[],
    lineNumber: number,
    parser: FlashcardParser,
    cache?: FlashcardLineParseCache
): MultilineAnswerBlock | null {
    if (cache) {
        return cache.multilineAnswerBlockByLine.get(lineNumber) ?? null;
    }

    const currentLine = lines[lineNumber];
    if (!currentLine || !/^\s+/.test(currentLine) || !currentLine.trim()) {
        return null;
    }

    for (let i = lineNumber - 1; i >= 0; i -= 1) {
        const card = parser.parseMultiLine(lines, i);
        if (card?.endLineNumber !== undefined && lineNumber <= card.endLineNumber) {
            const start = currentLine.match(/^\s*/)?.[0].length ?? 0;
            const end = currentLine.trimEnd().length;
            if (end <= start) {
                return null;
            }

            return {
                from: start,
                to: end,
                startLineNumber: i,
                endLineNumber: card.endLineNumber,
                blockIndentColumns: countLeadingIndentColumns(lines[i + 1] ?? currentLine),
            };
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

    for (let i = 1; i < sorted.length; i += 1) {
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

function countLeadingIndentColumns(line: string): number {
    let columns = 0;
    for (const char of line) {
        if (char === " ") {
            columns += 1;
            continue;
        }

        if (char === "\t") {
            columns += 4;
            continue;
        }

        break;
    }
    return columns;
}

function toSyntaxRange(
    from: number,
    to: number
): FlashcardSyntaxTokenRange | null {
    if (to <= from) {
        return null;
    }

    return { from, to };
}

function extractTokenRange(
    frontSegment: string,
    tokenSegment: string
): FlashcardSyntaxTokenRange {
    const tokenOffset = tokenSegment.search(/[:;]/);
    const tokenStart = frontSegment.length + Math.max(tokenOffset, 0);
    const trimmedToken = tokenSegment.trim();

    return {
        from: tokenStart,
        to: tokenStart + trimmedToken.length,
    };
}
