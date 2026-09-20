import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
    collectGraph: vi.fn(),
    collectCoverage: vi.fn(),
    collectMetrics: vi.fn(),
    collectDeps: vi.fn(),
    collectDocs: vi.fn(),
    collectScorecards: vi.fn(),
    git: vi.fn(),
    writes: [] as { path: string, value: unknown }[],
    originalExitCode: undefined as typeof process.exitCode,
}));
const fs = vi.hoisted(() => ({ mkdir: vi.fn(), writeFile: vi.fn() }));

vi.mock("node:fs/promises", () => fs);
vi.mock("../lib/paths.ts", () => ({ SCHEMA_VERSION: 7, SNAPSHOT_DIR: "/tmp/developer-portal-snapshot" }));
vi.mock("../lib/run.ts", () => ({
    git: state.git,
    tryRun: async <T>(task: () => Promise<T>) => {
        try {
            return { ok: true as const, value: await task() };
        }
        catch (cause) {
            return { ok: false as const, error: cause instanceof Error ? cause.message : String(cause) };
        }
    },
}));
vi.mock("./graph.ts", () => ({ collectGraph: state.collectGraph }));
vi.mock("./coverage.ts", () => ({ collectCoverage: state.collectCoverage }));
vi.mock("./metrics.ts", () => ({ collectMetrics: state.collectMetrics }));
vi.mock("./deps.ts", () => ({ collectDeps: state.collectDeps }));
vi.mock("./docs.ts", () => ({ collectDocs: state.collectDocs }));
vi.mock("./scorecards.ts", () => ({ collectScorecards: state.collectScorecards }));

const projects = { generatedAt: "generated", projects: [{ name: "@monorepo/ui", root: "packages/ui" }] };
const coverage = { generatedAt: "generated", totals: null, report: false, projects: [] };

function successfulCollectors(): void {
    state.collectGraph.mockImplementation(async (generatedAt: string) => ({ ...projects, generatedAt }));
    state.collectCoverage.mockImplementation(async (_projects: unknown, generatedAt: string) => ({ ...coverage, generatedAt }));
    state.collectMetrics.mockImplementation(async (_projects: unknown, _coverage: unknown, generatedAt: string) => ({ generatedAt, commit: "commit", branch: "branch", projects: [], invariantFindings: [], conventionalCommitRate: null, commitsSinceLastRelease: null }));
    state.collectDeps.mockImplementation(async (generatedAt: string) => ({ generatedAt, vulnerabilities: null, totalDependencies: null, advisories: [], outdated: null }));
    state.collectDocs.mockImplementation(async (_roots: unknown, generatedAt: string) => ({ generatedAt, pages: [], brokenLinkCount: 0 }));
    state.collectScorecards.mockImplementation(async (generatedAt: string) => ({ generatedAt, reviews: [] }));
}

async function runCollector(): Promise<void> {
    vi.resetModules();
    await import("./index.ts");
}

beforeEach(() => {
    vi.clearAllMocks();
    state.writes = [];
    state.originalExitCode = process.exitCode;
    process.exitCode = undefined;
    state.git.mockImplementation(async (args: string[]) => args[1] === "--short" ? "abc123\n" : "feature/collect\n");
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockImplementation(async (path: string, source: string) => {
        state.writes.push({ path, value: JSON.parse(source) });
    });
    successfulCollectors();
});

afterEach(() => {
    process.exitCode = state.originalExitCode;
    vi.restoreAllMocks();
});

describe("collector entrypoint", () => {
    it("fails on graph errors, writes only the failure manifest, and skips dependent collectors", async () => {
        state.collectGraph.mockRejectedValue(new Error("graph unavailable"));

        await runCollector();

        expect(process.exitCode).toBe(1);
        expect(state.collectCoverage).not.toHaveBeenCalled();
        expect(state.collectMetrics).not.toHaveBeenCalled();
        expect(state.collectDocs).not.toHaveBeenCalled();
        expect(state.collectScorecards).not.toHaveBeenCalled();
        expect(state.writes).toHaveLength(1);
        expect(state.writes[0]).toMatchObject({ path: "/tmp/developer-portal-snapshot/manifest.json", value: { schemaVersion: 7, commit: "abc123", branch: "feature/collect", artifacts: { projects: { ok: false, error: "graph unavailable" } } } });
    });

    it("uses an explicit empty coverage fallback so metrics still run after coverage fails", async () => {
        state.collectCoverage.mockRejectedValue(new Error("coverage unavailable"));

        await runCollector();

        expect(state.collectMetrics).toHaveBeenCalledWith(projects.projects, { generatedAt: expect.any(String), totals: null, report: false, projects: [] }, expect.any(String));
        expect(state.writes.map(({ path }) => path.split("/").at(-1))).toEqual(["projects.json", "metrics.json", "deps.json", "docs.json", "scorecards.json", "manifest.json"]);
        expect(state.writes.find(({ path }) => path.endsWith("coverage.json"))).toBeUndefined();
    });

    it("records independent collector failures while writing each successful artifact under its own name", async () => {
        state.collectMetrics.mockRejectedValue(new Error("metrics unavailable"));
        state.collectDeps.mockRejectedValue(new Error("deps unavailable"));
        state.collectDocs.mockRejectedValue(new Error("docs unavailable"));
        state.collectScorecards.mockRejectedValue(new Error("scorecards unavailable"));

        await runCollector();

        expect(state.writes.map(({ path }) => path.split("/").at(-1))).toEqual(["projects.json", "coverage.json", "manifest.json"]);
        const manifest = state.writes[state.writes.length - 1]!.value as { artifacts: Record<string, { ok: boolean, error?: string }> };
        expect(manifest.artifacts).toEqual({
            projects: { generatedAt: expect.any(String), ok: true },
            coverage: { generatedAt: expect.any(String), ok: true },
            metrics: { generatedAt: expect.any(String), ok: false, error: "metrics unavailable" },
            deps: { generatedAt: expect.any(String), ok: false, error: "deps unavailable" },
            docs: { generatedAt: expect.any(String), ok: false, error: "docs unavailable" },
            scorecards: { generatedAt: expect.any(String), ok: false, error: "scorecards unavailable" },
        });
    });

    it("writes the manifest last with shared timestamp, commit and branch across every artifact", async () => {
        await runCollector();

        expect(state.writes.at(-1)?.path).toBe("/tmp/developer-portal-snapshot/manifest.json");
        const artifactWrites = state.writes.slice(0, 6);
        const manifestWrite = state.writes[state.writes.length - 1]!;
        const generatedAt = (manifestWrite.value as { generatedAt: string }).generatedAt;

        expect(artifactWrites.map((write) => (write.value as { generatedAt: string }).generatedAt)).toEqual([
            generatedAt, generatedAt, generatedAt, generatedAt, generatedAt, generatedAt,
        ]);
        expect(manifestWrite.value).toMatchObject({ commit: "abc123", branch: "feature/collect", artifacts: expect.any(Object) });
        expect(state.collectGraph).toHaveBeenCalledWith(generatedAt);
        expect(state.collectCoverage).toHaveBeenCalledWith(projects.projects, generatedAt);
        expect(state.collectDocs).toHaveBeenCalledWith(["packages/ui"], generatedAt);
        expect(state.collectScorecards).toHaveBeenCalledWith(generatedAt);
    });
});
