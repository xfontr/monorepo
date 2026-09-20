import { beforeEach, describe, expect, it, vi } from "vitest";

const child = vi.hoisted(() => ({ spawn: vi.fn() }));
const fs = vi.hoisted(() => ({
    closeSync: vi.fn(), mkdtempSync: vi.fn(() => "/tmp/coverage-run"), openSync: vi.fn(() => 3),
    readFileSync: vi.fn(), rmSync: vi.fn(),
}));
const moduleApi = vi.hoisted(() => ({ createRequire: vi.fn(() => ({ resolve: vi.fn(() => "/repo/nx.js") })) }));
vi.mock("node:child_process", () => child);
vi.mock("node:fs", () => fs);
vi.mock("node:module", () => moduleApi);

import { projectsWithCoverage } from "./nx.ts";

const spawnProcess = () => {
    const handlers: Record<string, (value?: unknown) => void> = {};
    return {
        stderr: { on: vi.fn((event: string, handler: (value?: unknown) => void) => { handlers[`stderr:${event}`] = handler; }) },
        on: vi.fn((event: string, handler: (value?: unknown) => void) => { handlers[event] = handler; }),
        finish: (code: number) => handlers.close?.(code),
        fail: () => handlers.error?.(new Error("spawn failed")),
    };
};

beforeEach(() => {
    vi.clearAllMocks();
    fs.readFileSync.mockReturnValue(JSON.stringify(["@monorepo/ui"]));
});

describe("projectsWithCoverage", () => {
    it("discovers project outputs through Nx and cleans its temporary output", async () => {
        const process = spawnProcess();
        child.spawn.mockReturnValue(process);
        fs.readFileSync.mockReturnValueOnce(JSON.stringify(["@monorepo/ui"])).mockReturnValueOnce(
            JSON.stringify({ root: "packages/ui", targets: { "test:coverage": { outputs: ["{projectRoot}/coverage"] } } }),
        );

        const result = projectsWithCoverage();
        process.finish(0);
        await Promise.resolve();
        const projectProcess = child.spawn.mock.results[1]?.value as ReturnType<typeof spawnProcess>;
        projectProcess.finish(0);
        await expect(result).resolves.toEqual([
            { name: "@monorepo/ui", root: "packages/ui", outputs: ["{projectRoot}/coverage"] },
        ]);
        expect(fs.rmSync).toHaveBeenCalledWith("/tmp/coverage-run", { recursive: true, force: true });
    });

    it("rejects with stderr when Nx exits unsuccessfully", async () => {
        const process = spawnProcess();
        child.spawn.mockReturnValue(process);
        fs.readFileSync.mockReturnValue(JSON.stringify(["@monorepo/ui"]));
        const result = projectsWithCoverage();
        process.stderr.on.mock.calls[0]?.[1](Buffer.from("nx failed"));
        process.finish(1);

        await expect(result).rejects.toThrow("nx failed");
        expect(fs.rmSync).toHaveBeenCalledWith("/tmp/coverage-run", { recursive: true, force: true });
    });

    it("uses the exit status when Nx fails without stderr", async () => {
        const process = spawnProcess();
        child.spawn.mockReturnValue(process);
        fs.readFileSync.mockReturnValue(JSON.stringify(["@monorepo/ui"]));
        const result = projectsWithCoverage();
        process.finish(7);

        await expect(result).rejects.toThrow("nx show projects --with-target test:coverage --json exited with 7");
    });
});
