/**
 * FlashcardParser — 閃卡語法解析器
 *
 * 支援的語法：
 * - `概念 :: 正向答案`     → 正向卡
 * - `解釋 ;; 概念`         → 反向卡
 * - `單字 ::: 翻譯`        → 雙向卡
 * - `這是一個 ==填空== 範例` → 填空卡
 * - `問題 ::\n  答案`       → 多行模式
 */

import { FlashcardType, FlashcardRaw, CardContext } from "./types";

/** 語法分隔符的正規表達式 */
const PATTERNS = {
    /** 雙向卡必須在單向卡之前匹配（`:::` 含有 `::`） */
    bidirectional: /^(.+?)\s*:::\s*(.+)$/,
    /** 正向卡：`概念 :: 答案` */
    forward: /^(.+?)\s*::\s*(.+)$/,
    /** 正向卡多行模式：`問題 ::` 行末無答案 */
    forwardMultiline: /^(.+?)\s*::\s*$/,
    /** 反向卡：`解釋 ;; 概念` */
    reverse: /^(.+?)\s*;;\s*(.+)$/,
    /** 填空卡：`==填空內容==` */
    cloze: /==([^=]+)==/g,
    /** Block ID：`^fc-xxxxxx` */
    blockId: /\s*\^fc-[a-zA-Z0-9_-]+\s*$/,
};

export class FlashcardParser {
    /**
     * 解析單行閃卡語法
     * @param line - 原始文字行
     * @param lineNumber - 行號（0-indexed）
     * @returns 解析結果，或 null（非閃卡語法）
     */
    parseLine(line: string, lineNumber: number): FlashcardRaw | null {
        // 先移除行末的 Block ID（如果有的話）
        const cleanLine = this.stripBlockId(line).trim();

        if (!cleanLine) return null;

        // 也提取已有的 Block ID
        const existingBlockId = this.extractBlockId(line);

        // 1. 嘗試匹配雙向卡 `:::`（必須在 `::` 之前）
        const bidiMatch = cleanLine.match(PATTERNS.bidirectional);
        if (bidiMatch) {
            return {
                type: FlashcardType.Bidirectional,
                front: bidiMatch[1].trim(),
                back: bidiMatch[2].trim(),
                lineNumber,
                blockId: existingBlockId,
            };
        }

        // 2. 嘗試匹配正向卡 `::`
        const fwdMatch = cleanLine.match(PATTERNS.forward);
        if (fwdMatch) {
            return {
                type: FlashcardType.Forward,
                front: fwdMatch[1].trim(),
                back: fwdMatch[2].trim(),
                lineNumber,
                blockId: existingBlockId,
            };
        }

        // 3. 嘗試匹配反向卡 `;;`
        const revMatch = cleanLine.match(PATTERNS.reverse);
        if (revMatch) {
            return {
                type: FlashcardType.Reverse,
                front: revMatch[1].trim(),
                back: revMatch[2].trim(),
                lineNumber,
                blockId: existingBlockId,
            };
        }

        // 4. 嘗試匹配填空卡 `==...==`
        const clozePositions = this.extractClozePositions(cleanLine);
        if (clozePositions.length > 0) {
            return {
                type: FlashcardType.Cloze,
                front: cleanLine, // 完整文字作為正面
                back: cleanLine,  // 背面也是完整文字（由 UI 決定如何顯示）
                lineNumber,
                blockId: existingBlockId,
                clozePositions,
            };
        }

        return null;
    }

    /**
     * 解析多行閃卡（`問題 ::` 後接縮排答案）
     * @param lines - 文件的所有行
     * @param startIndex - 起始行（包含 `問題 ::` 的行）
     * @returns 解析結果，或 null
     */
    parseMultiLine(lines: string[], startIndex: number): FlashcardRaw | null {
        const startLine = lines[startIndex];
        if (!startLine) return null;

        const cleanLine = this.stripBlockId(startLine).trim();
        const multiMatch = cleanLine.match(PATTERNS.forwardMultiline);
        if (!multiMatch) return null;

        const front = multiMatch[1].trim();
        const existingBlockId = this.extractBlockId(startLine);

        // 收集後續縮排行作為答案
        const answerLines: string[] = [];
        let endLine = startIndex;

        for (let i = startIndex + 1; i < lines.length; i++) {
            const line = lines[i];
            // 空行也視為答案的一部分（允許段落間空行）
            if (line.trim() === "") {
                // 但如果後面沒有更多縮排行，就停止
                if (i + 1 < lines.length && this.isIndented(lines[i + 1])) {
                    answerLines.push("");
                    endLine = i;
                    continue;
                }
                break;
            }
            // 必須是縮排行（Tab 或 4 格空白開頭）
            if (this.isIndented(line)) {
                answerLines.push(this.removeIndent(line));
                endLine = i;
            } else {
                break;
            }
        }

        if (answerLines.length === 0) return null;

        return {
            type: FlashcardType.Forward,
            front,
            back: answerLines.join("\n"),
            lineNumber: startIndex,
            endLineNumber: endLine,
            blockId: existingBlockId,
        };
    }

