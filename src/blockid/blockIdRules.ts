import { FlashcardParser } from "../parser/FlashcardParser";

const BLOCK_ID_PATTERN = /\^fc-[a-zA-Z0-9_-]+\s*$/;

export function hasBlockId(line: string): boolean {
    return BLOCK_ID_PATTERN.test(line.trimEnd());
}

export function appendBlockId(line: string, id: string): string {
    if (hasBlockId(line)) {
        return line;
    }

    return `${line} ^${id}`;
}

export function shouldAttachBlockIdOnBlur(params: {
    parser: FlashcardParser;
    lineContent: string;
    lineNumber: number;
    allLines: string[];
}): boolean {
    const { parser, lineContent, lineNumber, allLines } = params;

    if (!lineContent.trim()) {
        return false;
    }

    if (hasBlockId(lineContent)) {
        return false;
    }

    return (
        !!parser.parseLine(lineContent, lineNumber) ||
        !!parser.parseMultiLine(allLines, lineNumber)
    );
}
