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
    // `.husky/pre-push` only accepts ^(hotfix|fix|feature|release)/[^/]+/[0-9]+-.+, and the
    // issue number right after the project slug is what git.ts matches on to find the branch again.
    it("puts the type first, the slugified project second, and the issue number first after that, so the push gate and the resume lookup both match", () => {
        expect(branchName("feature", "Website", 42, "Add dashboards for spaces")).toBe("feature/website/42-add-dashboards-for-spaces");
    });
});
