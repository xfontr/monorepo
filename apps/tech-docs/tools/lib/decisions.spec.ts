import { describe, expect, it } from "vitest";
import { decisionProblems, frontmatterFields } from "./decisions.ts";

const report = (body: string): string => `---\n${body}\n---\n\n# 🧭 A title\n`;

const WELL_FORMED = {
    file: "0001-a-decision.md",
    source: report("issue: 37\nstatus: implemented\ndecision: accepted"),
};

describe("frontmatterFields", () => {
    it("reads every flat key in the block and nothing below the closing fence", () => {
        expect(frontmatterFields(report("issue: 37\nstatus: implemented"))).toEqual({
            issue: "37",
            status: "implemented",
        });
    });

    it("unwraps a quoted value instead of keeping the quotes, which the dashboard's parser also does", () => {
        expect(frontmatterFields(report("status: \"implemented\""))).toEqual({ status: "implemented" });
    });

    it("drops a trailing comment rather than reading it as part of the value", () => {
        expect(frontmatterFields(report("status: implemented # landed in #107"))).toEqual({ status: "implemented" });
    });

    it("answers empty for a file with no frontmatter, rather than throwing", () => {
        expect(frontmatterFields("# 🧭 A title\n")).toEqual({});
    });

    it("answers null for a block that isn't valid YAML, which is a problem rather than no fields", () => {
        expect(frontmatterFields(report("status: [unclosed"))).toBeNull();
    });
});

describe("decisionProblems", () => {
    it("passes a well-formed corpus clean", () => {
        expect(decisionProblems([WELL_FORMED])).toEqual([]);
    });

    it("flags a filename that isn't <NNNN>-<slug>.md", () => {
        const [problem] = decisionProblems([{ ...WELL_FORMED, file: "a-decision.md" }]);

        expect(problem?.message).toContain("filename");
    });

    it("flags a second report claiming a number already taken, which consecutive numbering exists to prevent", () => {
        const problems = decisionProblems([WELL_FORMED, { ...WELL_FORMED, file: "0001-another.md" }]);

        expect(problems[0]?.message).toBe("number 0001 is already 0001-a-decision.md");
    });

    it("never flags two reports sharing an issue, which is one issue raising two questions", () => {
        const sibling = { file: "0002-another.md", source: WELL_FORMED.source };

        expect(decisionProblems([WELL_FORMED, sibling])).toEqual([]);
    });

    it("flags a status outside the documented vocabulary, so a typo can't read as a missing badge", () => {
        const [problem] = decisionProblems([{ ...WELL_FORMED, source: report("issue: 37\nstatus: done\ndecision: accepted") }]);

        expect(problem?.message).toContain("`status: done`");
    });

    it("flags a supersededBy that names a file nobody filed", () => {
        const source = report("issue: 37\nstatus: implemented\ndecision: superseded\nsupersededBy: 0099-ghost.md");
        const [problem] = decisionProblems([{ ...WELL_FORMED, source }]);

        expect(problem?.message).toContain("isn't a filed decision");
    });

    it("flags supersededBy set on a decision that still stands, which would render as current", () => {
        const source = report("issue: 37\nstatus: implemented\ndecision: accepted\nsupersededBy: 0002-other.md");
        const [problem] = decisionProblems([{ ...WELL_FORMED, source }]);

        expect(problem?.message).toContain("isn't `superseded`");
    });

    it("flags a missing issue, which is the only link back to what raised the question", () => {
        const [problem] = decisionProblems([{ ...WELL_FORMED, source: report("status: implemented\ndecision: accepted") }]);

        expect(problem?.message).toContain("`issue:`");
    });
});
