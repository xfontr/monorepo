export type ShipOutcome = {
    checksPassed: boolean
    merged: boolean
};

/**
 * The three shapes a ship can end in. "Passed but not merged" is real, not theoretical: auto-merge
 * only queues the merge, so a PR that also needs an up-to-date branch or a second required check
 * outside what `gh pr checks` watched can sit mergeable-but-not-yet-merged for a beat after this
 * prints.
 */
export const shipMessage = ({ checksPassed, merged }: ShipOutcome): string => {
    if (!checksPassed) return "❌ a check failed — PR left open.";
    if (merged) return "✅ pipelines green, PR auto-merged.";
    return "✅ pipelines green, merge queued — should land shortly.";
};
