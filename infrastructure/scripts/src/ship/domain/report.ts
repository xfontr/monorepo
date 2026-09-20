export type ShipOutcome = {
    checksPassed: boolean
    merged: boolean
};

export type ShipReport = {
    message: string
    exitCode: number | undefined
    syncMaster: boolean
};

/** A passed check can still be unmerged because auto-merge only queues the merge. */
export const shipMessage = ({ checksPassed, merged }: ShipOutcome): string => {
    if (!checksPassed) return "❌ a check failed — PR left open.";
    if (merged) return "✅ pipelines green, PR auto-merged.";
    return "✅ pipelines green, merge queued — should land shortly.";
};

export const shipReport = (outcome: ShipOutcome): ShipReport => ({
    message: shipMessage(outcome),
    exitCode: outcome.checksPassed ? undefined : 1,
    syncMaster: outcome.checksPassed && outcome.merged,
});
