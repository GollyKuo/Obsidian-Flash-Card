import { FlashcardType } from "../parser/types";
import {
    FLASHCARD_DATA_VERSION,
    FSRSState,
    FlashcardData,
    FlashcardRecord,
    createDefaultFsrsState,
    createEmptyFlashcardData,
} from "./types";

export interface MigrationResult {
    data: FlashcardData;
    migrated: boolean;
}

export function migrateFlashcardData(raw: unknown): MigrationResult {
    if (!isRecord(raw)) {
        return {
            data: createEmptyFlashcardData(),
            migrated: true,
        };
    }

    const rawVersion = typeof raw.version === "string" ? raw.version : "";
    const rawCards = isRecord(raw.cards) ? raw.cards : {};
    const normalizedCards: Record<string, FlashcardRecord> = {};

    let migrated = rawVersion !== FLASHCARD_DATA_VERSION || !isRecord(raw.cards);
    for (const [fallbackBlockId, rawCard] of Object.entries(rawCards)) {
        if (!isRecord(rawCard)) {
            migrated = true;
            continue;
        }

        const normalized = normalizeCard(rawCard, fallbackBlockId);
        if (normalized.changed) {
            migrated = true;
        }

        normalizedCards[normalized.card.blockId] = normalized.card;
    }

    return {
        migrated,
        data: {
            version: FLASHCARD_DATA_VERSION,
            cards: normalizedCards,
        },
    };
}

function normalizeCard(
    rawCard: Record<string, unknown>,
    fallbackBlockId: string
): { card: FlashcardRecord; changed: boolean } {
    const nowIso = new Date().toISOString();
    let changed = false;

    const blockId =
        typeof rawCard.blockId === "string" && rawCard.blockId.trim().length > 0
            ? rawCard.blockId
            : fallbackBlockId;
    changed ||= rawCard.blockId !== blockId;

    const sourcePath =
        typeof rawCard.sourcePath === "string" ? rawCard.sourcePath : "";
    changed ||= rawCard.sourcePath !== sourcePath;

    const type = normalizeCardType(rawCard.type);
    changed ||= rawCard.type !== type;

    const front = typeof rawCard.front === "string" ? rawCard.front : "";
    changed ||= rawCard.front !== front;

    const back = typeof rawCard.back === "string" ? rawCard.back : "";
    changed ||= rawCard.back !== back;

    const createdAt = normalizeIsoString(rawCard.createdAt, nowIso);
    const updatedAt = normalizeIsoString(rawCard.updatedAt, nowIso);
    changed ||= rawCard.createdAt !== createdAt || rawCard.updatedAt !== updatedAt;

    const fsrs = normalizeFsrsState(rawCard.fsrs, nowIso);
    changed ||= fsrs.changed;

    const card: FlashcardRecord = {
        blockId,
        sourcePath,
        type,
        front,
        back,
        fsrs: fsrs.state,
        createdAt,
        updatedAt,
    };

    if (isRecord(rawCard.context)) {
        const headers = Array.isArray(rawCard.context.headers)
            ? rawCard.context.headers.filter((value): value is string => {
                  return typeof value === "string";
              })
            : [];

        const parentIndent =
            typeof rawCard.context.parentIndent === "string"
                ? rawCard.context.parentIndent
                : "";

        if (headers.length > 0 || parentIndent.length > 0) {
            card.context = { headers, parentIndent };
        } else {
            changed = true;
        }
    }

    if (isRecord(rawCard.enrichment)) {
        const enrichment: NonNullable<FlashcardRecord["enrichment"]> = {};

        if (typeof rawCard.enrichment.explanation === "string") {
            enrichment.explanation = rawCard.enrichment.explanation;
        }

        if (typeof rawCard.enrichment.imagePath === "string") {
            enrichment.imagePath = rawCard.enrichment.imagePath;
        }

        if (typeof rawCard.enrichment.audioPath === "string") {
            enrichment.audioPath = rawCard.enrichment.audioPath;
        }

        if (Object.keys(enrichment).length > 0) {
            card.enrichment = enrichment;
        } else {
            changed = true;
        }
    }

    return { card, changed };
}

function normalizeCardType(rawType: unknown): FlashcardType {
    if (
        rawType === FlashcardType.Forward ||
        rawType === FlashcardType.Reverse ||
        rawType === FlashcardType.Bidirectional ||
        rawType === FlashcardType.Cloze
    ) {
        return rawType;
    }

    return FlashcardType.Forward;
}

function normalizeFsrsState(
    rawFsrs: unknown,
    fallbackNowIso: string
): { state: FSRSState; changed: boolean } {
    const defaults = createDefaultFsrsState(new Date(fallbackNowIso));
    if (!isRecord(rawFsrs)) {
        return {
            state: defaults,
            changed: true,
        };
    }

    const state: FSRSState = {
        difficulty: normalizeNumber(rawFsrs.difficulty, defaults.difficulty),
        stability: normalizeNumber(rawFsrs.stability, defaults.stability),
        retrievability: normalizeNumber(
            rawFsrs.retrievability,
            defaults.retrievability
        ),
        due: normalizeIsoString(rawFsrs.due, defaults.due),
        reps: normalizeInteger(rawFsrs.reps, defaults.reps),
        lapses: normalizeInteger(rawFsrs.lapses, defaults.lapses),
        state: normalizeReviewState(rawFsrs.state, defaults.state),
    };

    let changed = false;
    changed ||= rawFsrs.difficulty !== state.difficulty;
    changed ||= rawFsrs.stability !== state.stability;
    changed ||= rawFsrs.retrievability !== state.retrievability;
    changed ||= rawFsrs.due !== state.due;
    changed ||= rawFsrs.reps !== state.reps;
    changed ||= rawFsrs.lapses !== state.lapses;
    changed ||= rawFsrs.state !== state.state;

    if (rawFsrs.lastReview !== undefined) {
        if (typeof rawFsrs.lastReview === "string") {
            const normalizedLastReview = normalizeIsoString(
                rawFsrs.lastReview,
                rawFsrs.lastReview
            );

            if (normalizedLastReview === rawFsrs.lastReview) {
                state.lastReview = normalizedLastReview;
            } else {
                changed = true;
            }
        } else {
            changed = true;
        }
    }

    return { state, changed };
}

function normalizeReviewState(
    value: unknown,
    fallback: FSRSState["state"]
): FSRSState["state"] {
    if (
        value === "new" ||
        value === "learning" ||
        value === "review" ||
        value === "relearning"
    ) {
        return value;
    }

    return fallback;
}

function normalizeNumber(value: unknown, fallback: number): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return fallback;
    }

    return value;
}

function normalizeInteger(value: unknown, fallback: number): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return fallback;
    }

    return Math.max(0, Math.floor(value));
}

function normalizeIsoString(value: unknown, fallback: string): string {
    if (typeof value !== "string") {
        return fallback;
    }

    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) {
        return fallback;
    }

    return new Date(timestamp).toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
