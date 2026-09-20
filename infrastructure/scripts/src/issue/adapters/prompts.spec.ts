import { describe, expect, it } from "vitest";
import { labelOptions, NONE_OPTION, projectOptions, PROJECT_SCOPE_HINT, ISSUE_SCOPE_HINT } from "./prompts.ts";

describe("issue prompt adapters", () => {
    it("maps project and label records to clack options and preserves empty descriptions", () => {
        expect(projectOptions([{ title: "Roadmap", number: 1, url: "url" }])).toEqual([
            { value: "Roadmap", label: "Roadmap" },
        ]);
        expect(labelOptions([
            { name: "bug", description: "Broken" },
            { name: "empty", description: "" },
        ])).toEqual([
            { value: "bug", label: "bug", hint: "Broken" },
            { value: "empty", label: "empty", hint: undefined },
        ]);
        expect(NONE_OPTION).toEqual({ value: "", label: "— none —" });
        expect(PROJECT_SCOPE_HINT).toContain("project");
        expect(ISSUE_SCOPE_HINT).toContain("project");
    });
});
