import esbuild from "esbuild";
import process from "process";
import fs from "fs";
import path from "path";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import PrefixWrap from "postcss-prefixwrap";

// Build mode
const prod = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

// Obsidian Vault plugin destination
const VAULT_PLUGIN_DIR = String.raw`D:\【Golly】\系統預設資料夾\Documents\Antigravity\Obsidian Test\Test\.obsidian\plugins\ai-enriched-flashcards`;

/**
 * PostCSS pipeline.
 * - `main.css` keeps `#fc-plugin-root` isolation.
 * - `editor.css` is intentionally unprefixed for CodeMirror selectors.
 */
const postcssPlugin = {
    name: "postcss",
    setup(build) {
        build.onLoad({ filter: /\.css$/ }, async (args) => {
            const css = await fs.promises.readFile(args.path, "utf8");

            const plugins = args.path.endsWith("editor.css")
                ? [tailwindcss, autoprefixer]
                : [
                      tailwindcss,
                      autoprefixer,
                      PrefixWrap("#fc-plugin-root", {
                          ignoredSelectors: [
                              ":root",
                              /^@keyframes/,
                              /^\.cm-editor\b/,
                              /^body\.fc-answer-highlight-scope-cloze \.markdown-preview-view mark$/,
                              /^body\.fc-answer-highlight-scope-cloze \.markdown-rendered mark$/,
                          ],
                      }),
                  ];

            const result = await postcss(plugins).process(css, {
                from: args.path,
            });

            return {
                contents: result.css,
                loader: "css",
            };
        });
    },
};

/** Copy build output to Obsidian Vault plugin folder. */
const copyPlugin = {
    name: "copy-to-vault",
    setup(build) {
        build.onEnd(async () => {
            try {
                await fs.promises.mkdir(VAULT_PLUGIN_DIR, { recursive: true });

                const srcDir = path.dirname(build.initialOptions.outfile);
                const mainSrc = build.initialOptions.outfile;
                const mainDest = path.join(VAULT_PLUGIN_DIR, "main.js");
                await fs.promises.copyFile(mainSrc, mainDest);

                const cssCandidates = ["styles.css", "main.css"];
                const stylesDest = path.join(VAULT_PLUGIN_DIR, "styles.css");
                for (const cssName of cssCandidates) {
                    const cssSrc = path.join(srcDir, cssName);
                    if (fs.existsSync(cssSrc)) {
                        await fs.promises.copyFile(cssSrc, stylesDest);
                        break;
                    }
                }

                const manifestSrc = path.resolve("manifest.json");
                const manifestDest = path.join(VAULT_PLUGIN_DIR, "manifest.json");
                await fs.promises.copyFile(manifestSrc, manifestDest);

                console.log("Copied build output to Vault plugin directory.");
            } catch (err) {
                console.error("Failed to copy build output to Vault:", err);
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
    console.log("Watching for file changes...");
} else {
    await context.rebuild();
    await context.dispose();
}
