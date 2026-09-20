import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const gh = vi.hoisted(() => ({ createPr: vi.fn(), enableAutoMerge: vi.fn(), prUrlForBranch: vi.fn(), waitForMerge: vi.fn(), watchChecks: vi.fn() }));
const git = vi.hoisted(() => ({ checkoutMaster: vi.fn(), currentBranch: vi.fn(), pullMaster: vi.fn(), push: vi.fn() }));
const io = vi.hoisted(() => ({
    out: {
        begin: vi.fn(), end: vi.fn(), info: vi.fn(), note: vi.fn(),
        spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
    },
}));
vi.mock("./adapters/gh.ts", () => gh);
vi.mock("./adapters/git.ts", () => git);
vi.mock("../shared/adapters/io.ts", () => io);

import { main } from "./main.ts";

const originalExitCode = process.exitCode;

beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    git.currentBranch.mockReturnValue("feature/demo");
    gh.prUrlForBranch.mockReturnValue("https://example.test/pr/1");
    gh.watchChecks.mockReturnValue({ passed: true, output: "" });
    gh.waitForMerge.mockReturnValue(true);
});

afterEach(() => {
    process.exitCode = originalExitCode;
});

describe("ship main", () => {
    it("refuses to ship from master", () => {
        git.currentBranch.mockReturnValue("master");

        expect(() => main()).toThrow("On master — nothing to ship from here.");
        expect(git.push).not.toHaveBeenCalled();
    });

    it("reuses an existing PR and returns to master only after a completed merge", () => {
        main();

        expect(git.push).toHaveBeenCalledWith("feature/demo");
        expect(gh.createPr).not.toHaveBeenCalled();
        expect(gh.enableAutoMerge).toHaveBeenCalledWith("https://example.test/pr/1", "merge");
        expect(git.checkoutMaster).toHaveBeenCalledOnce();
        expect(git.pullMaster).toHaveBeenCalledOnce();
        expect(process.exitCode).toBeUndefined();
    });

    it("creates a missing PR and leaves the branch when merge remains queued", () => {
        gh.prUrlForBranch.mockReturnValue(undefined);
        gh.createPr.mockReturnValue("https://example.test/pr/2");
        gh.waitForMerge.mockReturnValue(false);

        main();

        expect(gh.createPr).toHaveBeenCalledOnce();
        expect(git.checkoutMaster).not.toHaveBeenCalled();
        expect(io.out.end).toHaveBeenCalledWith("✅ pipelines green, merge queued — should land shortly.");
    });

    it("reports failed checks and sets exit code without synchronizing master", () => {
        gh.watchChecks.mockReturnValue({ passed: false, output: "check table" });

        main();

        expect(io.out.note).toHaveBeenCalledWith("check table", "Checks");
        expect(process.exitCode).toBe(1);
        expect(gh.waitForMerge).not.toHaveBeenCalled();
        expect(git.checkoutMaster).not.toHaveBeenCalled();
    });
});
