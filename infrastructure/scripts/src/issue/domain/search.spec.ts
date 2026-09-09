import { describe, expect, it } from "vitest";
import { matchesIssue, matchesLabel } from "./search.ts";

const ISSUE = {
    number: 63,
    title: "Gracefully handle pnpm dev for a first-time clone",
    labels: ["enhancement", "spike"],
};

describe("matchesIssue", () => {
    // The picker prints `#63`, so both spellings are what someone types to find it again.
    it.each([["63"], ["#63"]])("finds an issue by its number typed as %j", (search) => {
        expect(matchesIssue(ISSUE, search)).toBe(true);
    });

    it("finds it by a word from the title, case-insensitively", () => {
        expect(matchesIssue(ISSUE, "CLONE")).toBe(true);
    });

    // Otherwise narrowing a board to its spikes needs a second prompt, which is the filter this
    // deliberately doesn't have.
    it("finds it by a label, so a board narrows to one kind of work without another prompt", () => {
        expect(matchesIssue(ISSUE, "spike")).toBe(true);
    });

    it("excludes an issue matching nothing, so the list can reach empty rather than never narrow", () => {
        expect(matchesIssue(ISSUE, "storybook")).toBe(false);
    });

    // The prompt calls this for every row on every keystroke, including the first render.
    it("keeps every row while the search box is empty", () => {
        expect(matchesIssue(ISSUE, "   ")).toBe(true);
    });
});

describe("matchesLabel", () => {
    const LABEL = { name: "wontfix", description: "This will not be worked on" };

    it("finds a label by name", () => {
        expect(matchesLabel(LABEL, "wont")).toBe(true);
    });

    // Half of GitHub's default labels are remembered by meaning rather than spelling.
    it("finds a label by its description, so meaning works when the name doesn't come to mind", () => {
        expect(matchesLabel(LABEL, "not be worked")).toBe(true);
    });

    it("excludes a label matching neither, so the list can reach empty", () => {
        expect(matchesLabel(LABEL, "bug")).toBe(false);
    });
});
