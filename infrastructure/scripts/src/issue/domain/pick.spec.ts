import { describe, expect, it } from "vitest";
import {
    issueCountMessage,
    issueOptionMatches,
    issueOptions,
    issuePromptText,
    labelOptionMatches,
    optionalSelection,
    projectLoad,
    selectedProject,
} from "./pick.ts";

const ISSUE = { number: 42, title: "Fix the picker", url: "https://example.test/42", labels: ["bug"] };

describe("projectLoad", () => {
    it.each([
        [[{ title: "Roadmap", number: 1, url: "url" }], false, "live"],
        [[], true, "empty"],
        [[], false, "cache"],
    ])("chooses the %s source", (live, online, source) => {
        expect(projectLoad(live, online).source).toBe(source);
    });
});

describe("issue options", () => {
    it("puts navigation before issues and hides it during a search", () => {
        const back = Symbol("back");
        const options = issueOptions(back, [ISSUE]);

        expect(options[0]?.label).toBe("← Back to project list");
        expect(issueOptionMatches(back, back, "")).toBe(true);
        expect(issueOptionMatches(back, back, "bug")).toBe(false);
        expect(issueOptionMatches(back, ISSUE, "bug")).toBe(true);
    });
});

describe("issue selection", () => {
    it.each([
        ["", undefined],
        ["project-a", "project-a"],
    ])("turns %j into %j when sending an optional selection", (value, expected) => {
        expect(optionalSelection(value)).toBe(expected);
    });

    it("keeps None visible only for an empty label search", () => {
        expect(labelOptionMatches("", { value: "" }, "")).toBe(true);
        expect(labelOptionMatches("", { value: "" }, "bug")).toBe(false);
    });

    it("matches labels by name or description", () => {
        expect(labelOptionMatches("", { value: "bug", hint: "Something broken" }, "broken")).toBe(true);
        expect(labelOptionMatches("", { value: "bug", hint: "Something broken" }, "feature")).toBe(false);
    });
});

describe("issue presentation", () => {
    it.each([
        [0, "0 open issues."],
        [1, "1 open issue."],
        [2, "2 open issues."],
    ])("formats the count", (count, expected) => {
        expect(issueCountMessage(count)).toBe(expected);
    });

    it("warns and removes search controls when no issues are open", () => {
        expect(issuePromptText(0)).toEqual({
            message: "No open issues",
            placeholder: undefined,
            emptyWarning: "Nothing open on that project. `pnpm issue:add` fixes that.",
        });
    });

    it("enables issue search without an empty warning when issues are open", () => {
        expect(issuePromptText(2)).toEqual({
            message: "Issue",
            placeholder: "Type a number, a word from the title, or a label",
            emptyWarning: undefined,
        });
    });

    it("returns the project with the selected title", () => {
        const projects = [{ title: "Roadmap", number: 1, url: "url" }];

        expect(selectedProject(projects, "Roadmap")).toBe(projects[0]);
        expect(selectedProject(projects, "Missing")).toBeUndefined();
    });
});
