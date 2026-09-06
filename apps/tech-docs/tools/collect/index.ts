import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ArtifactStatus, Manifest } from "../../shared/types.ts";
import { collectCoverage } from "./coverage.ts";
import { collectDocs } from "./docs.ts";
import { collectGraph } from "./graph.ts";
import { collectMetrics } from "./metrics.ts";
import { collectScorecards } from "./scorecards.ts";
import { SCHEMA_VERSION, SNAPSHOT_DIR } from "../lib/paths.ts";
import { git, tryRun } from "../lib/run.ts";

async function write(name: string, value: unknown): Promise<void> {
    await writeFile(resolve(SNAPSHOT_DIR, `${name}.json`), `${JSON.stringify(value, null, 4)}\n`, "utf8");
}

async function main(): Promise<void> {
    const generatedAt = new Date().toISOString();
    const artifacts: Record<string, ArtifactStatus> = {};

    await mkdir(SNAPSHOT_DIR, { recursive: true });

    const [commit, branch] = await Promise.all([
        git(["rev-parse", "--short", "HEAD"]).then((out) => out.trim()),
        git(["rev-parse", "--abbrev-ref", "HEAD"]).then((out) => out.trim()),
    ]);

    // The graph comes first because coverage and metrics are both keyed off its project list. If it
    // fails there is nothing to iterate, so that one failure is fatal where the others are not.
    const graph = await tryRun(() => collectGraph(generatedAt));

    if (!graph.ok) {
        artifacts.projects = { generatedAt, ok: false, error: graph.error };
        await write("manifest", { schemaVersion: SCHEMA_VERSION, generatedAt, commit, branch, artifacts } satisfies Manifest);

        console.error(`✗ projects — ${graph.error}`);
        process.exitCode = 1;

        return;
    }

    await write("projects", graph.value);
    artifacts.projects = { generatedAt, ok: true };
    console.log(`✓ projects — ${graph.value.projects.length} projects, ${graph.value.edges.length} edges`);

    const coverage = await tryRun(() => collectCoverage(graph.value.projects, generatedAt));

    if (coverage.ok) {
        await write("coverage", coverage.value);
        artifacts.coverage = { generatedAt, ok: true };

        const collected = coverage.value.projects.filter((project) => project.collected).length;
        console.log(`✓ coverage — ${collected}/${coverage.value.projects.length} projects collected`);
    }
    else {
        artifacts.coverage = { generatedAt, ok: false, error: coverage.error };
        console.error(`✗ coverage — ${coverage.error}`);
    }

    const metrics = await tryRun(() => collectMetrics(
        graph.value.projects,
        coverage.ok ? coverage.value : { generatedAt, totals: null, report: false, projects: [] },
        generatedAt,
    ));

    if (metrics.ok) {
        await write("metrics", metrics.value);
        artifacts.metrics = { generatedAt, ok: true };
        console.log(`✓ metrics — ${metrics.value.invariantFindings.length} invariant findings`);
    }
    else {
        artifacts.metrics = { generatedAt, ok: false, error: metrics.error };
        console.error(`✗ metrics — ${metrics.error}`);
    }

    const docs = await tryRun(() => collectDocs(graph.value.projects.map((project) => project.root), generatedAt));

    if (docs.ok) {
        await write("docs", docs.value);
        artifacts.docs = { generatedAt, ok: true };
        console.log(`✓ docs — ${docs.value.pages.length} pages, ${docs.value.brokenLinkCount} broken links`);
    }
    else {
        artifacts.docs = { generatedAt, ok: false, error: docs.error };
        console.error(`✗ docs — ${docs.error}`);
    }

    const scorecards = await tryRun(() => collectScorecards(generatedAt));

    if (scorecards.ok) {
        await write("scorecards", scorecards.value);
        artifacts.scorecards = { generatedAt, ok: true };

        const unparsed = scorecards.value.reviews.filter((review) => review.parseError).length;
        console.log(`✓ scorecards — ${scorecards.value.reviews.length} reviews, ${unparsed} unparsed`);
    }
    else {
        artifacts.scorecards = { generatedAt, ok: false, error: scorecards.error };
        console.error(`✗ scorecards — ${scorecards.error}`);
    }

    // Written last so its presence means the run finished, however many collectors failed.
    await write("manifest", { schemaVersion: SCHEMA_VERSION, generatedAt, commit, branch, artifacts } satisfies Manifest);

    console.log(`\nSnapshot written to ${SNAPSHOT_DIR}`);
}

await main();
