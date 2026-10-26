import { describe, expect, it } from "vitest";
import {
    blockersIn,
    decisionNumbersIn,
    docsIn,
    issueNumberFrom,
    parseDecision,
    projectsFor,
    referencedIssues,
    relevantDecisions,
    renderBrief,
    type IssueThread,
} from "./brief.ts";

// Trimmed from #251, which uses the `github-issue` task template.
const BODY = [
    "**User story:** As the journal, I want the domain served by Nuxt.",
    "",
    "- [ ] The WP hostname move and DNS, done by the owner ADR 0028 names",
    "",
    "**Blocked by:** #244, #250, #245",
    "",
    "Plan: `docs/plans/huella-legal-implementation.md` (F2)",
].join("\n");

const THREAD: IssueThread = {
    number: 251,
    title: "Cut over the domain to Nuxt",
    state: "OPEN",
    url: "issue-url",
    body: BODY,
    labels: ["enhancement", "app:huella-legal"],
    assignees: [],
    boards: [{ title: "Huella Legal", status: "Todo" }],
    comments: [
        {
            author: "xfontr",
            createdAt: "2026-10-01T10:00:00Z",
            body: "Settled in #26: touch packages/content too.",
        },
    ],
};

const DIRS = ["apps/huella-legal", "packages/content", "infrastructure/scripts"];

describe("blockersIn", () => {
    it("reads every number on the Blocked by line and none from the rest of the body", () => {
        expect(blockersIn(`See #12 first.\n${BODY}`)).toEqual([244, 250, 245]);
    });
});

describe("referencedIssues", () => {
    it("includes issues named only in a comment, where a decision often lives", () => {
        expect(referencedIssues(THREAD)).toContain(26);
    });

    it("leaves out the issue itself", () => {
        expect(referencedIssues({ ...THREAD, body: "Follow-up to #251 and #3" })).toEqual([3, 26]);
    });
});

describe("decisions", () => {
    const DECISION = "---\nissue: 26\nstatus: to-implement\ndecision: accepted\n---\n\n# 🧭 Title";

    it("reads issue, status and decision from frontmatter", () => {
        expect(parseDecision("docs/decisions/0009-x.md", DECISION)).toEqual({
            path: "docs/decisions/0009-x.md",
            issue: 26,
            status: "to-implement",
            decision: "accepted",
        });
    });

    // One old report carries prose in its `issue:` field rather than a number.
    it("reads a non-numeric issue field as no issue rather than NaN", () => {
        expect(parseDecision("p", "---\nissue: **two files**\n---").issue).toBeUndefined();
    });

    it("matches on the frontmatter issue, never on the file number, plus ADRs named in prose", () => {
        const decisions = [
            parseDecision("docs/decisions/0026-a.md", DECISION),
            parseDecision("docs/decisions/0028-b.md", "---\nissue: 99\n---"),
            parseDecision("docs/decisions/0251-c.md", "---\nissue: 7\n---"),
        ];

        expect(
            relevantDecisions(
                decisions,
                [251, ...referencedIssues(THREAD)],
                decisionNumbersIn(BODY),
            ).map(({ path }) => path),
        ).toEqual(["docs/decisions/0026-a.md", "docs/decisions/0028-b.md"]);
    });
});

describe("projectsFor", () => {
    it("joins the app label, the board slug and paths in the thread, keeping only real folders", () => {
        expect(projectsFor(THREAD, "huella-legal", DIRS)).toEqual([
            "apps/huella-legal",
            "packages/content",
        ]);
    });

    it("matches nothing for a board that spans several projects", () => {
        expect(
            projectsFor({ ...THREAD, labels: [], comments: [] }, "infrastructure", DIRS),
        ).toEqual([]);
    });
});

describe("docsIn", () => {
    it("finds a backticked skill path, which a word boundary before the dot would miss", () => {
        expect(docsIn("See `.claude/skills/start-issue/SKILL.md`.", () => true)).toEqual([
            ".claude/skills/start-issue/SKILL.md",
        ]);
    });

    it("lists the markdown paths the thread points at that exist", () => {
        expect(docsIn(BODY, () => true)).toEqual(["docs/plans/huella-legal-implementation.md"]);
        expect(docsIn(BODY, () => false)).toEqual([]);
    });
});

describe("renderBrief", () => {
    it("prints the body and every comment untrimmed, and skips empty sections", () => {
        const brief = renderBrief({
            thread: THREAD,
            blockers: [{ number: 244, title: "Redirect map", state: "CLOSED" }],
            decisions: [],
            projects: [{ dir: "apps/huella-legal", agents: "apps/huella-legal/CLAUDE.md" }],
            docs: [],
        });

        expect(brief).toContain(BODY);
        expect(brief).toContain("Settled in #26: touch packages/content too.");
        expect(brief).toContain(
            "OPEN · enhancement, app:huella-legal · unassigned · Huella Legal: Todo",
        );
        expect(brief).toContain("#244 Redirect map — CLOSED");
        expect(brief).toContain("apps/huella-legal — read apps/huella-legal/CLAUDE.md");
        expect(brief).not.toContain("## Decisions");
    });
});

describe("issueNumberFrom", () => {
    it.each([
        ["42", 42],
        ["#42", 42],
        ["https://github.com/owner/repo/issues/42", 42],
        ["https://github.com/owner/repo/issues/42/", 42],
        ["not-an-issue", undefined],
        ["v2", undefined],
        ["https://github.com/owner/repo/pull/42", undefined],
    ])("reads %j as %s", (value, expected) => {
        expect(issueNumberFrom(value)).toBe(expected);
    });
});
