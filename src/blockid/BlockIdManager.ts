/**
 * BlockIdManager — Block ID 生成與管理
 *
 * 職責：
 * 1. 使用 nanoid(6) 生成唯一 Block ID（格式：^fc-xxxxxx）
 * 2. 提供 On Blur 觸發邏輯（搭配防抖）
 * 3. 透過 vault.process() 原子性寫入 Block ID
 */

import { Plugin, MarkdownView, debounce, TFile } from "obsidian";
import { nanoid } from "nanoid";
import { FlashcardParser } from "../parser/FlashcardParser";

/** Block ID 前綴 */
const BLOCK_ID_PREFIX = "fc-";

export class BlockIdManager {
    private plugin: Plugin;
    private parser: FlashcardParser;
    /** 上一次游標所在的行號 */
    private lastCursorLine: number = -1;
    /** 上一次游標所在的檔案 */
    private lastFile: TFile | null = null;

    constructor(plugin: Plugin, parser: FlashcardParser) {
        this.plugin = plugin;
        this.parser = parser;
    }

    /**
     * 生成唯一的 Block ID
     * @returns 格式為 `fc-xxxxxx` 的 ID（6 字元隨機字串）
     */
    generateId(): string {
        return `${BLOCK_ID_PREFIX}${nanoid(6)}`;
    }

    /**
     * 檢查行末是否已有 Block ID
     */
    hasBlockId(line: string): boolean {
        return /\^fc-[a-zA-Z0-9_-]+\s*$/.test(line);
    }

    /**
     * 在行末附加 Block ID
     * @param line - 原始行內容
     * @returns 附加 Block ID 後的行內容
     */
    appendBlockId(line: string): string {
        if (this.hasBlockId(line)) return line;
        const id = this.generateId();
        return `${line} ^${id}`;
    }

    /**
     * 註冊編輯器事件監聽（On Blur 觸發）
     * 當游標離開含閃卡語法的行時，自動生成 Block ID
     */
    registerEvents(): void {
        // 監聽 active-leaf-change 事件（切換文件時觸發）
        this.plugin.registerEvent(
            this.plugin.app.workspace.on("active-leaf-change", () => {
                this.handleBlur();
            })
        );

        // 使用防抖的游標移動偵測
        // 每 500ms 檢查一次游標是否離開閃卡行
        const debouncedCheck = debounce(
            () => this.checkCursorChange(),
            500,
            true
        );

        // 監聽編輯器變更事件
        this.plugin.registerEvent(
            this.plugin.app.workspace.on("editor-change", () => {
                debouncedCheck();
            })
        );

        // 也監聽 click 事件觸發的游標移動
        this.plugin.registerDomEvent(document, "click", () => {
            // 使用 setTimeout 確保游標位置已更新
            setTimeout(() => debouncedCheck(), 100);
        });
    }

    /**
     * 檢查游標是否已離開閃卡行
     */
    private checkCursorChange(): void {
        const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return;

        const editor = view.editor;
        const cursor = editor.getCursor();
        const currentLine = cursor.line;
        const currentFile = view.file;

        // 如果沒有開啟檔案，不處理
        if (!currentFile) return;

        // 如果游標行或檔案沒有變更，不處理
        if (
            currentLine === this.lastCursorLine &&
            currentFile === this.lastFile
        ) {
            return;
        }

        const previousLine = this.lastCursorLine;
        const previousFile = this.lastFile;

        // 更新紀錄
        this.lastCursorLine = currentLine;
        this.lastFile = currentFile;

        // 如果之前有記錄，檢查離開的那一行是否需要加 Block ID
        if (previousLine >= 0 && previousFile) {
            this.processLineOnBlur(previousFile, previousLine, editor);
        }
    }

    /**
     * 處理游標離開事件（切換文件時）
     */
    private handleBlur(): void {
        if (this.lastCursorLine >= 0 && this.lastFile) {
            const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
            if (view && view.editor) {
                this.processLineOnBlur(this.lastFile, this.lastCursorLine, view.editor);
            }
        }
        this.lastCursorLine = -1;
        this.lastFile = null;
    }

    /**
     * 對離開的行進行閃卡語法檢測並附加 Block ID
     */
    private async processLineOnBlur(
        file: TFile,
        lineNumber: number,
        editor: { getLine: (line: number) => string; lineCount: () => number }
    ): Promise<void> {
        try {
            // 安全檢查：確認檔案仍然存在於 Vault 中
            const existingFile = this.plugin.app.vault.getAbstractFileByPath(file.path);
            if (!existingFile || !(existingFile instanceof TFile)) return;

            // 安全檢查：確認行號在範圍內
            if (lineNumber < 0 || lineNumber >= editor.lineCount()) return;

            const lineContent = editor.getLine(lineNumber);
            if (!lineContent || lineContent.trim() === "") return;

            // 已經有 Block ID，跳過
            if (this.hasBlockId(lineContent)) return;

            // 取得完整文件內容來檢查多行模式
            const allLines: string[] = [];
            for (let i = 0; i < editor.lineCount(); i++) {
                allLines.push(editor.getLine(i));
            }

            // 檢查是否為閃卡語法
            const singleCard = this.parser.parseLine(lineContent, lineNumber);
            const multiCard = this.parser.parseMultiLine(allLines, lineNumber);

            if (!singleCard && !multiCard) return;

            // 使用 vault.process() 原子性寫入 Block ID
            const newId = this.generateId();
            await this.plugin.app.vault.process(file, (content) => {
                const lines = content.split("\n");
                if (lineNumber < lines.length) {
                    // 再次確認該行尚未有 Block ID（防止競態條件）
                    if (!this.hasBlockId(lines[lineNumber])) {
                        lines[lineNumber] = `${lines[lineNumber]} ^${newId}`;
                    }
                }
                return lines.join("\n");
            });
        } catch (err) {
            console.error("[Flashcards] 寫入 Block ID 時發生錯誤:", err);
        }
    }
}

