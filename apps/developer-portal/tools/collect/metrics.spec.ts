import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CoverageArtifact, ProjectNode } from "../../shared/types.ts";
import { collectMetrics } from "./metrics.ts";

const state = vi.hoisted(() => ({
    subjects: ["feat: add feature", "fix: [42] repair bug", "bad subject", "docs: Update docs"],
    failHistoryFor: null as string | null,
    emptySubjects: false,
}));
const fs = vi.hoisted(() => ({ readFile: vi.fn() }));
const run = vi.hoisted(() => ({ git: vi.fn() }));
const invariants = vi.hoisted(() => ({ collectInvariants: vi.fn() }));

vi.mock("node:fs/promises", () => fs);
vi.mock("../lib/run.ts", () => ({
    git: run.git,
    tryRun: async <T>(task: () => Promise<T>) => {
        try {
            return { ok: true as const, value: await task() };
        }
        catch (cause) {
            return { ok: false as const, error: cause instanceof Error ? cause.message : String(cause) };
        }
    },
}));
vi.mock("../lib/invariants.ts", () => invariants);

const projects: ProjectNode[] = [
    { name: "@monorepo/ui", root: "packages/ui", tags: [], dependsOn: [], dependedOnBy: [] },
    { name: "@monorepo/i18n", root: "packages/i18n", tags: [], dependsOn: [], dependedOnBy: [] },
];

const coverage: CoverageArtifact = {
    generatedAt: "coverage",
    totals: null,
    report: false,
    projects: [
        { name: "@monorepo/ui", root: "packages/ui", collected: true, files: 2, lines: { total: 8, covered: 7, pct: 87.5 } },
        { name: "@monorepo/i18n", root: "packages/i18n", collected: false, files: 0 },
    ],
};

beforeEach(() => {
    vi.clearAllMocks();
    state.failHistoryFor = null;
    state.emptySubjects = false;
    invariants.collectInvariants.mockResolvedValue([{ id: "tags", title: "Tags", detail: "drift", evidence: ["README"] }]);
    fs.readFile.mockImplementation(async (path: string) => path.endsWith("packages/ui/package.json")
        ? JSON.stringify({ version: "3.2.1" })
        : "{}\n");
    run.git.mockImplementation(async (args: string[]) => {
        const root = args.at(-1) ?? "";

        if (state.failHistoryFor === root && (args[0] === "rev-list" || args[0] === "log") && args.includes("--")) {
            throw new Error(`history failed for ${root}`);
        }

        if (args[0] === "ls-files") {
            return root === "packages/ui"
                ? "packages/ui/src/a.ts\npackages/ui/src/a.spec.ts\npackages/ui/CHANGELOG.md\npackages/ui/package.json\n"
                : "packages/i18n/src/b.spec.ts\n";
        }

        if (args[0] === "rev-list" && args[1] === "--count" && args[2] === "HEAD") return "10\n";
        if (args[0] === "log" && args[1] === "--since=90 days ago") return "one\ntwo\n";
        if (args[0] === "tag") return args[2] === "@monorepo/ui@*" ? "@monorepo/ui@3.0.0\n" : "";
        if (args[0] === "rev-list" && typeof args[2] === "string" && args[2].includes("@monorepo/ui@")) return "3\n";
        if (args[0] === "log" && args.includes("--no-merges")) return state.emptySubjects ? "" : `${state.subjects.join("\n")}\n`;
        if (args[0] === "log" && args.includes("--grep=^chore(release)")) return "release-sha\n";
        if (args[0] === "rev-list" && typeof args[2] === "string" && args[2].startsWith("release-sha")) return "4\n";
        if (args[0] === "rev-parse" && args[1] === "--short") return "abc123\n";
        if (args[0] === "rev-parse" && args[1] === "--abbrev-ref") return "feature/metrics\n";

        return "";
    });
});

describe("collectMetrics", () => {
    it("joins tracked spec counts and coverage by project name, then preserves release and invariant findings", async () => {
        const result = await collectMetrics(projects, coverage, "now");
        const ui = result.projects[0];
        const i18n = result.projects[1];

        expect(ui).toEqual({
            name: "@monorepo/ui",
            root: "packages/ui",
            specs: 1,
            commits: 10,
            commitsPerWeek: 0.2,
            coverageLinesPct: 87.5,
            unreleasedCommits: 3,
            currentVersion: "3.2.1",
            hasChangelog: true,
        });
        expect(i18n).toMatchObject({ specs: 1, coverageLinesPct: null, currentVersion: null, hasChangelog: false, unreleasedCommits: null });
        expect(result).toMatchObject({ generatedAt: "now", commit: "abc123", branch: "feature/metrics", commitsSinceLastRelease: 4, conventionalCommitRate: 50 });
        expect(result.invariantFindings).toEqual([{ id: "tags", title: "Tags", detail: "drift", evidence: ["README"] }]);
    });

    it("keeps a project when its history commands fail, with only history-derived fields null", async () => {
        state.failHistoryFor = "packages/ui";

        const result = await collectMetrics(projects, coverage, "now");
        const ui = result.projects[0];

        expect(ui).toMatchObject({
            name: "@monorepo/ui",
            specs: 1,
            commits: null,
            commitsPerWeek: null,
            unreleasedCommits: null,
            currentVersion: "3.2.1",
            hasChangelog: true,
        });
        expect(result.projects).toHaveLength(2);
    });

    it("returns null for the conventional rate when the commit history is empty", async () => {
        state.emptySubjects = true;

        await expect(collectMetrics(projects, coverage, "now")).resolves.toMatchObject({ conventionalCommitRate: null });
    });
});
