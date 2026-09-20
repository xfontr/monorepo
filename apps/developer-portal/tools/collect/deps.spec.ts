import { beforeEach, describe, expect, it, vi } from "vitest";
import { collectDeps } from "./deps.ts";

const run = vi.hoisted(() => ({
    runAllowFailure: vi.fn(),
    tryRun: async <T>(task: () => Promise<T>) => {
        try {
            return { ok: true as const, value: await task() };
        }
        catch (cause) {
            return { ok: false as const, error: cause instanceof Error ? cause.message : String(cause) };
        }
    },
}));

vi.mock("../lib/run.ts", () => run);

const audit = {
    advisories: {
        "GHSA-1": {
            id: 101,
            title: "Prototype pollution",
            module_name: "some-package",
            severity: "high",
            patched_versions: ">=2.0.0",
            url: "https://example.test/advisory",
            findings: [{ paths: ["root>some-package"] }, { paths: ["root>other>some-package", "root>some-package"] }],
        },
    },
    metadata: {
        vulnerabilities: { info: 1, low: 2, moderate: 3, high: 4, critical: 5 },
        totalDependencies: 42,
    },
};

const outdated = {
    "some-package": {
        current: "1.0.0",
        wanted: "1.1.0",
        latest: "2.0.0",
        isDeprecated: false,
        dependentPackages: [{ name: "@monorepo/ui", location: "/Users/xifre/projects/monorepo/packages/ui" }],
    },
};

beforeEach(() => {
    vi.clearAllMocks();
    run.runAllowFailure.mockImplementation(async (_command: string, args: string[]) =>
        args.includes("audit") ? JSON.stringify(audit) : JSON.stringify(outdated));
});

describe("collectDeps", () => {
    it("normalizes audit metadata and flattens every advisory dependency path", async () => {
        await expect(collectDeps("2026-09-20T12:00:00.000Z")).resolves.toEqual({
            generatedAt: "2026-09-20T12:00:00.000Z",
            vulnerabilities: audit.metadata.vulnerabilities,
            totalDependencies: 42,
            advisories: [{
                id: 101,
                title: "Prototype pollution",
                moduleName: "some-package",
                severity: "high",
                patchedVersions: ">=2.0.0",
                url: "https://example.test/advisory",
                paths: ["root>some-package", "root>other>some-package", "root>some-package"],
            }],
            outdated: [{
                name: "some-package",
                current: "1.0.0",
                wanted: "1.1.0",
                latest: "2.0.0",
                isDeprecated: false,
                dependents: ["packages/ui"],
            }],
        });
    });

    it("keeps audit and outdated commands independent when both reads are requested", async () => {
        await collectDeps("now");

        expect(run.runAllowFailure).toHaveBeenCalledTimes(2);
        expect(run.runAllowFailure).toHaveBeenCalledWith("pnpm", ["pnpm", "audit", "--json"].slice(1), expect.any(String));
        expect(run.runAllowFailure).toHaveBeenCalledWith("pnpm", ["pnpm", "outdated", "-r", "--format", "json"].slice(1), expect.any(String));
    });

    it("preserves outdated packages while failed audit data stays explicitly null", async () => {
        run.runAllowFailure.mockImplementation(async (_command: string, args: string[]) => {
            if (args.includes("audit")) throw new Error("audit unavailable");

            return JSON.stringify(outdated);
        });

        await expect(collectDeps("now")).resolves.toMatchObject({
            vulnerabilities: null,
            totalDependencies: null,
            advisories: [],
            outdated: [expect.objectContaining({ name: "some-package" })],
        });
    });

    it("preserves audit data while a failed outdated read becomes null", async () => {
        run.runAllowFailure.mockImplementation(async (_command: string, args: string[]) => {
            if (args.includes("outdated")) throw new Error("outdated unavailable");

            return JSON.stringify(audit);
        });

        await expect(collectDeps("now")).resolves.toMatchObject({
            vulnerabilities: audit.metadata.vulnerabilities,
            totalDependencies: 42,
            advisories: [expect.objectContaining({ id: 101 })],
            outdated: null,
        });
    });

    it("parses usable JSON even when the command exits non-zero", async () => {
        run.runAllowFailure.mockResolvedValueOnce(JSON.stringify(audit)).mockResolvedValueOnce(JSON.stringify(outdated));

        await expect(collectDeps("now")).resolves.toMatchObject({ totalDependencies: 42, outdated: expect.any(Array) });
    });
});
