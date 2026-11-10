import type { Tone } from "~/utils/format.ts";

/** SCORECARDS.md's own scale: 4-5 is sound or better, 3 is mixed, 1-2 is costing something now. */
export const scoreTone = (score: number | null | undefined): Tone => {
    if (score === null || score === undefined) return "neutral";
    if (score >= 4) return "good";
    if (score >= 3) return "warn";

    return "bad";
};
