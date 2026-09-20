import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readArtifact } from "./store.ts";

const directories: string[] = [];

afterEach(async () => {
    vi.unstubAllGlobals();

    await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

async function snapshotDir(): Promise<string> {
    const directory = await mkdtemp(join(tmpdir(), "developer-portal-store-"));
    directories.push(directory);

    return directory;
}

describe("readArtifact", () => {
    it("reads valid JSON from the configured snapshot directory", async () => {
        const directory = await snapshotDir();
        await writeFile(join(directory, "docs.json"), JSON.stringify({ pages: [] }));
        vi.stubGlobal("useRuntimeConfig", () => ({ snapshotDir: directory }));

        await expect(readArtifact("docs")).resolves.toEqual({ pages: [] });
    });

    it("returns null when an artifact is missing", async () => {
        const directory = await snapshotDir();
        vi.stubGlobal("useRuntimeConfig", () => ({ snapshotDir: directory }));

        await expect(readArtifact("docs")).resolves.toBeNull();
    });

    it("returns null for malformed or half-written JSON", async () => {
        const directory = await snapshotDir();
        await writeFile(join(directory, "docs.json"), "{\"pages\":");
        vi.stubGlobal("useRuntimeConfig", () => ({ snapshotDir: directory }));

        await expect(readArtifact("docs")).resolves.toBeNull();
    });

    it("uses the configured directory instead of a bundled module path", async () => {
        const directory = await snapshotDir();
        await writeFile(join(directory, "manifest.json"), JSON.stringify({ source: "configured" }));
        vi.stubGlobal("useRuntimeConfig", () => ({ snapshotDir: directory }));

        await expect(readArtifact("manifest")).resolves.toEqual({ source: "configured" });
    });
});
