import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProjectNode } from "../../shared/types.ts";

const fs = vi.hoisted(() => ({
    access: vi.fn(),
    cp: vi.fn(),
    mkdir: vi.fn(),
    readFile: vi.fn(),
    rm: vi.fn(),
}));

vi.mock("node:fs/promises", () => fs);

import { collectCoverage } from "./coverage.ts";

const projects: ProjectNode[] = [
    { name: "alpha", root: "packages/alpha", tags: [], dependsOn: [], dependedOnBy: [] },
    { name: "beta", root: "packages/beta", tags: [], dependsOn: [], dependedOnBy: [] },
];

const summary = (lines: { total: number, covered: number, pct: number }) => ({
    "total": {
        lines,
        statements: lines,
        functions: lines,
        branches: lines,
    },
    "src/index.ts": {},
    "src/other.ts": {},
});

beforeEach(() => {
    vi.clearAllMocks();
    fs.access.mockRejectedValue(new Error("missing"));
});

describe("collectCoverage", () => {
    it("marks a missing project uncollected without inventing metrics", async () => {
        const result = await collectCoverage(projects, "now", async (root) => root === projects[0]?.root
            ? summary({ total: 4, covered: 2, pct: 50 })
            : null);

        expect(result.projects[1]).toEqual({
            name: "beta",
            root: "packages/beta",
            collected: false,
            files: 0,
        });
    });

    it("counts source entries without counting the total entry", async () => {
        const result = await collectCoverage([projects[0]!], "now", async () => summary({ total: 4, covered: 2, pct: 50 }));

        expect(result.projects[0]?.files).toBe(2);
    });

    it("weights workspace percentages by covered and total counts", async () => {
        const result = await collectCoverage(projects, "now", async (root) => root === projects[0]?.root
            ? summary({ total: 10, covered: 9, pct: 90 })
            : summary({ total: 90, covered: 45, pct: 50 }));

        expect(result.totals).toEqual({ lines: 54, statements: 54, functions: 54, branches: 54 });
    });

    it("leaves totals null when no project has a summary", async () => {
        const result = await collectCoverage(projects, "now", async () => null);

        expect(result.totals).toBeNull();
    });

    it("reports no merged report when coverage index is missing", async () => {
        const result = await collectCoverage([], "now", async () => null);

        expect(result.report).toBe(false);
        expect(fs.rm).not.toHaveBeenCalled();
    });

    it("replaces the embedded report when a merged index is available", async () => {
        fs.access.mockResolvedValue(undefined);

        const result = await collectCoverage([], "now", async () => null);

        expect(result.report).toBe(true);
        expect(fs.rm).toHaveBeenCalledWith(expect.any(String), { recursive: true, force: true });
        expect(fs.mkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
        expect(fs.cp).toHaveBeenCalledWith(expect.any(String), expect.any(String), { recursive: true });
    });
});
