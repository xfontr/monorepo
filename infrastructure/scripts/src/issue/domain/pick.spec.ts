import { describe, expect, it } from "vitest";
import { issueLoad, issueOptionMatches, issueOptions, projectLoad } from "./pick.ts";

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

describe("issueLoad", () => {
    it("uses the live list for a successful request", () => {
        expect(issueLoad(false, false, true, [ISSUE], [])).toEqual({ source: "live", issues: [ISSUE] });
    });

    it("uses the cache when the request fails offline", () => {
        expect(issueLoad(true, true, false, [], [ISSUE])).toEqual({ source: "cache", issues: [ISSUE] });
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
