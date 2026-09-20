import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = vi.hoisted(() => ({ value: "" }));
vi.mock("../../shared/adapters/git.ts", () => ({
    at: (...parts: string[]) => join(root.value, ...parts),
    repoRoot: () => root.value,
}));

import {
    instructionFiles,
    matchesBytes,
    matchesText,
    modeOf,
    readBytes,
    readManifest,
    readText,
    removeFile,
    skillFiles,
    writeBytes,
    writeText,
} from "./files.ts";

let directory: string;

beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "agents-sync-files-"));
    root.value = directory;
});

afterEach(() => rmSync(directory, { recursive: true, force: true }));

describe("agents-sync filesystem adapter", () => {
    it("discovers instruction and skill files while ignoring generated and dependency directories", () => {
        mkdirSync(join(directory, "packages", "demo"), { recursive: true });
        mkdirSync(join(directory, ".agents", "skills", "demo"), { recursive: true });
        mkdirSync(join(directory, "node_modules", "ignored"), { recursive: true });
        writeFileSync(join(directory, "AGENTS.md"), "root");
        writeFileSync(join(directory, "packages", "demo", "AGENTS.md"), "project");
        writeFileSync(join(directory, ".agents", "skills", "demo", "SKILL.md"), "skill");
        writeFileSync(join(directory, ".agents", "skills", "demo", "reference.md"), "reference");
        writeFileSync(join(directory, "node_modules", "ignored", "AGENTS.md"), "ignored");

        expect(instructionFiles()).toEqual(["AGENTS.md", "packages/demo/AGENTS.md"]);
        expect(skillFiles()).toEqual([".agents/skills/demo/reference.md", ".agents/skills/demo/SKILL.md"]);
    });

    it("writes nested text and bytes with modes and removes only existing files", () => {
        writeText("nested/a.txt", "text", 0o744);
        writeBytes("nested/b.bin", Buffer.from([1, 2]), 0o600);

        expect(readText("nested/a.txt")).toBe("text");
        expect(readBytes("nested/b.bin")).toEqual(Buffer.from([1, 2]));
        expect(modeOf("nested/a.txt") & 0o777).toBe(0o744);
        expect(modeOf("nested/b.bin") & 0o777).toBe(0o600);
        expect(matchesText("nested/a.txt", "text")).toBe(true);
        expect(matchesText("nested/a.txt", "other")).toBe(false);
        expect(matchesBytes("nested/b.bin", Buffer.from([1, 2]))).toBe(true);
        expect(matchesBytes("nested/b.bin", Buffer.from([2, 1]))).toBe(false);
        removeFile("nested/a.txt");
        removeFile("nested/missing.txt");
        expect(existsSync(join(directory, "nested/a.txt"))).toBe(false);
    });

    it("reads valid manifest files and treats missing, malformed and invalid shapes as empty", () => {
        expect(readManifest()).toEqual([]);
        mkdirSync(join(directory, ".claude"), { recursive: true });
        writeFileSync(join(directory, ".claude", "generated.json"), JSON.stringify({ files: ["CLAUDE.md"] }));
        expect(readManifest()).toEqual(["CLAUDE.md"]);
        writeFileSync(join(directory, ".claude", "generated.json"), JSON.stringify({ files: ["CLAUDE.md", 1] }));
        expect(readManifest()).toEqual([]);
        writeFileSync(join(directory, ".claude", "generated.json"), "not json");
        expect(readManifest()).toEqual([]);
    });

    it("does not require callers to manage the target directory", () => {
        writeText("deep/file.txt", "value");
        expect(readFileSync(join(directory, "deep/file.txt"), "utf8")).toBe("value");
    });
});
