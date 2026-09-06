import { describe, expect, it } from "vitest";
import { parseScoresTable, scorecardShapeProblems } from "./scorecards.ts";

// A real review's "## 🧮 Scores" section, trimmed to the shape that matters here — the seven cards
// plus the Total row, in the order TEMPLATE.md lists them.
const SCORES = `
## 🧮 Scores

| Card | Score | Δ | Verdict |
| --- | --- | --- | --- |
| 🧱 Architecture | 5/5 | ↑1 | The core isolation invariant is now enforced by lint |
| 🧩 Implementation | 4/5 | = | Honest error paths, no type escapes |
| 🧪 Testing | 4/5 | = | Specs pin failures, not method names |
| ⚙️ Tooling & DX | 4/5 | ↑1 | Cache inputs are honest now |
| 📚 Documentation | 4/5 | ↑2 | Both contradictions gone |
| 🤖 Agent setup | 3/5 | = | Hooks are well scoped |
| 📋 Process & delivery | 4/5 | = | Branch, commit and issue trail enforced |
| **Total** | **4.1/5** | ↑0.5 | |

## 🃏 Cards
`;

describe("parseScoresTable", () => {
    it("reads every card row and the total, in the order they appear", () => {
        const parsed = parseScoresTable(SCORES);

        expect(parsed?.cards.map((row) => row.card)).toEqual([
            "🧱 Architecture",
            "🧩 Implementation",
            "🧪 Testing",
            "⚙️ Tooling & DX",
            "📚 Documentation",
            "🤖 Agent setup",
            "📋 Process & delivery",
        ]);
        expect(parsed?.cards[0]).toEqual({
            card: "🧱 Architecture",
            score: 5,
            delta: "↑1",
            verdict: "The core isolation invariant is now enforced by lint",
        });
        expect(parsed?.total).toBe(4.1);
        expect(parsed?.totalDelta).toBe("↑0.5");
    });

    it("returns null for a file with no Total row, rather than a half-filled result", () => {
        expect(parseScoresTable("## 🧮 Scores\n\n| Card | Score | Δ | Verdict |\n| --- | --- | --- | --- |\n")).toBeNull();
    });

    it("skips a row whose score isn't the n/5 shape instead of throwing", () => {
        const malformed = SCORES.replace("| 🧱 Architecture | 5/5 |", "| 🧱 Architecture | five |");
        const parsed = parseScoresTable(malformed);

        expect(parsed?.cards.map((row) => row.card)).not.toContain("🧱 Architecture");
        expect(parsed?.total).toBe(4.1);
    });
});

describe("scorecardShapeProblems", () => {
    it("finds nothing when the table has all seven cards in order", () => {
        expect(scorecardShapeProblems(parseScoresTable(SCORES))).toEqual([]);
    });

    it("names the missing card rather than just saying the table looks wrong", () => {
        const missingCard = SCORES.replace("| 🤖 Agent setup | 3/5 | = | Hooks are well scoped |\n", "");
        const problems = scorecardShapeProblems(parseScoresTable(missingCard));

        expect(problems.some((problem) => problem.includes("🤖 Agent setup"))).toBe(true);
    });

    it("names a renamed card as unrecognised, not silently as missing", () => {
        const renamed = SCORES.replace("🤖 Agent setup", "🤖 Agent config");
        const problems = scorecardShapeProblems(parseScoresTable(renamed));

        expect(problems.some((problem) => problem.includes("unrecognised") && problem.includes("🤖 Agent config"))).toBe(true);
        expect(problems.some((problem) => problem.includes("missing") && problem.includes("🤖 Agent setup"))).toBe(true);
    });

    it("flags two cards swapped as out of order, not as missing or unrecognised", () => {
        const swapped = SCORES
            .replace("| 🧱 Architecture | 5/5 | ↑1 | The core isolation invariant is now enforced by lint |\n", "")
            .replace(
                "| 🧩 Implementation | 4/5 | = | Honest error paths, no type escapes |",
                "| 🧩 Implementation | 4/5 | = | Honest error paths, no type escapes |\n| 🧱 Architecture | 5/5 | ↑1 | The core isolation invariant is now enforced by lint |",
            );

        expect(scorecardShapeProblems(parseScoresTable(swapped))).toEqual(["card rows are out of SCORECARDS.md's order"]);
    });

    it("reports the missing-table case from a null parse, not a thrown error", () => {
        expect(scorecardShapeProblems(null)).toEqual(["no parseable '## 🧮 Scores' table with a Total row"]);
    });
});
