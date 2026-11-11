import { describe, expect, it } from "vitest";
import { dropPlan, issueAsOf, replayRange, ticketStatus } from "./ticket.ts";
import type { SnapshotIssue } from "./types.ts";

const issue = (number: number, caps: string[], overrides: Partial<SnapshotIssue> = {}) =>
    ({
        number,
        title: `#${number}`,
        url: "",
        state: "closed",
        reason: "completed",
        caps,
        createdAt: "2026-10-01T00:00:00Z",
        closedAt: "2026-11-01T00:00:00Z",
        activity: [],
        blockedBy: [],
        branch: false,
        pr: false,
        owner: false,
        complexity: null,
        ...overrides,
    }) satisfies SnapshotIssue;

const open = (number: number, caps: string[], overrides: Partial<SnapshotIssue> = {}) =>
    issue(number, caps, { state: "open", reason: null, closedAt: null, ...overrides });

/** The same rows as the scripts' `domain/queue.spec.ts`, so a change to one copy fails a spec. */
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
        expect(ticketStatus(open(1, [], overrides as Partial<SnapshotIssue>))).toBe(expected);
    });
});

describe("dropPlan", () => {
    it("closes only the tickets nobody started, the same split workflow:drop makes", () => {
        const { close, keep } = dropPlan(
            STATUSES.map(([, overrides], index) =>
                open(index + 1, [], overrides as Partial<SnapshotIssue>),
            ),
        );

        expect(close.map(({ number }) => number)).toEqual([6, 7, 8]);
        expect(keep.map(({ number }) => number)).toEqual([1, 2, 3, 4, 5]);
    });
});

describe("replay", () => {
    const HISTORY = [
        issue(1, ["kit"], {
            createdAt: "2026-10-01T09:00:00Z",
            closedAt: "2026-10-10T09:00:00Z",
            activity: ["2026-10-05"],
        }),
        issue(2, ["page"], {
            createdAt: "2026-10-08T09:00:00Z",
            closedAt: "2026-10-20T09:00:00Z",
            activity: ["2026-10-15"],
        }),
    ];

    it("reopens a blocker that closed after the day replayed, and drops a branch only the sync saw", () => {
        const replayed = issueAsOf(
            open(5, [], {
                branch: true,
                blockedBy: [{ number: 4, open: false, closedAt: "2026-10-20T00:00:00Z" }],
            }),
            "2026-10-10",
            "2026-11-09",
        );

        expect(replayed?.blockedBy[0]?.open).toBe(true);
        expect(replayed?.branch).toBe(false);
        expect(
            issueAsOf(open(6, [], { createdAt: "2026-10-11T00:00:00Z" }), "2026-10-10", null),
        ).toBeNull();
    });

    it("runs from the first commit on a ticket to the day of the sync", () => {
        expect(
            replayRange({
                syncedAt: "2026-11-09T10:00:00Z",
                milestone: "Site",
                issues: HISTORY,
                noMilestone: [],
            }),
        ).toEqual({ first: "2026-10-05", last: "2026-11-09" });
        expect(
            replayRange({
                syncedAt: "2026-11-09T10:00:00Z",
                milestone: "Site",
                issues: [],
                noMilestone: [],
            }),
        ).toBeNull();
    });
});
