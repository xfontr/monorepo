import { describe, expect, it } from "vitest";
import type { AuditFinding } from "./audits.ts";
import { auditStateOf, parseFindings } from "./audits.ts";

const AUDIT = `---
scope: "@monorepo/developer-portal"
commit: 61b6f7f
---

# 🔎 Developer portal

## 🗺 Context

| Read | How |
| --- | --- |
| app/ | every file |

## 🐛 Bugs

| ID | Where | What goes wrong | Fix | Status |
| --- | --- | --- | --- | --- |
| **B1** | \`a.vue:13\` | Link keeps \`.md\` | Strip it | fixed #152 |
| B2 | \`b.vue:17\` | Unknown element | Import it | Open |

\`\`\`md
| ID | Status |
| --- | --- |
| X1 | open |
\`\`\`

## ♻️ Duplication

| ID | Copies | Consolidate into | Status |
|---|---|---|---|
| D1 | \`{ a } \\| null\` twice | one | wont-fix |
| D2 | two kindOfs | one | done |
`;

function finding(status: AuditFinding["status"]): AuditFinding {
    return { id: "B1", category: "Bugs", status, ref: null };
}

describe("parseFindings", () => {
    const findings = parseFindings(AUDIT);

    it("reads only tables with an ID and a Status column, so a Context table isn't counted as findings", () => {
        expect(findings.map((row) => row.id)).toEqual(["B1", "B2", "D1", "D2"]);
    });

    it("ignores a table inside a code fence, which is how the template shows the shape", () => {
        expect(findings.some((row) => row.id === "X1")).toBe(false);
    });

    it("takes the category from the heading above the table, without its emoji", () => {
        expect(findings.map((row) => row.category)).toEqual(["Bugs", "Bugs", "Duplication", "Duplication"]);
    });

    it("keeps the reference after the status word and reads the word case-insensitively", () => {
        expect(findings[0]).toMatchObject({ id: "B1", status: "fixed", ref: "#152" });
        expect(findings[1]).toMatchObject({ status: "open", ref: null });
    });

    it("keeps an escaped pipe inside a cell, so the Status column doesn't shift one to the right", () => {
        expect(findings[2]).toMatchObject({ id: "D1", status: "wont-fix" });
    });

    it("answers null for a status outside the vocabulary rather than guessing one", () => {
        expect(findings[3]?.status).toBeNull();
    });
});

describe("auditStateOf", () => {
    it.each([
        [[finding("open"), finding("open")], "open"],
        [[finding("open"), finding("fixed")], "in-progress"],
        [[finding("fixed"), finding("wont-fix")], "closed"],
        [[finding("wont-fix")], "closed"],
        [[finding(null), finding("fixed")], "in-progress"],
        [[], "closed"],
    ] as const)("derives the audit's state from its findings, a typo counting as open (%#)", (findings, state) => {
        expect(auditStateOf([...findings])).toBe(state);
    });
});
