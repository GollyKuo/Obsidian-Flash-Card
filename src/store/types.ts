/**
 * 資料儲存型別定義
 * 定義 _Flashcards/data.json 的資料結構
 */

import { FlashcardType, CardContext } from "../parser/types";

/** FSRS 演算法狀態 */
export interface FSRSState {
    /** 難度（0-1），越高越難 */
    difficulty: number;
    /** 穩定性（天數），記憶保持的預計天數 */
    stability: number;
    /** 可回憶度（0-1），當前時刻的預計回憶機率 */
    retrievability: number;
    /** 下次複習到期時間（ISO 8601） */
    due: string;
    /** 複習次數 */
    reps: number;
    /** 遺失次數（按 Again 的次數） */
    lapses: number;
    /** 卡片狀態：新卡 / 學習中 / 複習中 / 重新學習 */
    state: "new" | "learning" | "review" | "relearning";
}

/** 單張閃卡的完整記錄 */
export interface FlashcardRecord {
    /** Block ID（主鍵，如 `fc-abc123`） */
    blockId: string;
    /** 來源檔案路徑（相對於 Vault） */
    sourcePath: string;
    /** 卡片類型 */
    type: FlashcardType;
    /** 正面內容 */
    front: string;
    /** 背面內容 */
    back: string;
    /** 上下文 */
    context?: CardContext;
    /** FSRS 排程狀態 */
    fsrs: FSRSState;
    /** 建立時間（ISO 8601） */
    createdAt: string;
    /** 最後更新時間（ISO 8601） */
    updatedAt: string;
    /** AI 豐富化資料（M4 會擴充） */
    enrichment?: {
        /** AI 生成的補充說明 */
        explanation?: string;
        /** AI 生成的圖片路徑 */
        imagePath?: string;
        /** AI 生成的音訊路徑 */
        audioPath?: string;
    };
}

/** 頂層資料結構（data.json 的格式） */
export interface FlashcardData {
    /** 資料格式版本 */
    version: string;
    /** 所有閃卡記錄，以 blockId 為鍵 */
    cards: Record<string, FlashcardRecord>;
}

/** 預設的空白 FSRS 狀態（新卡片） */
export const DEFAULT_FSRS_STATE: FSRSState = {
    difficulty: 0,
    stability: 0,
    retrievability: 0,
    due: new Date().toISOString(),
    reps: 0,
    lapses: 0,
    state: "new",
};

/** 預設的空資料庫 */
export const DEFAULT_DATA: FlashcardData = {
    version: "1.0.0",
    cards: {},
};
