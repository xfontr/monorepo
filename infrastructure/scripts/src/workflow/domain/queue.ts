import type { SnapshotIssue } from "./snapshot.ts";

/** Mirrors `TicketStatus` and `ticketStatus` in apps/developer-portal/shared/workflows.ts; change both together. */
export type TicketStatus =
    "waiting-on-you" | "ready" | "in-flight" | "blocked" | "done" | "dropped";

export const ticketStatus = (issue: SnapshotIssue): TicketStatus => {
    if (issue.state === "closed") return issue.reason === "not_planned" ? "dropped" : "done";
    if (issue.branch) return "in-flight";
    if (issue.blockedBy.some(({ open }) => open)) return "blocked";
    return issue.owner ? "waiting-on-you" : "ready";
};

/** How many open tickets wait on each one, directly or through a chain of blocked-by links. */
export const unblockCounts = (issues: SnapshotIssue[]): Map<number, number> => {
    const waiting = new Map<number, number[]>();

    for (const issue of issues) {
        if (issue.state !== "open") continue;

        for (const blocker of issue.blockedBy) {
            if (blocker.open) {
                waiting.set(blocker.number, [...(waiting.get(blocker.number) ?? []), issue.number]);
            }
        }
    }

    return new Map(
        issues.map((issue) => {
            const seen = new Set<number>();
            const queue = [...(waiting.get(issue.number) ?? [])];

            for (let next = queue.pop(); next !== undefined; next = queue.pop()) {
                if (seen.has(next)) continue;
                seen.add(next);
                queue.push(...(waiting.get(next) ?? []));
            }

            return [issue.number, seen.size];
        }),
    );
};

const SECTIONS = [
    ["waiting-on-you", "Waiting on you"],
    ["ready", "Ready"],
    ["in-flight", "In flight"],
    ["blocked", "Blocked"],
] as const;

/** The open tickets as printable sections, each most-unblocking first; empty sections are left out. */
export const describeQueue = (issues: SnapshotIssue[]): string[] => {
    const counts = unblockCounts(issues);
    const lines: string[] = [];

    for (const [status, heading] of SECTIONS) {
        const tickets = issues
            .filter((issue) => ticketStatus(issue) === status)
            .sort(
                (a, b) =>
                    (counts.get(b.number) ?? 0) - (counts.get(a.number) ?? 0) ||
                    a.number - b.number,
            );

        if (tickets.length === 0) continue;

        lines.push(`${heading} (${tickets.length})`);

        for (const issue of tickets) {
            const unblocks = counts.get(issue.number) ?? 0;
            const tails = [
                issue.caps.length > 0 ? issue.caps.join(", ") : "no cap: label",
                unblocks > 0 ? `unblocks ${unblocks}` : "",
                status === "blocked"
                    ? `by ${issue.blockedBy
                          .filter(({ open }) => open)
                          .map(({ number }) => `#${number}`)
                          .join(" ")}`
                    : "",
            ].filter(Boolean);

            lines.push(`  #${issue.number} ${issue.title} — ${tails.join(" · ")}`);
        }
    }

    return lines;
};
