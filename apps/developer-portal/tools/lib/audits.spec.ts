import { describe, expect, it } from "vitest";
import { auditProblems } from "./audits.ts";

const TABLE = "## Bugs\n\n| ID | Where | Status |\n| --- | --- | --- |\n| B1 | a.ts | open |\n";
const VALID = `---\nscope: "@monorepo/ui"\ncommit: 61b6f7f\n---\n\n# 🔎 UI\n\n${TABLE}`;

function messagesOf(file: string, source: string): string[] {
    return auditProblems([{ file, source }]).map((problem) => problem.message);
}

describe("auditProblems", () => {
    it("passes an audit shaped like the template", () => {
        expect(messagesOf("2026-09-25-ui.md", VALID)).toEqual([]);
    });

    it("rejects a numbered filename, since audits are dated snapshots rather than a sequence", () => {
        expect(messagesOf("0001-ui.md", VALID)).toEqual(["filename doesn't match <YYYY-MM-DD>-<scope-slug>.md"]);
    });

    it("requires scope and commit, because an audit without them can't be re-checked against the code it read", () => {
        expect(messagesOf("2026-09-25-ui.md", `---\ncommit: main\n---\n${TABLE}`)).toEqual([
            "frontmatter is missing `scope:`",
            "frontmatter is missing a short-sha `commit:`",
        ]);
    });

    it("flags an audit whose findings the portal can't read at all", () => {
        expect(messagesOf("2026-09-25-ui.md", "---\nscope: x\ncommit: abc1234\n---\n| Where | What |\n| --- | --- |\n| a | b |\n"))
            .toEqual(["no table with an `ID` and a `Status` column"]);
    });

    it("flags a reused ID and a status outside the vocabulary", () => {
        const source = `${VALID}| B1 | b.ts | done |\n`;

        expect(messagesOf("2026-09-25-ui.md", source)).toEqual([
            "B1 is used twice",
            "B1's status isn't one of open, fixed, wont-fix",
        ]);
    });
});
