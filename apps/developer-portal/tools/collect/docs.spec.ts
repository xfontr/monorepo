import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolve } from "node:path";
import { WORKSPACE_ROOT } from "../lib/paths.ts";
import { collectDocs } from "./docs.ts";
import { decisionMetaOf, hrefsIn } from "./docs.ts";

const state = vi.hoisted(() => ({
    files: new Set<string>(),
    paths: [] as string[],
    sources: new Map<string, string>(),
    updatedAt: new Map<string, string>(),
}));
const fs = vi.hoisted(() => ({ access: vi.fn(), readFile: vi.fn() }));
const run = vi.hoisted(() => ({ git: vi.fn() }));

vi.mock("node:fs/promises", () => fs);
vi.mock("../lib/run.ts", () => run);

function addFile(path: string, source: string, updatedAt = "2026-09-20T10:00:00Z"): void {
    const absolute = resolve(WORKSPACE_ROOT, path);
    state.files.add(absolute);
    state.sources.set(absolute, source);
    state.updatedAt.set(path, updatedAt);
}

beforeEach(() => {
    vi.clearAllMocks();
    state.files.clear();
    state.paths = [];
    state.sources.clear();
    state.updatedAt.clear();
    fs.access.mockImplementation(async (path: string) => {
        if (!state.files.has(path)) throw new Error("missing");
    });
    fs.readFile.mockImplementation(async (path: string) => state.sources.get(path) ?? "");
    run.git.mockImplementation(async (args: string[]) => {
        if (args[0] === "ls-files") return state.paths.join("\n");

        const path = args.at(-1) as string;

        return state.updatedAt.get(path) ?? "";
    });
});

const frontmatter = (body: string): string => `---\n${body}\n---\n\n# 🧭 A title\n`;

describe("decisionMetaOf", () => {
    it("reads status and decision off a decision report's frontmatter", () => {
        expect(decisionMetaOf("docs/decisions/0001-feature-discoverability.md", frontmatter("issue: 37\nstatus: implemented\ndecision: accepted")))
            .toEqual({ status: "implemented", decision: "accepted", supersededBy: null });
    });

    it("reads supersededBy only when decision is superseded", () => {
        const source = frontmatter("issue: 38\nstatus: to-implement\ndecision: superseded\nsupersededBy: 0150-resolved.md");

        expect(decisionMetaOf("docs/decisions/0038-old.md", source).supersededBy).toBe("0150-resolved.md");
    });

    it("drops supersededBy when decision isn't superseded, even if the frontmatter sets it anyway", () => {
        const source = frontmatter("issue: 37\nstatus: implemented\ndecision: accepted\nsupersededBy: 0150-resolved.md");

        expect(decisionMetaOf("docs/decisions/0001-feature-discoverability.md", source).supersededBy).toBeNull();
    });

    it("answers all-null for anything that isn't a decision report, so a doc that happens to carry frontmatter is never mistaken for one", () => {
        expect(decisionMetaOf("docs/guides/first-hour.md", frontmatter("status: implemented\ndecision: accepted")))
            .toEqual({ status: null, decision: null, supersededBy: null });
    });

    it("answers all-null for the template, which has no frontmatter to parse", () => {
        expect(decisionMetaOf("docs/decisions/TEMPLATE.md", "# 🧭 <Decision title>\n"))
            .toEqual({ status: null, decision: null, supersededBy: null });
    });

    it("answers null status rather than guess at an unrecognised value, so a typo shows as missing instead of wrong", () => {
        const source = frontmatter("issue: 40\nstatus: done\ndecision: accepted");

        expect(decisionMetaOf("docs/decisions/0002-docs-drift-detection.md", source).status).toBeNull();
    });
});

