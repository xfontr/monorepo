import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import libCoverage from "istanbul-lib-coverage";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = vi.hoisted(() => ({ value: "" }));
vi.mock("../../shared/adapters/git.ts", () => ({ at: (path: string) => join(root.value, path) }));

import { loadReport, writeHtmlReport } from "./files.ts";

let directory: string;
beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "coverage-files-"));
    root.value = directory;
});
afterEach(() => rmSync(directory, { recursive: true, force: true }));

describe("loadReport", () => {
    it("loads an existing coverage JSON file", () => {
        writeFileSync(join(directory, "coverage-final.json"), JSON.stringify({ files: {} }));
        expect(loadReport("coverage-final.json")).toEqual({ files: {} });
    });

    it("returns undefined when a project has not produced a report", () => {
        expect(loadReport("missing.json")).toBeUndefined();
    });
});

describe("writeHtmlReport", () => {
    it("creates the output directory it writes the HTML report into", () => {
        const dir = join(directory, "nested", "coverage");

        writeHtmlReport(dir, libCoverage.createCoverageMap({}));

        expect(existsSync(join(dir, "index.html"))).toBe(true);
    });
});
