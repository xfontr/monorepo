import { readFile } from "node:fs/promises";
import { matchesGlob, resolve } from "node:path";
import type { CoverageArtifact, MetricsArtifact, ProjectMetrics, ProjectNode } from "../../shared/types.ts";
import { collectInvariants } from "../lib/invariants.ts";
import { WORKSPACE_ROOT } from "../lib/paths.ts";
import { git, tryRun } from "../lib/run.ts";

const SPEC_SUFFIX = ".spec.ts";

// The `commit-msg` hook rewrites a conforming subject to carry the branch's issue number — `feat:
// [50] add thing` — so the optional group here keeps a numberless-branch commit from counting as a miss.
const CONVENTIONAL = /^(?:build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(?:\([^)]+\))?!?: (?:\[\d+\] )?[a-z0-9]/;

async function filesIn(root: string): Promise<string[]> {
    const stdout = await git(["ls-files", "--", root]);

    return stdout.split("\n").filter(Boolean);
}

/** Latest `<project>@<version>` tag. Tags under an older scope never match the glob. */
async function latestTag(name: string): Promise<string | null> {
    const stdout = await git(["tag", "--list", `${name}@*`, "--sort=-v:refname"]);
    const newest = stdout.split("\n").find(Boolean);

    return newest ?? null;
}

/** `nx.json`'s `release.projects`: roots or names that `nx release` versions, so they owe a first release. */
async function releaseProjects(): Promise<string[]> {
    try {
        const raw = await readFile(resolve(WORKSPACE_ROOT, "nx.json"), "utf8");
        const projects = (JSON.parse(raw) as { release?: { projects?: string | string[] } }).release?.projects ?? [];

        return typeof projects === "string" ? [projects] : projects;
    }
    catch {
        return [];
    }
}

async function unreleasedCommits(name: string, root: string, released: boolean): Promise<number | null> {
    const tag = await latestTag(name);

    if (!tag && !released) return null;

    const stdout = await git(["rev-list", "--count", tag ? `${tag}..HEAD` : "HEAD", "--", root]);

    return Number.parseInt(stdout.trim(), 10);
}

async function commitStats(root: string): Promise<{ commits: number, commitsLastTwoWeeks: number }> {
    const [counted, recent] = await Promise.all([
        git(["rev-list", "--count", "HEAD", "--", root]),
        git(["log", "--since=2 weeks ago", "--format=%H", "--", root]),
    ]);

    return {
        commits: Number.parseInt(counted.trim(), 10),
        commitsLastTwoWeeks: recent.split("\n").filter(Boolean).length,
    };
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

async function unreleasedFor(name: string, root: string, released: boolean): Promise<number | null> {
    const result = await tryRun(() => unreleasedCommits(name, root, released));

    return result.ok ? result.value : null;
}

/**
 * `nx release` commits are all literally `chore(release): Publish`, which makes them exact release
 * boundaries in the log. Counting from the newest one answers "how much is waiting to ship".
 */
async function commitsSinceRelease(): Promise<number | null> {
    const stdout = await git(["log", "--format=%H", "--grep=^chore(release)", "-1"]);
    const sha = stdout.split("\n").find(Boolean);

    if (!sha) return null;

    const counted = await git(["rev-list", "--count", `${sha}..HEAD`]);

    return Number.parseInt(counted.trim(), 10);
}

export async function collectMetrics(
    projects: ProjectNode[],
    coverage: CoverageArtifact,
    generatedAt: string,
): Promise<MetricsArtifact> {
    const measured: ProjectMetrics[] = [];
    const releasePatterns = await releaseProjects();

    for (const project of projects) {
        const files = await filesIn(project.root);
        const specs = files.filter((file) => file.endsWith(SPEC_SUFFIX));
        const projectCoverage = coverage.projects.find((entry) => entry.name === project.name);
        const history = await tryRun(() => commitStats(project.root));

        measured.push({
            name: project.name,
            root: project.root,
            specs: specs.length,
            commits: history.ok ? history.value.commits : null,
            commitsLastTwoWeeks: history.ok ? history.value.commitsLastTwoWeeks : null,
            coverageLinesPct: projectCoverage?.collected ? (projectCoverage.lines?.pct ?? null) : null,
            unreleasedCommits: await unreleasedFor(
                project.name,
                project.root,
                releasePatterns.some((pattern) => pattern === project.name || matchesGlob(project.root, pattern)),
            ),
            currentVersion: await versionOf(project.root),
            hasChangelog: files.some((file) => file.endsWith("CHANGELOG.md")),
        });
    }

    const subjects = (await git(["log", "--no-merges", "--format=%s", "-100"])).split("\n").filter(Boolean);
    const conforming = subjects.filter((subject) => CONVENTIONAL.test(subject));

    const release = await tryRun(commitsSinceRelease);
    const [commit, branch] = await Promise.all([
        git(["rev-parse", "--short", "HEAD"]).then((out) => out.trim()),
        git(["rev-parse", "--abbrev-ref", "HEAD"]).then((out) => out.trim()),
    ]);

    return {
        generatedAt,
        commit,
        branch,
        projects: measured,
        invariantFindings: await collectInvariants(projects.map((project) => project.root)),
        conventionalCommitRate: subjects.length === 0
            ? null
            : Math.round((conforming.length / subjects.length) * 100),
        commitsSinceLastRelease: release.ok ? release.value : null,
    };
}
