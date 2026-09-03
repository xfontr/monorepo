import { describe, expect, it } from "vitest";
import { branchName, slugify } from "./branch.ts";

describe("slugify", () => {
    it.each([
        ["Add dashboards for spaces", "add-dashboards-for-spaces"],
        ["  Trailing and leading  ", "trailing-and-leading"],
        ["Integrate @monorepo/ui (v2)", "integrate-monorepo-ui-v2"],
        ["Configuració de l'app", "configuracio-de-l-app"],
    ])("turns %j into %j", (title, expected) => {
        expect(slugify(title)).toBe(expected);
    });

    // The branch-title prompt rejects anything that slugs to nothing, so this is what it checks.
    it("collapses a title with no letters or digits to an empty string, rather than to a lone dash", () => {
        expect(slugify("--- ??? ---")).toBe("");
    });
});

describe("branchName", () => {
    // `.husky/pre-push` only accepts ^(hotfix|fix|feature|release)/.+, and the issue number in
    // front is what git.ts matches on to find the branch again.
    it("puts the type before the slash and the issue number first after it, so the push gate and the resume lookup both match", () => {
        expect(branchName("feature", 42, "Add dashboards for spaces")).toBe("feature/42-add-dashboards-for-spaces");
    });
});
