const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");
const prefixWrap = require("postcss-prefixwrap");

module.exports = {
    plugins: [
        tailwindcss(),
        autoprefixer(),
        prefixWrap("#fc-plugin-root", {
            ignoredSelectors: [
                /^\.markdown-preview-view/,
                /^\.markdown-rendered/,
                /^\.cm-line/,
                /^\.cm-activeLine/,
                /^\.cm-editor/,
            ],
        }),
    ],
};
