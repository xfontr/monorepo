import type { Snapshot, SnapshotIssue, TicketStatus } from "./types.ts";

export const day = (timestamp: string): string => timestamp.slice(0, 10);

/**
 * An issue as it stood at the end of `asOf`, or null if it wasn't filed yet. A linked branch is
 * only known for the day of the sync, so an earlier day goes by commits alone.
 */
export const issueAsOf = (
    issue: SnapshotIssue,
    asOf: string | null,
    syncedOn: string | null,
): SnapshotIssue | null => {
    if (asOf === null) return issue;
    if (issue.createdAt && day(issue.createdAt) > asOf) return null;

    const closed = issue.closedAt !== null && day(issue.closedAt) <= asOf;

    return {
        ...issue,
        state: closed ? "closed" : "open",
        reason: closed ? issue.reason : null,
        activity: issue.activity.filter((commit) => commit <= asOf),
        blockedBy: issue.blockedBy.map((blocker) => ({
            ...blocker,
            open: blocker.closedAt ? day(blocker.closedAt) > asOf : blocker.open,
        })),
        branch: issue.branch && syncedOn !== null && asOf >= syncedOn,
        pr: issue.pr && syncedOn !== null && asOf >= syncedOn,
    };
};

/** The first day a commit names one of the project's tickets, and the day of its last sync. */
export const replayRange = (snapshot: Snapshot | null): { first: string; last: string } | null => {
    const days = (snapshot?.issues ?? [])
        .flatMap((issue) => issue.activity)
        .sort((a, b) => a.localeCompare(b));
    if (!snapshot?.syncedAt || days.length === 0) return null;

    return { first: days[0]!, last: day(snapshot.syncedAt) };
};

export const ticketStatus = (issue: SnapshotIssue): TicketStatus => {
    if (issue.state === "closed") return issue.reason === "not_planned" ? "dropped" : "done";
    if (issue.branch || issue.pr || issue.activity.length > 0) return "in-flight";
    if (issue.blockedBy.some(({ open }) => open)) return "blocked";
    return issue.owner ? "waiting-on-you" : "ready";
};

const UNTOUCHED: ReadonlySet<TicketStatus> = new Set(["ready", "blocked", "waiting-on-you"]);

/** The tickets `pnpm workflow:drop` closes, and the ones it keeps because work started or ended. */
export const dropPlan = (
    issues: SnapshotIssue[],
): { close: SnapshotIssue[]; keep: SnapshotIssue[] } => ({
    close: issues.filter((issue) => UNTOUCHED.has(ticketStatus(issue))),
    keep: issues.filter((issue) => !UNTOUCHED.has(ticketStatus(issue))),
});
