import { CardContext, FlashcardRaw, FlashcardType } from "./types";
import {
    hasInlineFlashcardMarkers,
    matchInlineClozeCard,
    matchInlineForwardCard,
} from "./inlineFlashcardSyntax";

const PATTERNS = {
    bidirectional: /^(.+?)\s*:::\s*(.+)$/,
    forward: /^(.+?)\s*::\s*(.+)$/,
    forwardMultiline: /^(.+?)\s*::\s*$/,
    reverse: /^(.+?)\s*;;\s*(.+)$/,
    blockId: /\s*\^fc-[a-zA-Z0-9_-]+\s*$/,
};

export class FlashcardParser {
    parseLine(line: string, lineNumber: number): FlashcardRaw | null {
        const cleanLine = this.stripBlockId(line).trim();
        if (!cleanLine) {
            return null;
        }

        const existingBlockId = this.extractBlockId(line);

        const inlineForwardMatch = matchInlineForwardCard(cleanLine);
        if (inlineForwardMatch) {
            return {
                type: FlashcardType.Forward,
                front: inlineForwardMatch.front,
                back: inlineForwardMatch.back,
                lineNumber,
                blockId: existingBlockId,
            };
        }

        const inlineClozeMatch = matchInlineClozeCard(cleanLine);
        if (inlineClozeMatch) {
            const clozePositions = this.extractClozePositions(inlineClozeMatch.content);
            if (clozePositions.length === 0) {
                return null;
            }

            return {
                type: FlashcardType.Cloze,
                front: inlineClozeMatch.content,
                back: inlineClozeMatch.content,
                lineNumber,
                blockId: existingBlockId,
                clozePositions,
            };
        }

        // Hard boundary: wrapper markers present but not valid inline syntax.
        if (hasInlineFlashcardMarkers(cleanLine)) {
            return null;
        }

        const bidirectionalMatch = cleanLine.match(PATTERNS.bidirectional);
        if (bidirectionalMatch) {
            return {
                type: FlashcardType.Bidirectional,
                front: bidirectionalMatch[1].trim(),
                back: bidirectionalMatch[2].trim(),
                lineNumber,
                blockId: existingBlockId,
            };
        }

        const forwardMatch = cleanLine.match(PATTERNS.forward);
        if (forwardMatch) {
            return {
                type: FlashcardType.Forward,
                front: forwardMatch[1].trim(),
                back: forwardMatch[2].trim(),
                lineNumber,
                blockId: existingBlockId,
            };
        }

        const reverseMatch = cleanLine.match(PATTERNS.reverse);
        if (reverseMatch) {
            return {
                type: FlashcardType.Reverse,
                front: reverseMatch[1].trim(),
                back: reverseMatch[2].trim(),
                lineNumber,
                blockId: existingBlockId,
            };
        }

        const clozePositions = this.extractClozePositions(cleanLine);
        if (clozePositions.length > 0) {
            return {
                type: FlashcardType.Cloze,
                front: cleanLine,
                back: cleanLine,
                lineNumber,
                blockId: existingBlockId,
                clozePositions,
            };
        }

        return null;
    }

    parseMultiLine(lines: string[], startIndex: number): FlashcardRaw | null {
        const startLine = lines[startIndex];
        if (!startLine) {
            return null;
        }

        const cleanLine = this.stripBlockId(startLine).trim();
        const multiMatch = cleanLine.match(PATTERNS.forwardMultiline);
        if (!multiMatch) {
            return null;
        }

        const front = multiMatch[1].trim();
        const existingBlockId = this.extractBlockId(startLine);

        const answerLines: string[] = [];
        let endLine = startIndex;

        for (let i = startIndex + 1; i < lines.length; i += 1) {
            const line = lines[i];

            if (line.trim() === "") {
                if (i + 1 < lines.length && this.isIndented(lines[i + 1])) {
                    answerLines.push("");
                    endLine = i;
                    continue;
                }
                break;
            }

            if (this.isIndented(line)) {
                answerLines.push(this.removeIndent(line));
                endLine = i;
                continue;
            }

            break;
        }

        if (answerLines.length === 0) {
            return null;
        }

        return {
            type: FlashcardType.Forward,
            front,
            back: answerLines.join("\n"),
            lineNumber: startIndex,
            endLineNumber: endLine,
            blockId: existingBlockId,
        };
    }

    extractContext(lines: string[], lineIndex: number): CardContext {
        const headers: string[] = [];
        let parentIndent = "";
        const targetIndent = this.getIndentLevel(lines[lineIndex] || "");

        for (let i = lineIndex - 1; i >= 0; i -= 1) {
            const line = lines[i];
            if (!line || line.trim() === "") {
                continue;
            }

            const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
            if (headerMatch) {
                headers.unshift(`${"#".repeat(headerMatch[1].length)} ${headerMatch[2].trim()}`);
                continue;
            }

            const lineIndent = this.getIndentLevel(line);
            if (lineIndent < targetIndent && !parentIndent) {
                parentIndent = line.trim();
            }
        }

        return { headers, parentIndent };
    }

    parseDocument(content: string): FlashcardRaw[] {
        const lines = content.split("\n");
        const cards: FlashcardRaw[] = [];
        const processedLines = new Set<number>();

        for (let i = 0; i < lines.length; i += 1) {
            if (processedLines.has(i)) {
                continue;
            }

            const multiCard = this.parseMultiLine(lines, i);
            if (multiCard) {
                multiCard.context = this.extractContext(lines, i);
                cards.push(multiCard);
                for (let j = i; j <= (multiCard.endLineNumber ?? i); j += 1) {
                    processedLines.add(j);
                }
                continue;
            }

            const card = this.parseLine(lines[i], i);
            if (card) {
                card.context = this.extractContext(lines, i);
                cards.push(card);
                processedLines.add(i);
            }
        }

        return cards;
    }

    stripBlockId(line: string): string {
        return line.replace(PATTERNS.blockId, "");
    }

    extractBlockId(line: string): string | undefined {
        const match = line.match(/\^(fc-[a-zA-Z0-9_-]+)\s*$/);
        return match ? match[1] : undefined;
    }

    private extractClozePositions(
        line: string
    ): Array<{ start: number; end: number; text: string }> {
        const positions: Array<{ start: number; end: number; text: string }> = [];
        const regex = /==([^=]+)==/g;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(line)) !== null) {
            positions.push({
                start: match.index,
                end: match.index + match[0].length,
                text: match[1],
            });
        }

        return positions;
    }

    private isIndented(line: string): boolean {
        return /^(\t|    )/.test(line);
    }

    private removeIndent(line: string): string {
        if (line.startsWith("\t")) {
            return line.substring(1);
        }

        if (line.startsWith("    ")) {
            return line.substring(4);
        }

        return line;
    }

    private getIndentLevel(line: string): number {
        const match = line.match(/^(\s*)/);
        if (!match) {
            return 0;
        }

        let level = 0;
        for (const ch of match[1]) {
            if (ch === "\t") {
                level += 1;
                continue;
            }
            level += 0.25;
        }

        return Math.floor(level);
    }
}
