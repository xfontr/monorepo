import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { InvariantFinding } from "../../shared/types.ts";
import { WORKSPACE_ROOT } from "./paths.ts";
import { parseScoresTable, scorecardShapeProblems } from "./scorecards.ts";

const BOUNDARIES_PATH = "packages/configs/src/eslint/lib/boundaries.ts";
const README_PATH = "README.md";
const REVIEWS_DIR = "docs/reviews";
const REVIEWS_README_PATH = `${REVIEWS_DIR}/README.md`;

/**
 * These are the same cross-file rules `.claude/hooks/check-invariants.sh` enforces on edit. They are
 * duplicated rather than shelled out to, because that hook reads a Claude tool payload on stdin and
 * is not usable as a CLI — and because a pure function can be pinned by a spec, which the shell
 * script never could. The two copies stay honest via `invariants.spec.ts`.
 *
 * The hook only fires while an agent is editing. These run over the whole tree on every collect, so
 * drift introduced by hand shows up on the dashboard rather than waiting for the next edit.
 */

/** Every `sourceTag:` in the enforced copy of the tag table. */
export function tagsInBoundaries(source: string): string[] {
    return [...source.matchAll(/sourceTag:\s*"([^"]+)"/g)].map((match) => match[1] ?? "");
}

/** Every tag named in the leftmost column of the README's tag table. */
export function tagsInReadmeTable(readme: string): string[] {
    return readme
        .split("\n")
        .filter((line) => line.startsWith("| `type:"))
        .map((line) => /`(type:[^`]+)`/.exec(line)?.[1] ?? "")
        .filter(Boolean);
}

/** Project directories listed in the README's workspace-layout code block. */
export function projectsInLayoutBlock(readme: string): string[] {
    const block = /## 🗂 Workspace layout\s*```([\s\S]*?)```/.exec(readme)?.[1] ?? "";

    return [...block.matchAll(/^\s{4}([\w-]+)\//gm)].map((match) => match[1] ?? "");
}

export function compareTagTables(boundaries: string, readme: string): InvariantFinding[] {
    const enforced = tagsInBoundaries(boundaries);
    const documented = tagsInReadmeTable(readme);

    const undocumented = enforced.filter((tag) => !documented.includes(tag));
    const unenforced = documented.filter((tag) => !enforced.includes(tag));

    const findings: InvariantFinding[] = [];

    if (undocumented.length > 0) {
        findings.push({
            id: "tag-table-undocumented",
            title: "A tag is enforced but not documented",
            detail: `${undocumented.join(", ")} appears in boundaries.ts with no row in the README tag table.`,
            evidence: [BOUNDARIES_PATH, README_PATH],
        });
    }

    if (unenforced.length > 0) {
        findings.push({
            id: "tag-table-unenforced",
            title: "A tag is documented but not enforced",
            detail: `${unenforced.join(", ")} has a README row but no depConstraints entry.`,
            evidence: [README_PATH, BOUNDARIES_PATH],
        });
    }

    return findings;
}

export function compareLayoutBlock(readme: string, projectRoots: string[]): InvariantFinding[] {
    const listed = projectsInLayoutBlock(readme);
    const missing = projectRoots
        .map((root) => root.split("/").at(-1) ?? "")
        .filter((directory) => directory && !listed.includes(directory));

    if (missing.length === 0) return [];

    return [{
        id: "layout-block-incomplete",
        title: "A project is missing from the workspace layout",
        detail: `${missing.join(", ")} exists in the workspace but is not in the README layout block.`,
        evidence: [README_PATH],
    }];
}

/**
 * A review whose row never lands in the history table is a review nobody will ever compare against,
 * which is the one thing `docs/reviews/README.md` exists to make possible.
 */
export function compareReviewHistory(historyReadme: string, reviewFiles: string[]): InvariantFinding[] {
    const missing = reviewFiles.filter((file) => !historyReadme.includes(file));

    if (missing.length === 0) return [];

    return [{
        id: "review-history-incomplete",
        title: "A review is missing from the history table",
        detail: `${missing.join(", ")} exists under ${REVIEWS_DIR}/ with no row in the history table, so its scores compare against nothing.`,
        evidence: [REVIEWS_README_PATH],
    }];
}

/** Dated reviews only — `README.md`, `TEMPLATE.md` and `SCORECARDS.md` are the furniture around them. */
export async function listReviewFiles(): Promise<string[]> {
    const entries = await readdir(resolve(WORKSPACE_ROOT, REVIEWS_DIR)).catch(() => [] as string[]);

    return entries.filter((entry) => /^\d{4}-\d{2}-\d{2}-.+\.md$/.test(entry)).sort();
}

/**
 * The dashboard's scorecards page parses this same table (`tools/lib/scorecards.ts`) to show the
 * cards without redrawing them, and that only stays honest if every review keeps the shape
 * `TEMPLATE.md` defines. `repo-review`'s own instructions ask for this; this is what notices when a
 * review didn't follow them.
 */
export function compareScorecardShape(file: string, markdown: string): InvariantFinding[] {
    const problems = scorecardShapeProblems(parseScoresTable(markdown));

    if (problems.length === 0) return [];

    return [{
        id: "scorecard-shape-mismatch",
        title: "A review's Scores table doesn't match the template",
        detail: `${file}: ${problems.join("; ")}.`,
        evidence: [`${REVIEWS_DIR}/${file}`, `${REVIEWS_DIR}/TEMPLATE.md`],
    }];
}

export async function collectInvariants(projectRoots: string[] = []): Promise<InvariantFinding[]> {
    const [boundaries, readme, history, reviewFiles] = await Promise.all([
        readFile(resolve(WORKSPACE_ROOT, BOUNDARIES_PATH), "utf8"),
        readFile(resolve(WORKSPACE_ROOT, README_PATH), "utf8"),
        readFile(resolve(WORKSPACE_ROOT, REVIEWS_README_PATH), "utf8").catch(() => ""),
        listReviewFiles(),
    ]);

    const reviewBodies = await Promise.all(
        reviewFiles.map((file) => readFile(resolve(WORKSPACE_ROOT, REVIEWS_DIR, file), "utf8").catch(() => "")),
    );

    return [
        ...compareTagTables(boundaries, readme),
        ...compareLayoutBlock(readme, projectRoots),
        ...compareReviewHistory(history, reviewFiles),
        ...reviewFiles.flatMap((file, index) => compareScorecardShape(file, reviewBodies[index] ?? "")),
    ];
}
