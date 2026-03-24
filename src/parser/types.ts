/**
 * 閃卡型別定義
 * 定義閃卡解析器使用的所有型別介面
 */

/** 閃卡類型列舉 */
export enum FlashcardType {
    /** 正向卡：看到 front 考 back（`概念 :: 答案`） */
    Forward = "forward",
    /** 反向卡：看到 front 考 back（`解釋 ;; 概念`） */
    Reverse = "reverse",
    /** 雙向卡：互考（`單字 ::: 翻譯`） */
    Bidirectional = "bidirectional",
    /** 填空卡：`==填空==` 自動挖空 */
    Cloze = "cloze",
}

/** 卡片上下文（用於 AI 豐富化） */
export interface CardContext {
    /** 從當前行回溯收集的 H1-H6 標題層級 */
    headers: string[];
    /** 父層縮排內容（用於巢狀清單中的卡片） */
    parentIndent: string;
}

/** 閃卡原始解析結果 */
export interface FlashcardRaw {
    /** 卡片類型 */
    type: FlashcardType;
    /** 正面內容（問題端） */
    front: string;
    /** 背面內容（答案端），填空卡為完整文字 */
    back: string;
    /** 卡片所在行號（0-indexed） */
    lineNumber: number;
    /** Block ID（`^fc-xxxxxx`），解析時可能尚未生成 */
    blockId?: string;
    /** 多行答案的結束行號 */
    endLineNumber?: number;
    /** 上下文資訊 */
    context?: CardContext;
    /** 填空卡的挖空位置列表 */
    clozePositions?: Array<{ start: number; end: number; text: string }>;
}
