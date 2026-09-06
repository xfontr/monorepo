import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { CoverageArtifact, MetricsArtifact, ProjectMetrics, ProjectNode } from "../../shared/types.ts";
import { collectInvariants } from "../lib/invariants.ts";
import { WORKSPACE_ROOT } from "../lib/paths.ts";
import { git, runAllowFailure, tryRun } from "../lib/run.ts";

const SPEC_SUFFIX = ".spec.ts";
const SOURCE_PATTERN = /\.(ts|vue)$/;

// commitlint's preset wants a lower-case type and a subject that is *not* sentence-case, and the
// `commit-msg` hook then rewrites the subject to carry the branch's issue number — so a conforming
// subject here reads `feat: [50] add thing`. The optional group is what keeps a commit made on a
// branch with no number in it from counting as a miss.
const CONVENTIONAL = /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([^)]+\))?!?: (\[\d+\] )?[a-z0-9]/;

async function filesIn(root: string): Promise<string[]> {
    const stdout = await git(["ls-files", "--", root]);

    return stdout.split("\n").filter(Boolean);
}

/** Latest `<project>@<version>` tag. Tags under an older scope never match the glob. */
async function latestTag(name: string): Promise<string | null> {
    const stdout = await git(["tag", "--list", `${name}@*`, "--sort=-v:refname"]);
    const [newest] = stdout.split("\n").filter(Boolean);

    return newest ?? null;
}

async function unreleasedCommits(name: string, root: string): Promise<number | null> {
    const tag = await latestTag(name);

    if (!tag) return null;

    const stdout = await git(["rev-list", "--count", `${tag}..HEAD`, "--", root]);

    return Number.parseInt(stdout.trim(), 10);
}

async function versionOf(root: string): Promise<string | null> {
    try {
        const raw = await readFile(resolve(WORKSPACE_ROOT, root, "package.json"), "utf8");

        return (JSON.parse(raw) as { version?: string }).version ?? null;
    }
    catch {
        return null;
    }
}

async function unreleasedFor(name: string, root: string): Promise<number | null> {
    const result = await tryRun(() => unreleasedCommits(name, root));

    return result.ok ? result.value : null;
}

/**
 * `nx release` commits are all literally `chore(release): Publish`, which makes them exact release
 * boundaries in the log. Counting from the newest one answers "how much is waiting to ship".
 */
async function commitsSinceRelease(): Promise<number | null> {
    const stdout = await git(["log", "--format=%H", "--grep=^chore(release)", "-1"]);
    const [sha] = stdout.split("\n").filter(Boolean);

    if (!sha) return null;

    const counted = await git(["rev-list", "--count", `${sha}..HEAD`]);

    return Number.parseInt(counted.trim(), 10);
}

/** Runs each project's own ESLint config; the rule only reports where boundaries are enforced. */
async function boundaryViolations(projects: ProjectNode[]): Promise<number> {
    let violations = 0;

    for (const project of projects) {
        const stdout = await runAllowFailure(
            "pnpm",
            ["exec", "eslint", ".", "--format", "json"],
            resolve(WORKSPACE_ROOT, project.root),
        );

        const results = JSON.parse(stdout) as { messages: { ruleId: string | null }[] }[];

        violations += results
            .flatMap((result) => result.messages)
            .filter((message) => message.ruleId === "@nx/enforce-module-boundaries")
            .length;
    }

    return violations;
}

export async function collectMetrics(
    projects: ProjectNode[],
    coverage: CoverageArtifact,
    generatedAt: string,
): Promise<MetricsArtifact> {
    const measured: ProjectMetrics[] = [];

    for (const project of projects) {
        const files = await filesIn(project.root);
        const specs = files.filter((file) => file.endsWith(SPEC_SUFFIX));
        const sources = files.filter((file) => SOURCE_PATTERN.test(file) && !file.endsWith(SPEC_SUFFIX));
        const projectCoverage = coverage.projects.find((entry) => entry.name === project.name);

        measured.push({
            name: project.name,
            root: project.root,
            specs: specs.length,
            sources: sources.length,
            specRatio: sources.length === 0 ? 0 : Math.round((specs.length / sources.length) * 100) / 100,
            coverageLinesPct: projectCoverage?.collected ? (projectCoverage.lines?.pct ?? null) : null,
            unreleasedCommits: await unreleasedFor(project.name, project.root),
            currentVersion: await versionOf(project.root),
            hasReadme: files.some((file) => file.endsWith("README.md")),
            hasClaudeMd: files.some((file) => file.endsWith("CLAUDE.md")),
            hasChangelog: files.some((file) => file.endsWith("CHANGELOG.md")),
        });
    }

    const subjects = (await git(["log", "--no-merges", "--format=%s", "-100"])).split("\n").filter(Boolean);
    const conforming = subjects.filter((subject) => CONVENTIONAL.test(subject));

    const release = await tryRun(commitsSinceRelease);
    const boundaries = await tryRun(() => boundaryViolations(projects));
    const [commit, branch] = await Promise.all([
        git(["rev-parse", "--short", "HEAD"]).then((out) => out.trim()),
        git(["rev-parse", "--abbrev-ref", "HEAD"]).then((out) => out.trim()),
    ]);

    return {
        generatedAt,
        commit,
        branch,
        projects: measured,
        boundaryViolations: boundaries.ok ? boundaries.value : null,
        invariantFindings: await collectInvariants(projects.map((project) => project.root)),
        conventionalCommitRate: subjects.length === 0
            ? null
            : Math.round((conforming.length / subjects.length) * 100),
        commitsSinceLastRelease: release.ok ? release.value : null,
    };
}
