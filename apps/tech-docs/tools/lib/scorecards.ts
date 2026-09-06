import type { ScoreRow } from "../../shared/types.ts";

/**
 * The dashboard's scorecards page parses `docs/reviews/*.md` rather than recomputing anything: every
 * number it shows is copied out of the `## 🧮 Scores` table `repo-review` already wrote. That only
 * works because the table has one shape across every review — these seven cards, in this order, each
 * scored `n/5` — which is why `compareScorecardShape` in `invariants.ts` exists to catch the day one
 * review's table stops matching it.
 */
export const SCORE_CARDS = [
    "🧱 Architecture",
    "🧩 Implementation",
    "🧪 Testing",
    "⚙️ Tooling & DX",
    "📚 Documentation",
    "🤖 Agent setup",
    "📋 Process & delivery",
] as const;

export interface ParsedScores {
    cards: ScoreRow[]
    total: number
    totalDelta: string
}

const SCORES_SECTION = /## 🧮 Scores\n([\s\S]*?)(?:\n## |\n*$)/;

function cellsOf(row: string): string[] {
    return row.split("|").slice(1, -1).map((cell) => cell.trim());
}

/**
 * Best-effort on purpose: a row that doesn't match `n/5` is skipped rather than thrown on, because a
 * page showing six cards out of seven beats a page showing none. `scorecardShapeProblems` is what
 * turns a skipped or reordered row into something a person sees, instead of a silent gap.
 */
export function parseScoresTable(markdown: string): ParsedScores | null {
    const section = SCORES_SECTION.exec(markdown)?.[1] ?? "";

    // The separator row (`| --- | --- | --- | --- |`) is filtered out the same way the header row
    // gets skipped below — neither cell shape it leaves behind matches a card row or the total row.
    const rows = section
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("|") && !line.includes("---"));

    const cards: ScoreRow[] = [];
    let total: number | null = null;
    let totalDelta = "";

    for (const row of rows) {
        const [card, scoreCell, delta = "", verdict = ""] = cellsOf(row);

        if (card === "**Total**") {
            const match = /^\*\*([\d.]+)\/5\*\*$/.exec(scoreCell ?? "");

            total = match ? Number.parseFloat(match[1] ?? "") : null;
            totalDelta = delta;
            continue;
        }

        const match = /^(\d)\/5$/.exec(scoreCell ?? "");

        if (card && match) cards.push({ card, score: Number.parseInt(match[1] ?? "", 10), delta, verdict });
    }

    return total === null ? null : { cards, total, totalDelta };
}

/**
 * Names what's wrong rather than just a boolean, because the finding this feeds
 * (`compareScorecardShape`) has to tell someone which card to fix.
 */
export function scorecardShapeProblems(parsed: ParsedScores | null): string[] {
    if (!parsed) return ["no parseable '## 🧮 Scores' table with a Total row"];

    const names = parsed.cards.map((row) => row.card);
    const missing = SCORE_CARDS.filter((name) => !names.includes(name));
    const extra = names.filter((name) => !(SCORE_CARDS as readonly string[]).includes(name));
    const problems: string[] = [];

    if (missing.length > 0) problems.push(`missing card row(s): ${missing.join(", ")}`);
    if (extra.length > 0) problems.push(`unrecognised card row(s): ${extra.join(", ")}`);

    if (missing.length === 0 && extra.length === 0 && !SCORE_CARDS.every((name, index) => names[index] === name)) {
        problems.push("card rows are out of SCORECARDS.md's order");
    }

    return problems;
}
