import { beforeEach, describe, expect, it, vi } from "vitest";

const projects = vi.hoisted(() => ({ projectsWithCoverage: vi.fn() }));
const files = vi.hoisted(() => ({ loadReport: vi.fn(), writeHtmlReport: vi.fn() }));
const domain = vi.hoisted(() => ({ toReports: vi.fn(), mergeReports: vi.fn() }));
const git = vi.hoisted(() => ({ at: vi.fn((path: string) => `/repo/${path}`) }));
const io = vi.hoisted(() => ({ out: { success: vi.fn() } }));

vi.mock("./adapters/nx.ts", () => projects);
vi.mock("./adapters/files.ts", () => files);
vi.mock("./domain/discover.ts", () => domain);
vi.mock("./domain/merge.ts", () => domain);
vi.mock("../shared/adapters/git.ts", () => git);
vi.mock("../shared/adapters/io.ts", () => io);

import { main } from "./main.ts";

beforeEach(() => {
    vi.clearAllMocks();
    projects.projectsWithCoverage.mockResolvedValue([{ name: "ui", root: "packages/ui", outputs: ["coverage"] }]);
    domain.toReports.mockReturnValue([{ name: "ui", coverageFinal: "packages/ui/coverage/coverage-final.json" }]);
    files.loadReport.mockReturnValue({ files: {} });
    domain.mergeReports.mockReturnValue("coverage-map");
});

describe("coverage report main", () => {
    it("loads, merges and writes an HTML report for every discovered project", async () => {
        await main();

        expect(domain.mergeReports).toHaveBeenCalledWith([{ name: "ui", data: { files: {} } }]);
        expect(files.writeHtmlReport).toHaveBeenCalledWith("/repo/coverage", "coverage-map");
        expect(io.out.success).toHaveBeenCalledWith("Wrote /repo/coverage/index.html, merged from 1 projects.");
    });

    it("handles a workspace with no eligible coverage projects", async () => {
        projects.projectsWithCoverage.mockResolvedValue([]);
        domain.toReports.mockReturnValue([]);

        await main();

        expect(domain.mergeReports).toHaveBeenCalledWith([]);
        expect(io.out.success).toHaveBeenCalledWith("Wrote /repo/coverage/index.html, merged from 0 projects.");
    });

    it("passes missing reports through to the merge layer instead of hiding them", async () => {
        files.loadReport.mockReturnValue(undefined);
        domain.toReports.mockReturnValue([
            { name: "ui", coverageFinal: "ui/coverage-final.json" },
            { name: "api", coverageFinal: "api/coverage-final.json" },
        ]);

        await main();

        expect(domain.mergeReports).toHaveBeenCalledWith([
            { name: "ui", data: undefined },
            { name: "api", data: undefined },
        ]);
    });

    it("leaves merge errors visible while the caller can still clean up its own run", async () => {
        domain.mergeReports.mockImplementation(() => {
            throw new Error("missing coverage");
        });

        await expect(main()).rejects.toThrow("missing coverage");
        expect(files.writeHtmlReport).not.toHaveBeenCalled();
    });
});