    /**
     * 從文件行中回溯收集上下文（標題與父層縮排）
     * @param lines - 文件的所有行
     * @param lineIndex - 目標行號
     * @returns 上下文資訊
     */
    extractContext(lines: string[], lineIndex: number): CardContext {
        const headers: string[] = [];
        let parentIndent = "";

        // 取得目標行的縮排等級
        const targetIndent = this.getIndentLevel(lines[lineIndex] || "");

        for (let i = lineIndex - 1; i >= 0; i--) {
            const line = lines[i];
            if (!line || line.trim() === "") continue;

            // 收集標題（H1-H6）
            const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
            if (headerMatch) {
                headers.unshift(`${"#".repeat(headerMatch[1].length)} ${headerMatch[2].trim()}`);
                continue;
            }

            // 收集父層縮排（縮排等級更小的行）
            const lineIndent = this.getIndentLevel(line);
            if (lineIndent < targetIndent && !parentIndent) {
                parentIndent = line.trim();
            }
        }

        return { headers, parentIndent };
    }

    /**
     * 掃描整份文件，解析所有閃卡
     * @param content - 文件完整內容
     * @returns 所有解析到的閃卡
     */
    parseDocument(content: string): FlashcardRaw[] {
        const lines = content.split("\n");
        const cards: FlashcardRaw[] = [];
        const processedLines = new Set<number>();

        for (let i = 0; i < lines.length; i++) {
            if (processedLines.has(i)) continue;

            // 先嘗試多行模式
            const multiCard = this.parseMultiLine(lines, i);
            if (multiCard) {
                multiCard.context = this.extractContext(lines, i);
                cards.push(multiCard);
                // 標記所有相關行為已處理
                for (let j = i; j <= (multiCard.endLineNumber ?? i); j++) {
                    processedLines.add(j);
                }
                continue;
            }

            // 嘗試單行模式
            const card = this.parseLine(lines[i], i);
            if (card) {
                card.context = this.extractContext(lines, i);
                cards.push(card);
                processedLines.add(i);
            }
        }

        return cards;
    }

    // ===== 工具方法 =====

    /** 從行中移除 Block ID */
    stripBlockId(line: string): string {
        return line.replace(PATTERNS.blockId, "");
    }

    /** 提取行末的 Block ID（不含 `^` 前綴） */
    extractBlockId(line: string): string | undefined {
        const match = line.match(/\^(fc-[a-zA-Z0-9_-]+)\s*$/);
        return match ? match[1] : undefined;
    }

    /** 提取填空標記的位置 */
    private extractClozePositions(
        line: string
    ): Array<{ start: number; end: number; text: string }> {
        const positions: Array<{ start: number; end: number; text: string }> = [];
        const regex = /==([^=]+)==/g;
        let m: RegExpExecArray | null;
        while ((m = regex.exec(line)) !== null) {
            positions.push({
                start: m.index,
                end: m.index + m[0].length,
                text: m[1],
            });
        }
        return positions;
    }

    /** 判斷是否為縮排行（Tab 或 4 格空白開頭） */
    private isIndented(line: string): boolean {
        return /^(\t|    )/.test(line);
    }

    /** 移除一層縮排 */
    private removeIndent(line: string): string {
        if (line.startsWith("\t")) return line.substring(1);
        if (line.startsWith("    ")) return line.substring(4);
        return line;
    }

    /** 取得縮排等級 */
    private getIndentLevel(line: string): number {
        const match = line.match(/^(\s*)/);
        if (!match) return 0;
        const spaces = match[1];
        // Tab 算 1 級，4 空白算 1 級
        let level = 0;
        for (const ch of spaces) {
            if (ch === "\t") level++;
            else level += 0.25; // 4 個空白 = 1 級
        }
        return Math.floor(level);
    }
}
