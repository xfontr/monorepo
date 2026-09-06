import { access, cp, mkdir, readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import type { CoverageArtifact, CoverageMetric, ProjectCoverage, ProjectNode } from "../../shared/types.ts";
import { COVERAGE_DIR, MERGED_COVERAGE_DIR, WORKSPACE_ROOT } from "../lib/paths.ts";

interface RawSummary {
    total: Record<string, CoverageMetric>
    [file: string]: unknown
}

type SummaryReader = (root: string) => Promise<RawSummary | null>;

type Metric = "lines" | "statements" | "functions" | "branches";

/** Reads one project's summary, or null when the project has never had coverage collected. */
export const readSummary: SummaryReader = async (root) => {
    try {
        const path = resolve(WORKSPACE_ROOT, root, "coverage/coverage-summary.json");

        return JSON.parse(await readFile(path, "utf8")) as RawSummary;
    }
    catch {
        return null;
    }
};

/**
 * Copies in the report `pnpm test:coverage` already merges rather than re-rendering the numbers or
 * iframing seven per-project reports. Istanbul's output is the best per-line coverage view there is,
 * and a table of percentages cannot tell you *which* branch went uncovered — so the app embeds the
 * real thing and only summarises on top of it.
 */
async function copyMergedReport(): Promise<boolean> {
    try {
        await access(resolve(MERGED_COVERAGE_DIR, "index.html"));
    }
    catch {
        return false;
    }

    // Replaced wholesale: a stale file from a run when a project had more sources would otherwise
    // linger in the served report and look current.
    await rm(COVERAGE_DIR, { recursive: true, force: true });
    await mkdir(COVERAGE_DIR, { recursive: true });
    await cp(MERGED_COVERAGE_DIR, COVERAGE_DIR, { recursive: true });

    return true;
}

function weighted(projects: ProjectCoverage[], metric: Metric): number {
    const collected = projects.filter((project) => project[metric]);

    const total = collected.reduce((sum, project) => sum + (project[metric]?.total ?? 0), 0);
    const covered = collected.reduce((sum, project) => sum + (project[metric]?.covered ?? 0), 0);

    return total === 0 ? 0 : Math.round((covered / total) * 10_000) / 100;
}

export async function collectCoverage(
    projects: ProjectNode[],
    generatedAt: string,
    read: SummaryReader = readSummary,
): Promise<CoverageArtifact> {
    const measured: ProjectCoverage[] = [];

    for (const project of projects) {
        const summary = await read(project.root);

        if (!summary) {
            // Absent is its own state. Reporting it as 0% would drag the workspace number down for
            // a package that simply has no test target; reporting 100% would be a lie.
            measured.push({ name: project.name, root: project.root, collected: false, files: 0 });
            continue;
        }

        measured.push({
            name: project.name,
            root: project.root,
            collected: true,
            files: Object.keys(summary).filter((key) => key !== "total").length,
            lines: summary.total.lines,
            statements: summary.total.statements,
            functions: summary.total.functions,
            branches: summary.total.branches,
        });
    }

    const anyCollected = measured.some((project) => project.collected);

    return {
        generatedAt,
        report: await copyMergedReport(),
        totals: anyCollected
            ? {
                lines: weighted(measured, "lines"),
                statements: weighted(measured, "statements"),
                functions: weighted(measured, "functions"),
                branches: weighted(measured, "branches"),
            }
            : null,
        projects: measured,
    };
}
