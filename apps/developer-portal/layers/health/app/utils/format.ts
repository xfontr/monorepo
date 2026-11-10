import type { Tone } from "~/utils/format.ts";

/** The one threshold pair in the app, so the overview tile and the coverage table cannot disagree. */
export const coverageTone = (pct: number | null | undefined): Tone => {
    if (pct === null || pct === undefined) return "neutral";
    if (pct >= 80) return "good";
    if (pct >= 60) return "warn";

    return "bad";
};

/** `pnpm audit`'s own five-band scale, collapsed to the app's three tones. */
export const severityTone = (severity: "info" | "low" | "moderate" | "high" | "critical"): Tone => {
    if (severity === "critical" || severity === "high") return "bad";
    if (severity === "moderate") return "warn";

    return "neutral";
};
