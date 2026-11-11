import { describe, expect, it } from "vitest";
import { describeQueue, dropPlan, ticketStatus, unblockCounts } from "./queue.ts";
import type { SnapshotIssue } from "./snapshot.ts";

const open = (number: number, overrides: Partial<SnapshotIssue> = {}): SnapshotIssue => ({
    number,
    title: `Ticket ${number}`,
    url: "",
    state: "open",
    reason: null,
    caps: ["search"],
    createdAt: "2026-10-01T00:00:00Z",
    closedAt: null,
    activity: [],
    blockedBy: [],
    branch: false,
    pr: false,
    owner: false,
    complexity: null,
    ...overrides,
});

/** The same rows as the portal's `shared/ticket.spec.ts`, so a change to one copy fails a spec. */
const STATUSES = [
    ["closed as completed", { state: "closed", reason: "completed" }, "done"],
    ["closed as not planned", { state: "closed", reason: "not_planned" }, "dropped"],
    [
        "open on a linked branch, even if blocked",
        { branch: true, blockedBy: [{ number: 2, open: true, closedAt: null }] },
        "in-flight",
    ],
    ["open with an open pull request", { pr: true }, "in-flight"],
    ["open with a tagged commit", { activity: ["2026-10-02"] }, "in-flight"],
    [
        "open behind an open blocker",
        { blockedBy: [{ number: 2, open: true, closedAt: null }] },
        "blocked",
    ],
    [
        "open behind closed blockers only",
        { blockedBy: [{ number: 2, open: false, closedAt: null }] },
        "ready",
    ],
    ["open, unblocked and the owner's", { owner: true }, "waiting-on-you"],
] as const;

describe("ticketStatus", () => {
    it.each(STATUSES)("reads a ticket %s as %s", (_, overrides, expected) => {
        expect(ticketStatus(open(1, overrides as Partial<SnapshotIssue>))).toBe(expected);
    });
});

describe("dropPlan", () => {
    it("closes only the tickets nobody started, so dropping a project never discards work", () => {
        const { close, keep } = dropPlan(
            STATUSES.map(([, overrides], index) =>
                open(index + 1, overrides as Partial<SnapshotIssue>),
            ),
        );

        expect(close.map(({ number }) => number)).toEqual([6, 7, 8]);
        expect(keep.map(({ number }) => number)).toEqual([1, 2, 3, 4, 5]);
    });
});

describe("unblockCounts", () => {
    it("counts a ticket reached through two paths once", () => {
        const counts = unblockCounts([
            open(1),
            open(2, { blockedBy: [{ number: 1, open: true, closedAt: null }] }),
            open(3, {
                blockedBy: [
                    { number: 1, open: true, closedAt: null },
                    { number: 2, open: true, closedAt: null },
                ],
            }),
        ]);

        expect([counts.get(1), counts.get(2), counts.get(3)]).toEqual([2, 1, 0]);
    });
});

describe("describeQueue", () => {
    it("puts the owner's tickets first and the most-unblocking ready ticket at the top", () => {
        const lines = describeQueue([
            open(4),
            open(5),
            open(6, { blockedBy: [{ number: 5, open: true, closedAt: null }] }),
            open(7, { owner: true, caps: [] }),
        ]);

        expect(lines).toEqual([
            "Waiting on you (1)",
            "  #7 Ticket 7 — no cap: label",
            "Ready (2)",
            "  #5 Ticket 5 — search · unblocks 1",
            "  #4 Ticket 4 — search",
            "Blocked (1)",
            "  #6 Ticket 6 — search · by #5",
        ]);
    });
});
