import { describe, expect, it } from "vitest";
import { describeQueue, ticketStatus, unblockCounts } from "./queue.ts";
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
    owner: false,
    ...overrides,
});

describe("ticketStatus", () => {
    it.each([
        [
            "a linked branch, even behind an open blocker",
            { branch: true, blockedBy: [{ number: 2, open: true, closedAt: null }] },
            "in-flight",
        ],
        ["an open blocker", { blockedBy: [{ number: 2, open: true, closedAt: null }] }, "blocked"],
        [
            "only closed blockers",
            { blockedBy: [{ number: 2, open: false, closedAt: null }] },
            "ready",
        ],
        ["the owner label and nothing in the way", { owner: true }, "waiting-on-you"],
        ["a not-planned close", { state: "closed", reason: "not_planned" }, "dropped"],
    ] as const)("reads a ticket with %s as %s", (_, overrides, expected) => {
        expect(ticketStatus(open(1, overrides as Partial<SnapshotIssue>))).toBe(expected);
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
