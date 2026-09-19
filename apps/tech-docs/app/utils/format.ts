import type { DecisionOutcome, DecisionStatus } from "#shared/types.ts";

/** The palette behind these three classes lives in `assets/css/main.css` and is shown beside the figure it describes, never instead of it. */
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

/** `pnpm audit`'s own five-band scale, collapsed to the app's three tones. */
export function severityTone(severity: "info" | "low" | "moderate" | "high" | "critical"): Tone {
    if (severity === "critical" || severity === "high") return "bad";
    if (severity === "moderate") return "warn";

    return "neutral";
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
    agent: "i-lucide-bot",
    changelog: "i-lucide-tag",
    skill: "i-lucide-wand-sparkles",
    doc: "i-lucide-book-open",
    review: "i-lucide-clipboard-check",
    decision: "i-lucide-compass",
};

export function kindIcon(kind: string): string {
    return KIND_ICONS[kind] ?? "i-lucide-file-text";
}

const DECISION_STATUS_LABELS: Record<DecisionStatus, string> = {
    "to-implement": "To implement",
    "implemented": "Implemented",
    "wont-implement": "Won't implement",
};

export function decisionStatusLabel(status: DecisionStatus): string {
    return DECISION_STATUS_LABELS[status];
}

/** Reuses the same validated three-tone palette everything else on this page uses for a verdict. */
const DECISION_STATUS_TONES: Record<DecisionStatus, Tone> = {
    "to-implement": "warn",
    "implemented": "good",
    "wont-implement": "neutral",
};

export function decisionStatusTone(status: DecisionStatus): Tone {
    return DECISION_STATUS_TONES[status];
}

const DECISION_OUTCOME_LABELS: Record<DecisionOutcome, string> = {
    accepted: "Accepted",
    superseded: "Superseded",
};

export function decisionOutcomeLabel(decision: DecisionOutcome): string {
    return DECISION_OUTCOME_LABELS[decision];
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
