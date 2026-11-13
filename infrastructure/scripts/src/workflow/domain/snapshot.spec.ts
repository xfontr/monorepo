import { describe, expect, it } from "vitest";
import {
    activityByIssue,
    describeSnapshot,
    sameIssues,
    syncTargetOf,
    toSnapshot,
    type GhIssue,
} from "./snapshot.ts";

const issue = (overrides: Partial<GhIssue>): GhIssue => ({
    number: 1,
    title: "A ticket",
    url: "https://github.com/o/r/issues/1",
    state: "OPEN",
    stateReason: "",
    labels: [],
    createdAt: "2026-10-01T00:00:00Z",
    closedAt: null,
    blockedBy: [],
    branches: 0,
    pullRequests: 0,
    complexity: null,
    ...overrides,
});

const NO_ACTIVITY = new Map<number, string[]>();

describe("toSnapshot", () => {
    it("reads capabilities off `cap:` labels and ignores every other label", () => {
        const { issues } = toSnapshot(
            "Site",
            [
                issue({
                    labels: [{ name: "app:site" }, { name: "cap:search" }, { name: "cap:seo" }],
                }),
            ],
            [],
            NO_ACTIVITY,
            "2026-11-09T00:00:00Z",
        );

        expect(issues[0]?.caps).toEqual(["search", "seo"]);
    });

    it("keeps a not-planned close apart from a delivered one", () => {
        const { issues } = toSnapshot(
            "Site",
            [
                issue({
                    number: 2,
                    state: "CLOSED",
                    stateReason: "COMPLETED",
                    closedAt: "2026-11-01T00:00:00Z",
                }),
                issue({
                    number: 3,
                    state: "CLOSED",
                    stateReason: "NOT_PLANNED",
                    closedAt: "2026-11-02T00:00:00Z",
                }),
                issue({ number: 4 }),
            ],
            [],
            NO_ACTIVITY,
            "",
        );

        expect(issues.map(({ number, state, reason }) => [number, state, reason])).toEqual([
            [2, "closed", "completed"],
            [3, "closed", "not_planned"],
            [4, "open", null],
        ]);
    });

    it("keeps each blocker's state, since a blocker outside the milestone can't be looked up", () => {
        const { issues } = toSnapshot(
            "Site",
            [
                issue({
                    labels: [{ name: "owner" }],
                    blockedBy: [
                        { number: 9, state: "CLOSED", closedAt: "2026-10-02T00:00:00Z" },
                        { number: 4, state: "OPEN", closedAt: null },
                    ],
                    branches: 1,
                    pullRequests: 1,
                }),
            ],
            [],
            NO_ACTIVITY,
            "",
        );

        expect(issues[0]).toMatchObject({
            blockedBy: [
                { number: 4, open: true, closedAt: null },
                { number: 9, open: false, closedAt: "2026-10-02T00:00:00Z" },
            ],
            branch: true,
            pr: true,
            owner: true,
        });
    });

    it("keeps the board's complexity estimate and an unestimated ticket as null, never zero", () => {
        const { issues } = toSnapshot(
            "Site",
            [issue({ number: 1, complexity: 5 }), issue({ number: 2 })],
            [],
            NO_ACTIVITY,
            "",
        );

        expect(issues.map(({ complexity }) => complexity)).toEqual([5, null]);
    });

    it("orders issues by number so a re-sync with the same tickets produces the same file", () => {
        const { issues } = toSnapshot(
            "Site",
            [issue({ number: 9 }), issue({ number: 3 })],
            [],
            NO_ACTIVITY,
            "",
        );

        expect(issues.map(({ number }) => number)).toEqual([3, 9]);
    });
});

describe("activityByIssue", () => {
    it("credits every issue a subject names, once per commit, oldest first", () => {
        const log = [
            "2026-10-03\tfeat: [#12] add search",
            "2026-10-01\tfix: [#12] [#7] guard the empty query",
            "2026-10-02\tchore: [#12] [#12] rename twice in one subject",
        ].join("\n");

        expect(Object.fromEntries(activityByIssue(log))).toEqual({
            12: ["2026-10-01", "2026-10-02", "2026-10-03"],
            7: ["2026-10-01"],
        });
    });

    it("ignores a commit that names no issue, and a bare #N that isn't the [#N] tag", () => {
        const log = "2026-10-01\tchore: bump deps\n2026-10-02\tfix: follow-up to #12";

        expect(activityByIssue(log).size).toBe(0);
    });
});

describe("toSnapshot activity", () => {
    it("puts each issue's commit dates on it, and an empty list on one nobody committed to", () => {
        const { issues } = toSnapshot(
            "Site",
            [issue({ number: 1 }), issue({ number: 2 })],
            [],
            new Map([[1, ["2026-10-01"]]]),
            "",
        );

        expect(issues.map(({ activity }) => activity)).toEqual([["2026-10-01"], []]);
    });

    it("rewrites the file when only a new commit landed, so the page's activity moves", () => {
        const before = toSnapshot("Site", [issue({})], [], NO_ACTIVITY, "");
        const after = toSnapshot("Site", [issue({})], [], new Map([[1, ["2026-10-01"]]]), "");

        expect(sameIssues(before, after)).toBe(false);
    });
});

describe("sameIssues", () => {
    it("ignores the sync time, so an empty sync never dirties the working tree", () => {
        const before = toSnapshot("Site", [issue({})], [], NO_ACTIVITY, "2026-11-01T00:00:00Z");
        const after = toSnapshot("Site", [issue({})], [], NO_ACTIVITY, "2026-11-09T00:00:00Z");

        expect(sameIssues(before, after)).toBe(true);
        expect(sameIssues(null, after)).toBe(false);
    });

    it("rewrites the file when only a ticket outside the milestone appeared", () => {
        const before = toSnapshot("Site", [issue({})], [], NO_ACTIVITY, "");
        const after = toSnapshot("Site", [issue({})], [issue({ number: 5 })], NO_ACTIVITY, "");

        expect(sameIssues(before, after)).toBe(false);
    });
});

describe("syncTargetOf", () => {
    it.each([
        [null, "the file isn't a mapping"],
        [{ id: "site" }, "it names no `milestone:`"],
        [{ milestone: "  " }, "it names no `milestone:`"],
    ])("refuses %j rather than syncing every issue in the repo", (project, problem) => {
        expect(syncTargetOf(project)).toEqual({ problem });
    });

    it("skips the area query for a project with no area, rather than listing every open issue", () => {
        expect(syncTargetOf({ milestone: "Site", area: "" })).toEqual({
            milestone: "Site",
            area: null,
        });
    });
});

describe("describeSnapshot", () => {
    it("counts the issues still waiting for a capability label", () => {
        const snapshot = toSnapshot(
            "Site",
            [issue({}), issue({ number: 2, labels: [{ name: "cap:seo" }] })],
            [issue({ number: 3 })],
            NO_ACTIVITY,
            "",
        );

        expect(describeSnapshot(snapshot)).toBe(
            "2 issues (0 closed), 1 without a `cap:` label, 1 open outside the milestone",
        );
    });
});
