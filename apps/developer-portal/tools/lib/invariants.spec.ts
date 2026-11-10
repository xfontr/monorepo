import { describe, expect, it } from "vitest";
import {
    compareDecisionShape,
    compareLayoutBlock,
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
        const extra = BOUNDARIES.replace(
            '{ sourceTag: "type:app"',
            '{ sourceTag: "type:domain", onlyDependOnLibsWithTags: [] },\n            { sourceTag: "type:app"',
        );
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
        const [finding] = compareLayoutBlock(README, [
            "apps/huella-legal",
            "packages/ui",
            "apps/developer-portal",
        ]);

        expect(finding?.detail).toContain("developer-portal");
    });
});

describe("compareDecisionShape", () => {
    const report = (issue: string) =>
        `---\nissue: ${issue}\nstatus: implemented\ndecision: accepted\n---\n\n# 🧭 A decision\n`;

    it("flags two reports sharing a number, the collision consecutive numbering exists to prevent", () => {
        const findings = compareDecisionShape([
            { file: "0001-first.md", source: report("1") },
            { file: "0001-second.md", source: report("2") },
        ]);

        expect(findings.map((finding) => finding.id)).toEqual(["decision-shape-mismatch"]);
        expect(findings[0]?.detail).toContain("0001-second.md");
    });

    it("stays silent on well-formed reports, so the Overview only lists real drift", () => {
        expect(compareDecisionShape([{ file: "0001-first.md", source: report("1") }])).toEqual([]);
    });
});
