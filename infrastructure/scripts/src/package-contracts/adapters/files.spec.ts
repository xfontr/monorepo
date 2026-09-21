import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = vi.hoisted(() => ({ value: "" }));
vi.mock("../../shared/adapters/git.ts", () => ({
    at: (...parts: string[]) => join(root.value, ...parts),
}));

import { readPackages } from "./files.ts";

let directory: string;

beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "package-contracts-files-"));
    root.value = directory;
    mkdirSync(join(directory, "packages"), { recursive: true });
});

afterEach(() => rmSync(directory, { recursive: true, force: true }));

describe("package manifest filesystem adapter", () => {
    it("discovers direct package directories, parses manifests and lists nested files", () => {
        mkdirSync(join(directory, "packages", "demo", "src"), { recursive: true });
        writeFileSync(join(directory, "packages", "demo", "package.json"), "{\"name\":\"@monorepo/demo\"}");
        writeFileSync(join(directory, "packages", "demo", "src", "index.ts"), "export {};");

        const [pkg] = readPackages();

        expect(pkg?.directory).toBe("demo");
        expect(pkg?.files).toEqual(expect.arrayContaining(["package.json", "src/index.ts"]));
        expect(pkg?.manifest).toEqual({ name: "@monorepo/demo" });
        expect(pkg?.readError).toBeUndefined();
    });

    it("keeps malformed and missing manifests as package records for validation", () => {
        mkdirSync(join(directory, "packages", "malformed"), { recursive: true });
        mkdirSync(join(directory, "packages", "missing"), { recursive: true });
        writeFileSync(join(directory, "packages", "malformed", "package.json"), "not json");

        const packages = readPackages();

        expect(packages).toHaveLength(2);
        expect(packages.find((pkg) => pkg.directory === "malformed")?.readError).toBeDefined();
        expect(packages.find((pkg) => pkg.directory === "missing")?.readError).toBeDefined();
    });
});
