import { describe, expect, it } from "vitest";
import { assertAbsolutePaths, assertComplete, mergeReports } from "./merge.ts";

const fileCoverage = (path: string) => ({
    path,
    statementMap: {},
    fnMap: {},
    branchMap: {},
    s: {},
    f: {},
    b: {},
});

describe("assertComplete", () => {
    it("does not throw when every project has a report", () => {
        expect(() => assertComplete([{ name: "@monorepo/ui", data: {} }])).not.toThrow();
    });

    // Rendering a report that's quietly missing a project is the exact failure this guards
    // against — the error has to name it, not just say "incomplete".
    it("names every project missing a report rather than stopping at the first", () => {
        expect(() =>
            assertComplete([
                { name: "@monorepo/ui", data: undefined },
                { name: "@monorepo/content", data: {} },
                { name: "@monorepo/i18n", data: undefined },
            ]),
        ).toThrow(/@monorepo\/ui.*@monorepo\/i18n/s);
    });
});

describe("assertAbsolutePaths", () => {
    it("does not throw when every key is an absolute path", () => {
        expect(() =>
            assertAbsolutePaths("@monorepo/ui", { "/repo/packages/ui/lib/index.ts": fileCoverage("/repo/packages/ui/lib/index.ts") }),
        ).not.toThrow();
    });

    // A relative key from one project and an identically-named relative key from another would
    // merge into a single wrong entry instead of two — this is what stops that silently.
    it("throws naming the project when a key is a relative path", () => {
        expect(() =>
            assertAbsolutePaths("@monorepo/ui", { "src/index.ts": fileCoverage("src/index.ts") }),
        ).toThrow(/@monorepo\/ui.*src\/index\.ts/s);
    });
});

describe("mergeReports", () => {
    it("throws instead of merging when any project's report is missing", () => {
        expect(() => mergeReports([{ name: "@monorepo/ui", data: undefined }])).toThrow(/@monorepo\/ui/);
    });

    it("combines file coverage from every project into one map", () => {
        const map = mergeReports([
            { name: "@monorepo/ui", data: { "/repo/packages/ui/lib/index.ts": fileCoverage("/repo/packages/ui/lib/index.ts") } },
            { name: "@monorepo/content", data: { "/repo/packages/content/lib/index.ts": fileCoverage("/repo/packages/content/lib/index.ts") } },
        ]);

        expect(map.files()).toEqual([
            "/repo/packages/ui/lib/index.ts",
            "/repo/packages/content/lib/index.ts",
        ]);
    });
});
