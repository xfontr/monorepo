import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = vi.hoisted(() => ({ value: "" }));
vi.mock("../../shared/adapters/git.ts", () => ({ at: (...parts: string[]) => join(root.value, ...parts) }));

import { digestArtifacts, readManifest, writeManifest } from "./files.ts";
import { METHOD_ARTIFACTS } from "../domain/manifest.ts";

let directory: string;
beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "review-files-"));
    root.value = directory;
    mkdirSync(join(directory, "docs", "reviews"), { recursive: true });
});
afterEach(() => rmSync(directory, { recursive: true, force: true }));

describe("review-version filesystem adapter", () => {
    it("reads and writes the method manifest at the repository root", () => {
        writeFileSync(join(directory, "docs/reviews/METHOD.md"), "before");
        expect(readManifest()).toBe("before");

        writeManifest("after");
        expect(readManifest()).toBe("after");
    });

    it("digests every method artifact and marks missing artifacts empty", () => {
        writeFileSync(join(directory, "docs/reviews/SCORECARDS.md"), "scorecards");
        mkdirSync(join(directory, ".agents/skills/repo-review"), { recursive: true });
        writeFileSync(join(directory, ".agents/skills/repo-review/SKILL.md"), "skill", { flag: "w" });

        const digests = digestArtifacts();

        expect(Object.keys(digests)).toEqual([...METHOD_ARTIFACTS]);
        expect(digests["docs/reviews/SCORECARDS.md"]).toHaveLength(12);
        expect(digests[".claude/agents/repo-review-card.md"]).toBe("");
    });
});
