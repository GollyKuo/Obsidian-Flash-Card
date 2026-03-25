import esbuild from "esbuild";
import process from "process";
import fs from "fs";
import path from "path";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import PrefixWrap from "postcss-prefixwrap";

// 是否為生產環境
const prod = process.argv.includes("--production");
// 是否為 watch 模式
const watch = process.argv.includes("--watch");

// Obsidian Vault 外掛目標路徑
const VAULT_PLUGIN_DIR = String.raw`D:\【Golly】\系統預設資料夾\Documents\Antigravity\Obsidian Test\Test\.obsidian\plugins\ai-enriched-flashcards`;

/**
 * PostCSS 外掛：處理 Tailwind CSS 並加上隔離前綴
 */
const postcssPlugin = {
    name: "postcss",
    setup(build) {
        build.onLoad({ filter: /\.css$/ }, async (args) => {
            const css = await fs.promises.readFile(args.path, "utf8");
            const result = await postcss([
                tailwindcss,
                autoprefixer,
                PrefixWrap("#fc-plugin-root", {
                    // 不對 @keyframes 和 :root 加前綴
                    ignoredSelectors: [":root", /^@keyframes/],
                }),
            ]).process(css, { from: args.path });

            return {
                contents: result.css,
                loader: "css",
            };
        });
    },
};

/**
 * 複製打包結果到 Obsidian Vault 的外掛
 */
const copyPlugin = {
    name: "copy-to-vault",
    setup(build) {
        build.onEnd(async () => {
            try {
                // 確保目標目錄存在
                await fs.promises.mkdir(VAULT_PLUGIN_DIR, { recursive: true });

                const srcDir = path.dirname(build.initialOptions.outfile);

                // 複製 main.js
                const mainSrc = build.initialOptions.outfile;
                const mainDest = path.join(VAULT_PLUGIN_DIR, "main.js");
                await fs.promises.copyFile(mainSrc, mainDest);

                // 複製 CSS（esbuild 輸出的 CSS 檔名跟隨 outfile，所以是 main.css）
                // Obsidian 要求檔名為 styles.css
                const cssCandidates = ["styles.css", "main.css"];
                const stylesDest = path.join(VAULT_PLUGIN_DIR, "styles.css");
                for (const cssName of cssCandidates) {
                    const cssSrc = path.join(srcDir, cssName);
                    if (fs.existsSync(cssSrc)) {
                        await fs.promises.copyFile(cssSrc, stylesDest);
                        break;
                    }
                }

                // 複製 manifest.json
                const manifestSrc = path.resolve("manifest.json");
                const manifestDest = path.join(VAULT_PLUGIN_DIR, "manifest.json");
                await fs.promises.copyFile(manifestSrc, manifestDest);

                console.log("✅ 已複製到 Vault 外掛目錄");
            } catch (err) {
                console.error("❌ 複製到 Vault 失敗:", err);
            }
        });
    },
};

const context = await esbuild.context({
    entryPoints: ["src/main.ts"],
    bundle: true,
    external: [
        "obsidian",
        "electron",
        "@codemirror/autocomplete",
        "@codemirror/collab",
        "@codemirror/commands",
        "@codemirror/language",
        "@codemirror/lint",
        "@codemirror/search",
        "@codemirror/state",
        "@codemirror/view",
        "@lezer/common",
        "@lezer/highlight",
        "@lezer/lr",
    ],
    format: "cjs",
    target: "es2018",
    logLevel: "info",
    sourcemap: prod ? false : "inline",
    treeShaking: true,
    outfile: "dist/main.js",
    minify: prod,
    plugins: [postcssPlugin, copyPlugin],
    loader: {
        ".ts": "ts",
        ".tsx": "tsx",
    },
    jsx: "automatic",
});

if (watch) {
    await context.watch();
    console.log("👀 正在監視檔案變更...");
} else {
    await context.rebuild();
    await context.dispose();
}
