/** @type {import('tailwindcss').Config} */
module.exports = {
    // 所有 class 加上 fc- 前綴，避免與 Obsidian 衝突
    prefix: "fc-",
    // 停用 Preflight（CSS Reset），避免影響 Obsidian 原生樣式
    corePlugins: {
        preflight: false,
    },
    content: ["./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            // 自定義低彩度色票（Notion 美學）
            colors: {
                "fc-again": "#f5c6c6",   // 淡紅
                "fc-hard": "#f5dcc6",    // 淡橘
                "fc-good": "#c6f5d0",    // 淡綠
                "fc-easy": "#c6daf5",    // 淡藍
                "fc-warn": "#f5e6c6",    // 琥珀（遺忘預警）
            },
        },
    },
    plugins: [],
};
