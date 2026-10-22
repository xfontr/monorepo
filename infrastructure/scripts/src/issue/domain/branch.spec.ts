import { describe, expect, it } from "vitest";
import { branchName, branchTypeFor, issueFromBranch, slugify } from "./branch.ts";

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
        expect(slugify("-".repeat(100_000))).toBe("");
    });
});

describe("branchName", () => {
    // `.husky/pre-push` only accepts ^(hotfix|fix|feature|release)/[^/]+/[0-9]+-.+, and the
    // issue number right after the project slug is what git.ts matches on to find the branch again.
    it("puts the type first, the slugified project second, and the issue number first after that, so the push gate and the resume lookup both match", () => {
        expect(branchName("feature", "Website", 42, "Add dashboards for spaces")).toBe(
            "feature/website/42-add-dashboards-for-spaces",
        );
    });
});

describe("issueFromBranch", () => {
    it("reads back the board slug and number that branchName wrote", () => {
        expect(issueFromBranch(branchName("fix", "Huella Legal", 7, "Broken link"))).toEqual({
            board: "huella-legal",
            number: 7,
        });
    });

    it("finds no issue on a branch outside the convention, such as master", () => {
        expect(issueFromBranch("master")).toBeUndefined();
        expect(issueFromBranch("dependabot/npm_and_yarn/vitest-92ac8026ca")).toBeUndefined();
    });
});

describe("branchTypeFor", () => {
    it.each([
        [["enhancement", "app:huella-legal"], "feature"],
        [["bug"], "fix"],
        [["spike"], undefined],
        [["bug", "enhancement"], undefined],
    ])("maps %j to %s, refusing to guess between two", (labels, expected) => {
        expect(branchTypeFor(labels)).toBe(expected);
    });
});
