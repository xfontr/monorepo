import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { decisionProblems } from "../lib/decisions.ts";
import { collectDocs } from "../collect/docs.ts";
import { collectGraph } from "../collect/graph.ts";
import { collectInvariants } from "../lib/invariants.ts";
import { WORKSPACE_ROOT } from "../lib/paths.ts";

const DECISIONS_DIR = "docs/decisions";

/** `README.md` and `TEMPLATE.md` are the furniture around the reports, and neither is one. */
async function readDecisionReports(): Promise<{ file: string, source: string }[]> {
    const dir = resolve(WORKSPACE_ROOT, DECISIONS_DIR);
    const entries = (await readdir(dir).catch(() => [] as string[]))
        .filter((entry) => entry.endsWith(".md") && entry !== "README.md" && entry !== "TEMPLATE.md")
        .sort();

    return Promise.all(entries.map(async (file) => ({
        file,
        source: await readFile(resolve(dir, file), "utf8"),
    })));
}

/**
 * The CI-facing half of `nx collect`: only the checks whose output is a pass/fail gate rather than a
 * dashboard read, so a broken link, a drifted invariant or a malformed decision report fails the
 * build instead of only showing up on a page nobody's looking at. Shells out to `nx graph`, never
 * `gh` — no token needed in the job env.
 */
async function main(): Promise<void> {
    const generatedAt = new Date().toISOString();
    const graph = await collectGraph(generatedAt);
    const projectRoots = graph.projects.map((project) => project.root);

    const [docs, invariantFindings, reports] = await Promise.all([
        collectDocs(projectRoots, generatedAt),
        collectInvariants(projectRoots),
        readDecisionReports(),
    ]);

    const decisions = decisionProblems(reports);

    if (docs.brokenLinkCount === 0 && invariantFindings.length === 0 && decisions.length === 0) {
        console.log(`✓ check-docs — ${docs.pages.length} pages, ${reports.length} decisions, no findings`);

        return;
    }

    if (docs.brokenLinkCount > 0) {
        console.error(`✗ ${docs.brokenLinkCount} broken link(s):`);

        for (const page of docs.pages) {
            for (const link of page.brokenLinks) {
                console.error(`  ${page.path}: ${link.href}`);
            }
        }
    }

    if (invariantFindings.length > 0) {
        console.error(`✗ ${invariantFindings.length} invariant finding(s):`);

        for (const finding of invariantFindings) {
            console.error(`  ${finding.title} — ${finding.detail} (${finding.evidence.join(", ")})`);
        }
    }

    if (decisions.length > 0) {
        console.error(`✗ ${decisions.length} decision report problem(s):`);

        for (const problem of decisions) {
            console.error(`  ${DECISIONS_DIR}/${problem.file}: ${problem.message}`);
        }
    }

    process.exitCode = 1;
}

await main();
