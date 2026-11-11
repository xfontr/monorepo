import { describe, expect, it, vi } from "vitest";
import type { ProjectNode } from "#layers/snapshot/shared/types.ts";
import { collectRetired, parseDeletions } from "./retired.ts";

const run = vi.hoisted(() => ({ git: vi.fn() }));
vi.mock("../lib/run.ts", () => run);

const deletion = (path: string, manifest: object): string =>
    [
        `diff --git a/${path} b/${path}`,
        "deleted file mode 100644",
        "index 728e27d4..00000000",
        `--- a/${path}`,
        "+++ /dev/null",
        "@@ -1,3 +0,0 @@",
        ...JSON.stringify(manifest, null, 2)
            .split("\n")
            .map((line) => `-${line}`),
    ].join("\n");

const commit = (sha: string, date: string, subject: string, ...files: string[]): string =>
    `\0${sha}\t${date}\t${subject}\n\n${files.join("\n")}\n`;

const live = (name: string): ProjectNode => ({
    name,
    root: `packages/${name}`,
    tags: [],
    dependsOn: [],
    dependedOnBy: [],
});

describe("parseDeletions", () => {
    it("reads the name, root and declared tags from the deleted manifest's patch", () => {
        const log = commit(
            "abc",
            "2026-11-08",
            "chore: delete ui",
            deletion("packages/ui/package.json", {
                name: "@monorepo/ui",
                nx: { tags: ["type:ui", "scope:shared", "npm:private"] },
            }),
        );

        expect(parseDeletions(log, [])).toEqual([
            {
                name: "@monorepo/ui",
                root: "packages/ui",
                tags: ["type:ui", "scope:shared"],
                deletedAt: "2026-11-08",
                commit: "abc",
                subject: "chore: delete ui",
            },
        ]);
    });

    it("keeps every project one commit deletes, not just the first", () => {
        const log = commit(
            "abc",
            "2026-11-08",
            "chore: delete two",
            deletion("packages/b/package.json", { name: "b" }),
            deletion("apps/a/package.json", { name: "a" }),
        );

        expect(parseDeletions(log, []).map((project) => project.root)).toEqual([
            "apps/a",
            "packages/b",
        ]);
    });

    it("hides a deletion whose name is live again, so a moved project never shows as retired", () => {
        const log = commit(
            "abc",
            "2026-11-08",
            "refactor: move ui",
            deletion("packages/ui/package.json", { name: "@monorepo/ui" }),
        );

        expect(parseDeletions(log, [live("@monorepo/ui")])).toEqual([]);
    });

    it("keeps only the newest deletion of a name that was deleted twice", () => {
        const log =
            commit(
                "new",
                "2026-11-08",
                "second",
                deletion("packages/x/package.json", { name: "x" }),
            ) +
            commit(
                "old",
                "2025-01-01",
                "first",
                deletion("packages/x/package.json", { name: "x" }),
            );

        expect(parseDeletions(log, []).map((project) => project.commit)).toEqual(["new"]);
    });

    it("skips a manifest that no longer parses instead of failing the whole collection", () => {
        const log = commit(
            "abc",
            "2026-11-08",
            "chore: delete",
            "diff --git a/packages/x/package.json b/packages/x/package.json\n--- a/packages/x/package.json\n-{ broken",
        );

        expect(parseDeletions(log, [])).toEqual([]);
    });
});

describe("collectRetired", () => {
    it("pins rename detection and the patch format instead of trusting the user's git config", async () => {
        run.git.mockResolvedValue("");

        await collectRetired([]);

        expect(run.git.mock.calls[0]?.[0]).toEqual(
            expect.arrayContaining([
                "--find-renames",
                "--no-ext-diff",
                "--no-color",
                "--src-prefix=a/",
                "--dst-prefix=b/",
            ]),
        );
    });
});
