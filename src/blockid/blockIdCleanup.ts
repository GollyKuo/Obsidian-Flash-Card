const BLOCK_ID_SUFFIX = /\s*\^fc-[a-zA-Z0-9_-]+\s*$/;
const FENCE_START_OR_END = /^\s*(```+|~~~+)/;

export interface StripBlockIdResult {
    content: string;
    idsRemoved: number;
}

export function stripBlockIdsFromMarkdown(content: string): StripBlockIdResult {
    const lines = content.split("\n");
    let idsRemoved = 0;

    let insideFence = false;
    let currentFenceMarker: string | null = null;

    const cleanedLines = lines.map((line) => {
        const fenceMatch = line.match(FENCE_START_OR_END);
        if (fenceMatch) {
            const fenceMarker = fenceMatch[1][0];

            if (!insideFence) {
                insideFence = true;
                currentFenceMarker = fenceMarker;
            } else if (currentFenceMarker === fenceMarker) {
                insideFence = false;
                currentFenceMarker = null;
            }

            return line;
        }

        if (insideFence) {
            return line;
        }

        if (!BLOCK_ID_SUFFIX.test(line)) {
            return line;
        }

        idsRemoved++;
        return line.replace(BLOCK_ID_SUFFIX, "");
    });

    return {
        content: cleanedLines.join("\n"),
        idsRemoved,
    };
}
