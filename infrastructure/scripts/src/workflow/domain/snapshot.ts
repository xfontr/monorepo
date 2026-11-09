/** Mirrors `CAPABILITY_LABEL_PREFIX` in apps/developer-portal/shared/workflows.ts. */
export const CAPABILITY_LABEL_PREFIX = "cap:";

/** One issue as `gh issue list --json number,title,url,state,stateReason,labels,closedAt` prints it. */
export interface GhIssue {
    number: number;
    title: string;
    url: string;
    state: string;
    stateReason: string;
    labels: { name: string }[];
    closedAt: string | null;
}

export interface SnapshotIssue {
    number: number;
    title: string;
    url: string;
    state: "open" | "closed";
    reason: "completed" | "not_planned" | null;
    caps: string[];
    closedAt: string | null;
    /** The author date of every commit whose subject names this issue as `[#N]`, ascending. */
    activity: string[];
}

/** Read back by `readSnapshot` in apps/developer-portal/shared/workflows.ts; change both together. */
export interface Snapshot {
    syncedAt: string;
    milestone: string;
    issues: SnapshotIssue[];
    noMilestone: SnapshotIssue[];
}

const reasonOf = (issue: GhIssue): SnapshotIssue["reason"] => {
    if (issue.state !== "CLOSED") return null;
    return issue.stateReason === "NOT_PLANNED" ? "not_planned" : "completed";
};

const ISSUE_TAG = /\[#(\d+)\]/g;

/** `git log --format=%ad%x09%s --date=short` output to each issue's commit dates, ascending. */
export const activityByIssue = (log: string): Map<number, string[]> => {
    const byIssue = new Map<number, string[]>();

    for (const line of log.split("\n")) {
        const [day, subject] = line.split("\t");
        if (!day || !subject) continue;

        for (const number of new Set([...subject.matchAll(ISSUE_TAG)].map((match) => match[1]))) {
            const days = byIssue.get(Number(number)) ?? [];
            days.push(day);
            byIssue.set(Number(number), days);
        }
    }

    for (const days of byIssue.values()) days.sort((a, b) => a.localeCompare(b));

    return byIssue;
};

const toIssue = (issue: GhIssue, activity: Map<number, string[]>): SnapshotIssue => ({
    number: issue.number,
    title: issue.title,
    url: issue.url,
    state: issue.state === "CLOSED" ? "closed" : "open",
    reason: reasonOf(issue),
    caps: issue.labels
        .map(({ name }) => name)
        .filter((name) => name.startsWith(CAPABILITY_LABEL_PREFIX))
        .map((name) => name.slice(CAPABILITY_LABEL_PREFIX.length))
        .sort((a, b) => a.localeCompare(b)),
    closedAt: issue.closedAt || null,
    activity: activity.get(issue.number) ?? [],
});

export const toSnapshot = (
    milestone: string,
    issues: GhIssue[],
    noMilestone: GhIssue[],
    activity: Map<number, string[]>,
    syncedAt: string,
): Snapshot => {
    const byNumber = (list: GhIssue[]): SnapshotIssue[] =>
        list.map((issue) => toIssue(issue, activity)).sort((a, b) => a.number - b.number);

    return { syncedAt, milestone, issues: byNumber(issues), noMilestone: byNumber(noMilestone) };
};

/** The milestone and area label a parsed project file names, or why it can't be synced. */
export const syncTargetOf = (
    project: unknown,
): { milestone: string; area: string | null } | { problem: string } => {
    if (project === null || typeof project !== "object" || Array.isArray(project)) {
        return { problem: "the file isn't a mapping" };
    }

    const { milestone, area } = project as { milestone?: unknown; area?: unknown };

    if (typeof milestone !== "string" || milestone.trim() === "") {
        return { problem: "it names no `milestone:`" };
    }

    return { milestone, area: typeof area === "string" && area.trim() !== "" ? area : null };
};

/** Compared without `syncedAt`, so a sync that found nothing new leaves the file and its diff alone. */
export const sameIssues = (before: Snapshot | null, after: Snapshot): boolean =>
    before !== null &&
    before.milestone === after.milestone &&
    JSON.stringify(before.issues) === JSON.stringify(after.issues) &&
    JSON.stringify(before.noMilestone ?? []) === JSON.stringify(after.noMilestone);

export const describeSnapshot = ({ issues, noMilestone }: Snapshot): string => {
    const closed = issues.filter((issue) => issue.state === "closed").length;
    const unplaced = issues.filter((issue) => issue.caps.length === 0).length;
    const tails = [
        unplaced === 0 ? "" : `${unplaced} without a \`${CAPABILITY_LABEL_PREFIX}\` label`,
        noMilestone.length === 0 ? "" : `${noMilestone.length} open outside the milestone`,
    ].filter(Boolean);

    return [`${issues.length} issues (${closed} closed)`, ...tails].join(", ");
};
