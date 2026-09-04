import { describe, expect, it } from "vitest";
import {
    displayName,
    fingerprint,
    hasRename,
    isBigChange,
    isStale,
    parseLinesChanged,
    projectRootFor,
    projectRootsFor,
    shouldWarn,
} from "./detect.ts";

describe("projectRootFor", () => {
    it.each([
        ["packages/ui/lib/components/Button.vue", "packages/ui"],
        ["apps/huella-legal/server/plugins/observability.ts", "apps/huella-legal"],
        ["infrastructure/scripts/src/drift/index.ts", "infrastructure/scripts"],
    ])("maps %j to the project root %j", (file, expected) => {
        expect(projectRootFor(file)).toBe(expected);
    });

    // The exact-duplication and structural-assertion layers in 0040 already own root-level files —
    // this heuristic isn't a second, looser version of either.
    it("maps a repo-root file to no project, so README.md and CLAUDE.md never trip this heuristic", () => {
        expect(projectRootFor("README.md")).toBeUndefined();
    });
});

describe("projectRootsFor", () => {
    it("de-duplicates multiple changed files under the same project into one root", () => {
        expect(projectRootsFor(["packages/ui/a.ts", "packages/ui/b.ts", "apps/huella-legal/c.ts"]))
            .toEqual(["packages/ui", "apps/huella-legal"]);
    });
});

describe("parseLinesChanged", () => {
    it("sums added and deleted lines across every numstat row", () => {
        expect(parseLinesChanged(["10\t3\tfoo.ts", "0\t7\tbar.ts"])).toBe(20);
    });

    // `git diff --numstat` prints `-\t-\tpath` for a binary file instead of a line count.
    it("treats a binary file's dash counts as zero instead of NaN", () => {
        expect(parseLinesChanged(["-\t-\tlogo.png"])).toBe(0);
    });
});

describe("hasRename", () => {
    it("finds a rename among other statuses", () => {
        expect(hasRename(["M\tfoo.ts", "R100\told.ts\tnew.ts"])).toBe(true);
    });

    it("returns false when nothing was renamed", () => {
        expect(hasRename(["M\tfoo.ts", "A\tbar.ts"])).toBe(false);
    });
});

describe("fingerprint", () => {
    it("returns the same digest for the same diff text", () => {
        expect(fingerprint("diff content")).toBe(fingerprint("diff content"));
    });

    it("returns a different digest once the diff text changes, so a new change re-arms the warning", () => {
        expect(fingerprint("diff content")).not.toBe(fingerprint("different diff content"));
    });
});

describe("isStale", () => {
    const now = Date.parse("2026-09-04");

    it("is stale once the last markdown commit is 4 months or older", () => {
        expect(isStale(now - 121 * 24 * 60 * 60 * 1000, now)).toBe(true);
    });

    it("is not stale for docs touched within the last 4 months", () => {
        expect(isStale(now - 10 * 24 * 60 * 60 * 1000, now)).toBe(false);
    });

    // A project with no markdown file at all is at least as much a drift signal as an old one.
    it("treats a project with no markdown commit at all as stale", () => {
        expect(isStale(undefined, now)).toBe(true);
    });
});

describe("isBigChange", () => {
    it("is big on line count alone", () => {
        expect(isBigChange({ linesChanged: 200, filesChanged: 1, renamed: false })).toBe(true);
    });

    it("is big on file count alone", () => {
        expect(isBigChange({ linesChanged: 1, filesChanged: 8, renamed: false })).toBe(true);
    });

    it("is big on a rename alone, regardless of size", () => {
        expect(isBigChange({ linesChanged: 1, filesChanged: 1, renamed: true })).toBe(true);
    });

    it("is not big under every threshold", () => {
        expect(isBigChange({ linesChanged: 5, filesChanged: 1, renamed: false })).toBe(false);
    });
});

describe("shouldWarn", () => {
    const now = Date.parse("2026-09-04");
    const freshDocs = now - 10 * 24 * 60 * 60 * 1000;
    const smallChange = { linesChanged: 5, filesChanged: 1, renamed: false };
    const bigChange = { linesChanged: 500, filesChanged: 1, renamed: false };

    it("warns on a small change to a project whose docs are stale", () => {
        expect(shouldWarn(smallChange, undefined, now)).toBe(true);
    });

    it("warns on a big change even with fresh docs", () => {
        expect(shouldWarn(bigChange, freshDocs, now)).toBe(true);
    });

    it("stays quiet on a small change to a project with fresh docs", () => {
        expect(shouldWarn(smallChange, freshDocs, now)).toBe(false);
    });
});

describe("displayName", () => {
    it.each([
        ["apps/huella-legal", "Huella Legal"],
        ["packages/ui", "Ui"],
        ["infrastructure/scripts", "Scripts"],
    ])("turns the root %j into the issue title name %j", (root, expected) => {
        expect(displayName(root)).toBe(expected);
    });
});
