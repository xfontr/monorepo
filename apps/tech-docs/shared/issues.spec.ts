import { describe, expect, it } from "vitest";
import type { Issue } from "./types.ts";
import { filterIssues, issuesApiUrl, labelsOf, sortIssues, summarize, toIssues } from "./issues.ts";

function issueOf(overrides: Partial<Issue>): Issue {
    return {
        number: 1,
        title: "an issue",
        body: "",
        url: "https://example.invalid/1",
        labels: [],
        assignees: [],
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

describe("labelsOf", () => {
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
        issueOf({ number: 1, title: "Rename the app", labels: ["chore"] }),
        issueOf({ number: 2, title: "Broken graph", body: "The iframe is blank" }),
    ];

    it("matches the issue number, because #2 is how the issue is referred to everywhere else", () => {
        expect(filterIssues(issues, { search: "#2" }).map((issue) => issue.number)).toEqual([2]);
    });

    it("searches the body, so an issue whose title says nothing is still findable", () => {
        expect(filterIssues(issues, { search: "iframe" }).map((issue) => issue.number)).toEqual([2]);
    });

    it("keeps everything under the 'all' sentinel, which is what an untouched filter sends", () => {
        expect(filterIssues(issues, { label: "all", search: "" })).toHaveLength(2);
    });
});

describe("toIssues", () => {
    const payload = [
        {
            number: 1,
            title: "an issue",
            body: null,
            html_url: "https://example.invalid/xfontr/monorepo/issues/1",
            url: "https://api.example.invalid/repos/xfontr/monorepo/issues/1",
            labels: [{ name: "spike" }],
            assignees: [{ login: "xfontr" }],
            created_at: "2026-09-01T12:00:00Z",
            updated_at: "2026-09-02T12:00:00Z",
        },
    ];

    it("reads the browser's URL, not the API's, which would link an issue to its own JSON", () => {
        expect(toIssues(payload)[0]?.url).toBe("https://example.invalid/xfontr/monorepo/issues/1");
    });

    it("drops the pull requests the issues endpoint returns, which `gh issue list` never did", () => {
        const withPr = [...payload, { ...payload[0]!, number: 2, pull_request: { url: "…" } }];

        expect(toIssues(withPr).map((issue) => issue.number)).toEqual([1]);
    });

    it("reads an empty body as a string, so every row can be summarised without a null check", () => {
        expect(toIssues(payload)[0]?.body).toBe("");
    });
});

describe("issuesApiUrl", () => {
    it("derives the endpoint from the repo URL, so no vendor host is written into this repo", () => {
        expect(issuesApiUrl("https://github.invalid/xfontr/monorepo"))
            .toBe("https://api.github.invalid/repos/xfontr/monorepo/issues");
    });

    it("drops a `.git` suffix, which a clone URL carries and the API rejects", () => {
        expect(issuesApiUrl("https://github.invalid/xfontr/monorepo.git"))
            .toBe("https://api.github.invalid/repos/xfontr/monorepo/issues");
    });

    it("answers null for anything that does not name a repo, which the page renders as a failure", () => {
        expect(issuesApiUrl("")).toBeNull();
        expect(issuesApiUrl("not a url")).toBeNull();
        expect(issuesApiUrl("https://github.invalid/xfontr")).toBeNull();
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
