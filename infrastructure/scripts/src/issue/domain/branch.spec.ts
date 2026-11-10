import { describe, expect, it } from "vitest";
import { areaFor, branchName, branchTypeFor, issueFromBranch, slugify } from "./branch.ts";

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
    // issue number right after the area is what git.ts matches on to find the branch again.
    it("puts the type first, the area second, and the issue number first after that, so the push gate and the resume lookup both match", () => {
        expect(branchName("feature", "huella-legal", 42, "Add dashboards for spaces")).toBe(
            "feature/huella-legal/42-add-dashboards-for-spaces",
        );
    });
});

describe("areaFor", () => {
    it.each([
        [["enhancement", "app:wp-editor"], "wp-editor"],
        [["package:content", "app:huella-legal"], "huella-legal"],
        [["infra:scripts", "package:configs"], "configs"],
        [["infra:scripts"], "scripts"],
    ])("reads %j as %s, an app outranking a package outranking infra", (labels, expected) => {
        expect(areaFor(labels)).toBe(expected);
    });

    it("falls back to repo when no label names a folder, so every issue still gets a pushable branch", () => {
        expect(areaFor(["enhancement", "repo"])).toBe("repo");
        expect(areaFor([])).toBe("repo");
    });
});

describe("issueFromBranch", () => {
    it("reads back the area and number that branchName wrote", () => {
        expect(issueFromBranch(branchName("fix", "huella-legal", 7, "Broken link"))).toEqual({
            area: "huella-legal",
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
