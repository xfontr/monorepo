import { describe, expect, it } from "vitest";
import {
    compareLayoutBlock,
    compareReviewHistory,
    compareScorecardShape,
    compareTagTables,
    projectsInLayoutBlock,
    tagsInBoundaries,
    tagsInReadmeTable,
} from "./invariants.ts";

// These pin the same cross-file rules `.claude/hooks/check-invariants.sh` enforces on edit. The hook
// reads a Claude tool payload on stdin and cannot be called from a spec, so the copies are kept
// honest here instead — which is the entire reason this module exists as pure functions.

const BOUNDARIES = `
const boundaries = {
    rules: {
        "@nx/enforce-module-boundaries": ["error", { depConstraints: [
            { sourceTag: "type:app", onlyDependOnLibsWithTags: ["type:ui"] },
            { sourceTag: "type:ui", onlyDependOnLibsWithTags: ["type:config"] },
        ] }],
    },
};
`;

const README = `
## 🗂 Workspace layout

\`\`\`
apps/
    huella-legal/     @monorepo/huella-legal
packages/
    ui/               @monorepo/ui
\`\`\`

## 🧱 Architecture & boundaries

| Tag | May depend on | Who has it |
| --- | --- | --- |
| \`type:app\` | \`type:ui\` | \`huella-legal\` |
| \`type:ui\` | \`type:config\` | \`ui\` |
`;

describe("tagsInBoundaries", () => {
    it("reads every enforced source tag, which is the list the README has to match", () => {
        expect(tagsInBoundaries(BOUNDARIES)).toEqual(["type:app", "type:ui"]);
    });
});

describe("tagsInReadmeTable", () => {
    it("reads only the leftmost column, so a tag named in the 'may depend on' column is not counted twice", () => {
        expect(tagsInReadmeTable(README)).toEqual(["type:app", "type:ui"]);
    });
});

describe("projectsInLayoutBlock", () => {
    it("reads the directories out of the layout block, not the package names beside them", () => {
        expect(projectsInLayoutBlock(README)).toEqual(["huella-legal", "ui"]);
    });
});

describe("compareTagTables", () => {
    it("finds nothing when the two copies agree", () => {
        expect(compareTagTables(BOUNDARIES, README)).toEqual([]);
    });

    it("reports a tag that is enforced but undocumented — the drift this repo actually had", () => {
        const extra = BOUNDARIES.replace("{ sourceTag: \"type:app\"", "{ sourceTag: \"type:domain\", onlyDependOnLibsWithTags: [] },\n            { sourceTag: \"type:app\"");
        const [finding] = compareTagTables(extra, README);

        expect(finding?.id).toBe("tag-table-undocumented");
        expect(finding?.detail).toContain("type:domain");
    });

    it("reports a tag documented with no rule behind it, which reads as enforced and is not", () => {
        const extra = `${README}| \`type:ghost\` | nothing | — |\n`;
        const [finding] = compareTagTables(BOUNDARIES, extra);

        expect(finding?.id).toBe("tag-table-unenforced");
    });
});

describe("compareLayoutBlock", () => {
    it("finds nothing when every project is listed", () => {
        expect(compareLayoutBlock(README, ["apps/huella-legal", "packages/ui"])).toEqual([]);
    });

    it("names the project missing from the layout block rather than just saying they differ", () => {
        const [finding] = compareLayoutBlock(README, ["apps/huella-legal", "packages/ui", "apps/dashboard"]);

        expect(finding?.detail).toContain("dashboard");
    });
});

describe("compareReviewHistory", () => {
    const HISTORY = `
| Review | Commit | Total |
| --- | --- | --- |
| [2026-09-04](./2026-09-04-c1025f3.md) | \`c1025f3\` | 4.1 |
`;

    it("finds nothing when every review has a row", () => {
        expect(compareReviewHistory(HISTORY, ["2026-09-04-c1025f3.md"])).toEqual([]);
    });

    it("names the review with no row, which is a review that compares against nothing", () => {
        const [finding] = compareReviewHistory(HISTORY, ["2026-09-04-c1025f3.md", "2026-09-05-abcb17d.md"]);

        expect(finding?.id).toBe("review-history-incomplete");
        expect(finding?.detail).toContain("2026-09-05-abcb17d.md");
    });
});

describe("compareScorecardShape", () => {
    const REVIEW = `
## 🧮 Scores

| Card | Score | Δ | Verdict |
| --- | --- | --- | --- |
| 🧱 Architecture | 5/5 | ↑1 | fine |
| 🧩 Implementation | 4/5 | = | fine |
| 🧪 Testing | 4/5 | = | fine |
| ⚙️ Tooling & DX | 4/5 | ↑1 | fine |
| 📚 Documentation | 4/5 | ↑2 | fine |
| 🤖 Agent setup | 3/5 | = | fine |
| 📋 Process & delivery | 4/5 | = | fine |
| **Total** | **4.1/5** | ↑0.5 | |

## 🃏 Cards
`;

    it("finds nothing when the Scores table matches the template", () => {
        expect(compareScorecardShape("2026-09-04-c1025f3.md", REVIEW)).toEqual([]);
    });

    it("names the file and the problem when a review's table doesn't parse", () => {
        const [finding] = compareScorecardShape("2026-09-06-badbeef.md", "## 🧮 Scores\n\nnot a table\n");

        expect(finding?.id).toBe("scorecard-shape-mismatch");
        expect(finding?.detail).toContain("2026-09-06-badbeef.md");
        expect(finding?.evidence).toContain("docs/reviews/2026-09-06-badbeef.md");
    });
});