describe("hrefsIn", () => {
    it("skips link syntax shown in a code span or a fenced sample, so documenting a link never reports it broken", () => {
        const source = [
            "Write `[x](y)` to link.",
            "```md",
            "[template](./<previous>.md)",
            "```",
            "- A list item:",
            "  ```sh",
            "  echo [a](b)",
            "  ```",
            "[real](./real.md)",
        ].join("\n");

        expect(hrefsIn(source)).toEqual(["./real.md"]);
    });

    it("keeps a link whose text is code, including brackets inside that code", () => {
        expect(hrefsIn("See [`add.ts`](./add.ts) and [`pages/[slug].vue`](./pages/%5Bslug%5D.vue)."))
            .toEqual(["./add.ts", "./pages/%5Bslug%5D.vue"]);
        expect(hrefsIn("[`[artifact].get.ts`](./[artifact].get.ts \"Route [artifact]\")"))
            .toEqual(["./[artifact].get.ts"]);
    });

    // A span that wraps is common in hard-wrapped prose, and pairing its closing tick with the next link's opening one loses that link.
    it("pairs a code span that wraps a line, but never lets one run past a blank line", () => {
        expect(hrefsIn("the `pnpm install\n--prod` in the [`Dockerfile`](./docker/Dockerfile)")).toEqual(["./docker/Dockerfile"]);
        expect(hrefsIn("a stray ` tick\n\n[after](./after.md)")).toEqual(["./after.md"]);
    });

    it("reads titled links after malformed brackets without rescanning a long prefix", () => {
        const source = `${"[".repeat(20_000)}\n[good](./good.md "A title")`;

        expect(hrefsIn(source)).toEqual(["./good.md"]);
        expect(hrefsIn(`${"[bad](unterminated ".repeat(20_000)}[good](./good.md)`)).toEqual(["./good.md"]);
    });

    it("skips multiline code spans and leaves links after unmatched backtick runs", () => {
        expect(hrefsIn("``[hidden](./hidden.md)\nstill hidden`` [shown](./shown.md)"))
            .toEqual(["./shown.md"]);
        expect(hrefsIn(`stray ${"`".repeat(20_000)}\n\n[after](./after.md)`))
            .toEqual(["./after.md"]);
        expect(hrefsIn("`` [visible](./visible.md) ```")).toEqual(["./visible.md"]);
    });
});

describe("collectDocs", () => {
    it("collects only tracked and unignored markdown paths with titles, fallback names and timestamps", async () => {
        const files = [
            ["README.md", "# Workspace\n"],
            ["AGENTS.md", "## Agent guidance\n"],
            [".agents/skills/example/SKILL.md", "# Skill\n"],
            ["packages/ui/CHANGELOG.md", "# Changelog\n"],
            ["docs/reviews/2026-09-20-abc123.md", "# Review\n"],
            ["docs/decisions/0001-first.md", "# Decision\n"],
            ["docs/guides/no-heading.md", "word word\n"],
            ["docs/README.md", "# Docs\n"],
        ] as const;
        files.forEach(([path, source], index) => addFile(path, source, `2026-09-${String(index + 1).padStart(2, "0")}T10:00:00Z`));
        state.paths = [...files.map(([path]) => path), "docs/ignored.md"];

        const result = await collectDocs("now");

        expect(result.pages.map((page) => page.path)).toEqual(files.map(([path]) => path).sort((a, b) => a.localeCompare(b)));
        expect(result.pages.find((page) => page.path === "README.md")).toMatchObject({ kind: "readme", title: "Workspace", updatedAt: "2026-09-01T10:00:00Z" });
        expect(result.pages.find((page) => page.path === "AGENTS.md")).toMatchObject({ kind: "agent", title: "Agent guidance" });
        expect(result.pages.find((page) => page.path === ".agents/skills/example/SKILL.md")).toMatchObject({ kind: "skill", title: "Skill" });
        expect(result.pages.find((page) => page.path === "packages/ui/CHANGELOG.md")).toMatchObject({ kind: "changelog" });
        expect(result.pages.find((page) => page.path === "docs/reviews/2026-09-20-abc123.md")).toMatchObject({ kind: "review" });
        expect(result.pages.find((page) => page.path === "docs/decisions/0001-first.md")).toMatchObject({ kind: "decision" });
        expect(result.pages.find((page) => page.path === "docs/guides/no-heading.md")).toMatchObject({ kind: "doc", title: "docs/guides/no-heading.md", words: 2 });
        expect(result.pages.find((page) => page.path === "docs/README.md")).toMatchObject({ kind: "doc" });
        expect(result.pages).toHaveLength(files.length);
    });

    it("counts missing relative targets while excluding external, anchor, mailto, placeholder and existing-directory links", async () => {
        addFile("docs/source.md", [
            "# Source",
            "[valid](./target.md)",
            "[extensionless](./target)",
            "[missing](./gone.md)",
            "[external](https://example.test)",
            "[anchor](#section)",
            "[mail](mailto:docs@example.test)",
            "[placeholder](<file>.md)",
            "[directory](../packages/ui)",
        ].join("\n"));
        addFile("docs/target.md", "# Target\n");
        addFile("packages/ui/README.md", "# UI\n");
        addFile("packages/ui", "");
        state.paths = ["docs/source.md"];

        const result = await collectDocs("now");
        const page = result.pages[0];

        expect(page?.brokenLinks).toEqual([{ href: "./gone.md", resolved: "docs/gone.md" }]);
        expect(result.brokenLinkCount).toBe(1);
    });

    it("parses decision metadata only for numbered decision reports", async () => {
        addFile("docs/decisions/0002-superseded.md", frontmatter("issue: 2\nstatus: implemented\ndecision: superseded\nsupersededBy: 0003-new.md"));
        addFile("docs/decisions/README.md", frontmatter("status: implemented\ndecision: accepted"));
        state.paths = ["docs/decisions/0002-superseded.md", "docs/decisions/README.md"];

        const result = await collectDocs("now");

        expect(result.pages.find((page) => page.path.includes("0002"))).toMatchObject({
            decisionStatus: "implemented",
            decisionOutcome: "superseded",
            decisionSupersededBy: "0003-new.md",
        });
        expect(result.pages.find((page) => page.path.endsWith("decisions/README.md"))).toMatchObject({
            decisionStatus: null,
            decisionOutcome: null,
            decisionSupersededBy: null,
        });
    });

    it("parses an audit's scope and findings, and leaves every other page's audit null", async () => {
        addFile("docs/audits/2026-09-25-portal.md", `${frontmatter("scope: \"@monorepo/developer-portal\"\ncommit: 61b6f7f")}\n## Bugs\n\n| ID | Where | Status |\n| --- | --- | --- |\n| B1 | x.ts | fixed #3 |\n`);
        addFile("docs/audits/README.md", frontmatter("scope: nothing"));
        state.paths = ["docs/audits/2026-09-25-portal.md", "docs/audits/README.md"];

        const result = await collectDocs("now");

        expect(result.pages.find((page) => page.path.includes("2026"))).toMatchObject({
            kind: "audit",
            audit: {
                scope: "@monorepo/developer-portal",
                commit: "61b6f7f",
                findings: [{ id: "B1", category: "Bugs", status: "fixed", ref: "#3" }],
            },
        });
        expect(result.pages.find((page) => page.path.endsWith("audits/README.md"))?.audit).toBeNull();
    });
});
