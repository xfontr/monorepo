import { describe, expect, it } from "vitest";
import type { Issue } from "./types.ts";
import { filterIssues, labelsOf, NO_PROJECT, projectsOf, sortIssues, summarize } from "./issues.ts";

function issueOf(overrides: Partial<Issue>): Issue {
    return {
        number: 1,
        title: "an issue",
        body: "",
        url: "https://example.invalid/1",
        labels: [],
        assignees: [],
        project: null,
        projectStatus: null,
        createdAt: "2026-09-01T12:00:00Z",
        updatedAt: "2026-09-01T12:00:00Z",
        ...overrides,
    };
}

describe("summarize", () => {
    it("strips the markdown instead of clamping it, so a row never ends mid-syntax", () => {
        expect(summarize("**Decision needed.** See [the spike](./docs/spikes/0040.md) first."))
            .toBe("Decision needed. See the spike first.");
    });

    it("drops a fenced repro block, which is the longest thing in a bug body and says least in a row", () => {
        expect(summarize("Fails on boot.\n\n```sh\npnpm dashboard\n```\n\nEvery time.")).toBe("Fails on boot. Every time.");
    });

    it("drops the task list markers a template body opens with rather than showing empty boxes", () => {
        expect(summarize("Acceptance criteria:\n- [ ] one\n- [x] two")).toBe("Acceptance criteria: one two");
    });

    it("cuts on a word boundary, so the ellipsis never lands inside a word", () => {
        expect(summarize("alpha bravo charlie delta", 18)).toBe("alpha bravo…");
    });

    it("cuts mid-word rather than losing most of the line when one word fills the clamp", () => {
        expect(summarize("a supercalifragilisticexpialidocious", 12)).toBe("a supercalif…");
    });

    it("leaves a body that already fits alone, so a short issue shows no ellipsis", () => {
        expect(summarize("Short enough.")).toBe("Short enough.");
    });
});

describe("projectsOf and labelsOf", () => {
    it("offers each board once, so the filter does not repeat a project per issue on it", () => {
        const issues = [issueOf({ project: "Monorepo" }), issueOf({ project: "Monorepo" }), issueOf({ project: null })];

        expect(projectsOf(issues)).toEqual(["Monorepo"]);
    });

    it("collects labels across issues, so filtering offers one that only one issue carries", () => {
        const issues = [
            issueOf({ labels: ["spike"] }),
            issueOf({ labels: ["bug", "spike"] }),
        ];

        expect(labelsOf(issues)).toEqual(["bug", "spike"]);
    });
});

describe("filterIssues", () => {
    const issues = [
        issueOf({ number: 1, title: "Rename the app", project: "Monorepo", labels: ["chore"] }),
        issueOf({ number: 2, title: "Broken graph", body: "The iframe is blank", project: null }),
    ];

    it("matches the issue number, because #2 is how the issue is referred to everywhere else", () => {
        expect(filterIssues(issues, { search: "#2" }).map((issue) => issue.number)).toEqual([2]);
    });

    it("searches the body, so an issue whose title says nothing is still findable", () => {
        expect(filterIssues(issues, { search: "iframe" }).map((issue) => issue.number)).toEqual([2]);
    });

    it("treats an issue on no board as excluded by a project filter rather than as matching every one", () => {
        expect(filterIssues(issues, { project: "Monorepo" }).map((issue) => issue.number)).toEqual([1]);
    });

    it("finds the issues on no board at all, which no board's own name can select", () => {
        expect(filterIssues(issues, { project: NO_PROJECT }).map((issue) => issue.number)).toEqual([2]);
    });

    it("keeps everything under the 'all' sentinel, which is what an untouched filter sends", () => {
        expect(filterIssues(issues, { project: "all", label: "all", search: "" })).toHaveLength(2);
    });
});

describe("sortIssues", () => {
    it("puts the most recently touched first, so the top of the list is what is actually moving", () => {
        const sorted = sortIssues([
            issueOf({ number: 1, updatedAt: "2026-09-01T00:00:00Z" }),
            issueOf({ number: 2, updatedAt: "2026-09-06T00:00:00Z" }),
        ]);

        expect(sorted.map((issue) => issue.number)).toEqual([2, 1]);
    });

    it("falls back to the newer issue number, so two touched in the same second do not swap on refresh", () => {
        const sorted = sortIssues([
            issueOf({ number: 7, updatedAt: "2026-09-06T00:00:00Z" }),
            issueOf({ number: 9, updatedAt: "2026-09-06T00:00:00Z" }),
        ]);

        expect(sorted.map((issue) => issue.number)).toEqual([9, 7]);
    });
});
