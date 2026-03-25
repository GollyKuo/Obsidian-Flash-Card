/**
 * ReviewModal — 閃卡複習介面（React 元件）
 *
 * 顯示到期閃卡，提供翻卡與 FSRS 四鍵評分。
 * 全部使用 inline style，避免 Tailwind CSS class 隔離問題。
 */

import * as React from "react";
import { useState } from "react";
import { FlashcardRecord } from "../store/types";
import { DataStore } from "../store/DataStore";
import { Rating } from "ts-fsrs";

interface ReviewModalProps {
    cards: FlashcardRecord[];
    dataStore: DataStore;
    onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ cards, dataStore, onClose }) => {
    const [index, setIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);

    const card = index < cards.length ? cards[index] : null;

    /** 評分後前進至下一張 */
    const rate = async (rating: Rating) => {
        if (!card) return;
        await dataStore.reviewCard(card.blockId, rating);
        setShowAnswer(false);
        setIndex((i) => i + 1);
    };

    // 所有卡片已結束
    if (!card) {
        return React.createElement("div", { style: { textAlign: "center", padding: "40px 20px" } },
            React.createElement("div", { style: { fontSize: 48, marginBottom: 16 } }, "🎉"),
            React.createElement("h2", { style: { margin: "0 0 8px" } }, "所有閃卡都複習完畢！"),
            React.createElement("p", { style: { color: "var(--text-muted)" } }, `已複習 ${index} 張卡片。`),
            React.createElement("button", {
                onClick: onClose,
                style: {
                    marginTop: 16, padding: "8px 24px",
                    background: "var(--interactive-accent)", color: "var(--text-on-accent)",
                    border: "none", borderRadius: 6, cursor: "pointer",
                },
            }, "關閉"),
        );
    }

    // 填空題處理
    const front = card.type === "cloze"
        ? card.front.replace(/==([^=]+)==/g, "______") : card.front;
    const back = card.type === "cloze"
        ? card.back.replace(/==([^=]+)==/g, "【$1】") : card.back;

    const remaining = cards.length - index;

    // 共用按鈕樣式
    const btn: React.CSSProperties = {
        flex: 1, padding: "12px 8px", border: "none", borderRadius: 8,
        cursor: "pointer", fontWeight: 600, fontSize: 14,
    };

    return React.createElement("div", { style: { padding: "8px 0", minHeight: 300 } },

        // 頂端狀態列
        React.createElement("div", {
            style: {
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 16, paddingBottom: 8,
                borderBottom: "1px solid var(--background-modifier-border)",
            },
        },
            React.createElement("span", { style: { fontSize: 13, color: "var(--text-muted)" } },
                "待複習：", React.createElement("strong", { style: { color: "var(--text-normal)" } }, remaining), " 張"),
            React.createElement("span", { style: { fontSize: 12, color: "var(--text-faint)" } }, card.type),
        ),

        // 上下文
        card.context && card.context.headers.length > 0
            ? React.createElement("div", { style: { marginBottom: 12, fontSize: 12, color: "var(--text-muted)" } },
                card.context.headers.join(" › "))
            : null,

        // 卡片正面
        React.createElement("div", {
            style: { fontSize: 20, fontWeight: 500, textAlign: "center", padding: "24px 16px", minHeight: 60 },
        }, front),

        // 答案區 + 評分按鈕
        showAnswer
            ? React.createElement(React.Fragment, null,
                React.createElement("div", {
                    style: {
                        borderTop: "1px solid var(--background-modifier-border)",
                        padding: "24px 16px", fontSize: 18, textAlign: "center",
                        whiteSpace: "pre-wrap", color: "var(--text-normal)",
                    },
                }, back),
                React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 16 } },
                    React.createElement("button", { onClick: () => rate(Rating.Again), style: { ...btn, background: "#f5c6c6", color: "#b91c1c" } }, "Again"),
                    React.createElement("button", { onClick: () => rate(Rating.Hard), style: { ...btn, background: "#f5dcc6", color: "#c2410c" } }, "Hard"),
                    React.createElement("button", { onClick: () => rate(Rating.Good), style: { ...btn, background: "#c6f5d0", color: "#15803d" } }, "Good"),
                    React.createElement("button", { onClick: () => rate(Rating.Easy), style: { ...btn, background: "#c6daf5", color: "#1d4ed8" } }, "Easy"),
                ),
            )
            : React.createElement("button", {
                onClick: () => setShowAnswer(true),
                style: {
                    width: "100%", padding: "14px", marginTop: 16,
                    background: "var(--interactive-accent)", color: "var(--text-on-accent)",
                    border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 16,
                },
            }, "顯示答案"),
    );
};
