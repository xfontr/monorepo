import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = vi.hoisted(() => ({ value: "" }));
vi.mock("../../shared/adapters/git.ts", () => ({
    at: (...parts: string[]) => join(root.value, ...parts),
    repoRoot: () => root.value,
}));

import { docs, hookNames, projectScripts, readMap, rootScripts, skillFiles, workflowFiles } from "./files.ts";

let directory: string;
beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "map-files-"));
    root.value = directory;
});
afterEach(() => rmSync(directory, { recursive: true, force: true }));

describe("map filesystem adapter", () => {
    it("discovers root and project scripts while skipping malformed project packages", () => {
        writeFileSync(join(directory, "package.json"), JSON.stringify({ scripts: { lint: "lint", graph: "graph" } }));
        for (const top of ["packages", "apps", "infrastructure"]) mkdirSync(join(directory, top), { recursive: true });
        mkdirSync(join(directory, "packages", "ui"));
        writeFileSync(join(directory, "packages", "ui", "package.json"), JSON.stringify({ name: "@monorepo/ui", scripts: { test: "test", storybook: "storybook" } }));
        mkdirSync(join(directory, "apps", "broken"));
        writeFileSync(join(directory, "apps", "broken", "package.json"), "not json");

        expect(rootScripts()).toEqual(["lint", "graph"]);
        expect(projectScripts()).toEqual([{ root: "packages/ui", name: "@monorepo/ui", scripts: ["test", "storybook"] }]);
    });

    it("extracts hook and displayed workflow names and ignores non-workflows", () => {
        mkdirSync(join(directory, ".husky"));
        writeFileSync(join(directory, ".husky", "pre-push"), "run");
        writeFileSync(join(directory, ".husky", "_"), "internal");
        mkdirSync(join(directory, ".github", "workflows"), { recursive: true });
        writeFileSync(join(directory, ".github", "workflows", "ci.yml"), "name: CI checks\n");
        writeFileSync(join(directory, ".github", "workflows", "release.yaml"), "no name\n");
        writeFileSync(join(directory, ".github", "workflows", "notes.md"), "name: Ignore\n");

        expect(hookNames()).toEqual(["pre-push"]);
        expect(workflowFiles()).toEqual([
            { file: "ci.yml", name: "CI checks" },
            { file: "release.yaml", name: "release.yaml" },
        ]);
    });

    it("finds named skills and walks markdown while excluding generated, ignored and review docs", () => {
        mkdirSync(join(directory, ".agents", "skills", "demo"), { recursive: true });
        mkdirSync(join(directory, "docs", "reviews"), { recursive: true });
        mkdirSync(join(directory, ".claude", "skills", "demo"), { recursive: true });
        mkdirSync(join(directory, "worktrees", "old"), { recursive: true });
        writeFileSync(join(directory, ".agents", "skills", "demo", "SKILL.md"), "name: Demo\n");
        writeFileSync(join(directory, "README.md"), "readme");
        writeFileSync(join(directory, "CLAUDE.md"), "generated");
        writeFileSync(join(directory, "docs", "guide.md"), "guide");
        writeFileSync(join(directory, "docs", "CHANGELOG.md"), "change");
        writeFileSync(join(directory, "docs", "reviews", "review.md"), "review");
        writeFileSync(join(directory, ".claude", "skills", "demo", "SKILL.md"), "generated");
        writeFileSync(join(directory, "worktrees", "old", "README.md"), "old");

        expect(skillFiles()).toEqual([{ source: ".agents/skills/demo/SKILL.md", name: "Demo" }]);
        expect(docs().map(({ path }) => path).sort()).toEqual([".agents/skills/demo/SKILL.md", "README.md", "docs/guide.md"]);
    });

    it("returns an empty map when the generated file does not exist", () => {
        expect(readMap()).toBe("");
    });

    it("treats absent discovery directories and skills without SKILL.md as empty", () => {
        expect(hookNames()).toEqual([]);
        expect(workflowFiles()).toEqual([]);
        expect(skillFiles()).toEqual([]);
        expect(projectScripts()).toEqual([]);
    });
});
