import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ReviewScorecard, ScorecardsArtifact } from "../../shared/types.ts";
import { listReviewFiles } from "../lib/invariants.ts";
import { WORKSPACE_ROOT } from "../lib/paths.ts";
import { parseScoresTable, scorecardShapeProblems } from "../lib/scorecards.ts";

const REVIEWS_DIR = "docs/reviews";

/** `YYYY-MM-DD-<short sha>.md` — `listReviewFiles` already filters to this shape. */
const FILENAME = /^(\d{4}-\d{2}-\d{2})-([0-9a-f]+)\.md$/;

/**
 * Reads what `repo-review` already wrote rather than re-scoring anything: `total` and every card
 * score below are copied verbatim out of each review's `## 🧮 Scores` table. A review whose table
 * doesn't match `SCORECARDS.md`'s shape still gets an entry — `parseError` names why, and `cards`
 * holds whatever rows were still readable, the same "absent is its own state" the coverage collector
 * uses for a project with nothing collected.
 */
export async function collectScorecards(generatedAt: string): Promise<ScorecardsArtifact> {
    const files = await listReviewFiles();
    const reviews: ReviewScorecard[] = [];

    for (const file of files) {
        const match = FILENAME.exec(file);

        if (!match) continue;

        const [, date, commit] = match;
        const markdown = await readFile(resolve(WORKSPACE_ROOT, REVIEWS_DIR, file), "utf8");
        const parsed = parseScoresTable(markdown);
        const problems = scorecardShapeProblems(parsed);

        reviews.push({
            path: `${REVIEWS_DIR}/${file}`,
            date: date ?? "",
            commit: commit ?? "",
            cards: parsed?.cards ?? [],
            total: parsed?.total ?? 0,
            totalDelta: parsed?.totalDelta ?? "",
            parseError: problems.length > 0 ? problems.join("; ") : null,
        });
    }

    // `listReviewFiles` sorts ascending by date; the page wants the newest one first.
    reviews.reverse();

    return { generatedAt, reviews };
}
