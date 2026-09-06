import type { SpikeStatus } from "../../shared/types.ts";

/**
 * One place decides how a number looks. The palette behind these three classes was validated
 * against both surfaces (see `assets/css/main.css`); a fourth or fifth band would not pass, which
 * is why every tone is shown beside the figure it describes rather than instead of it.
 */
export type Tone = "good" | "warn" | "bad" | "neutral";

/** The one threshold pair in the app, so the overview tile and the coverage table cannot disagree. */
export function coverageTone(pct: number | null | undefined): Tone {
    if (pct === null || pct === undefined) return "neutral";
    if (pct >= 80) return "good";
    if (pct >= 60) return "warn";

    return "bad";
}

/** SCORECARDS.md's own scale: 4-5 is sound, 3 works but nothing enforces it, 1-2 is costing something now. */
export function scoreTone(score: number | null | undefined): Tone {
    if (score === null || score === undefined) return "neutral";
    if (score >= 4) return "good";
    if (score >= 3) return "warn";

    return "bad";
}

const CATEGORY_ICONS: Record<string, string> = {
    bug: "i-lucide-bug",
    feature: "i-lucide-sparkles",
    refactor: "i-lucide-wrench",
    test: "i-lucide-flask-conical",
    docs: "i-lucide-book-open",
    chore: "i-lucide-broom",
    idea: "i-lucide-lightbulb",
};

export function categoryIcon(category: string): string {
    return CATEGORY_ICONS[category] ?? "i-lucide-circle";
}

const KIND_ICONS: Record<string, string> = {
    readme: "i-lucide-file-text",
    claude: "i-lucide-bot",
    changelog: "i-lucide-tag",
    skill: "i-lucide-wand-sparkles",
    doc: "i-lucide-book-open",
    review: "i-lucide-clipboard-check",
    spike: "i-lucide-compass",
};

export function kindIcon(kind: string): string {
    return KIND_ICONS[kind] ?? "i-lucide-file-text";
}

const SPIKE_STATUS_LABELS: Record<SpikeStatus, string> = {
    "to-implement": "To implement",
    "implemented": "Implemented",
    "wont-implement": "Won't implement",
};

export function spikeStatusLabel(status: SpikeStatus): string {
    return SPIKE_STATUS_LABELS[status];
}

/** Reuses the same validated three-tone palette everything else on this page uses for a verdict. */
const SPIKE_STATUS_TONES: Record<SpikeStatus, Tone> = {
    "to-implement": "warn",
    "implemented": "good",
    "wont-implement": "neutral",
};

export function spikeStatusTone(status: SpikeStatus): Tone {
    return SPIKE_STATUS_TONES[status];
}

/** "3 hours ago" beats a timestamp for the one question a report page has to answer. */
export function relativeTime(iso: string | null | undefined): string {
    if (!iso) return "never";

    const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);

    const smallest = { unit: "second" as Intl.RelativeTimeFormatUnit, size: 1 };

    const scale = [
        smallest,
        { unit: "minute" as Intl.RelativeTimeFormatUnit, size: 60 },
        { unit: "hour" as Intl.RelativeTimeFormatUnit, size: 3600 },
        { unit: "day" as Intl.RelativeTimeFormatUnit, size: 86_400 },
        { unit: "month" as Intl.RelativeTimeFormatUnit, size: 2_592_000 },
        { unit: "year" as Intl.RelativeTimeFormatUnit, size: 31_536_000 },
    ];

    // The largest unit the gap fills at least once — "3 hours ago", never "180 minutes ago".
    const step = scale.findLast((entry) => Math.abs(seconds) >= entry.size) ?? smallest;

    return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
        .format(-Math.round(seconds / step.size), step.unit);
}
