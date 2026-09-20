import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ghApi = vi.hoisted(() => ({ gh: vi.fn() }));
vi.mock("../../shared/adapters/gh.ts", () => ghApi);

import { createPr, enableAutoMerge, prUrlForBranch, waitForMerge, watchChecks } from "./gh.ts";

beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("PR adapter", () => {
    it("returns an existing PR URL and treats gh lookup failure as no PR", () => {
        ghApi.gh.mockReturnValueOnce("https://example.test/pr/1").mockImplementationOnce(() => {
            throw new Error("missing");
        });

        expect(prUrlForBranch("feature/demo")).toBe("https://example.test/pr/1");
        expect(prUrlForBranch("feature/new")).toBeUndefined();
        expect(ghApi.gh).toHaveBeenNthCalledWith(1, "pr", "view", "feature/demo", "--json", "url", "-q", ".url");
    });

    it("creates and enables auto-merge with validated arguments", () => {
        ghApi.gh.mockReturnValue("https://example.test/pr/2");

        expect(createPr()).toBe("https://example.test/pr/2");
        enableAutoMerge("https://example.test/pr/2", "merge");

        expect(ghApi.gh).toHaveBeenNthCalledWith(1, "pr", "create", "--fill");
        expect(ghApi.gh).toHaveBeenNthCalledWith(2, "pr", "merge", "--auto", "--merge", "https://example.test/pr/2");
        expect(() => enableAutoMerge("--url", "merge")).toThrow(/PR url/);
    });
});

describe("watchChecks", () => {
    it("retries a not-yet-registered check and returns the successful output", () => {
        ghApi.gh.mockImplementationOnce(() => {
            throw Object.assign(new Error("pending"), { stdout: Buffer.from("no checks reported") });
        }).mockReturnValueOnce("all green");
        vi.spyOn(Atomics, "wait").mockImplementation(() => "ok");

        expect(watchChecks("https://example.test/pr/1", Date.now() + 100)).toEqual({ passed: true, output: "all green" });
        expect(Atomics.wait).toHaveBeenCalledWith(expect.any(Int32Array), 0, 5000);
    });

    it("returns a failed check table without retrying ordinary failures", () => {
        ghApi.gh.mockImplementation(() => {
            throw Object.assign(new Error("failed"), { stdout: "table", stderr: "details" });
        });

        expect(watchChecks("https://example.test/pr/1", Date.now() - 1)).toEqual({ passed: false, output: "table\ndetails" });
    });
});

describe("waitForMerge", () => {
    it("polls until merged and returns false after the deadline", () => {
        ghApi.gh.mockReturnValueOnce("OPEN").mockReturnValueOnce("MERGED");
        vi.spyOn(Atomics, "wait").mockImplementation(() => "ok");

        expect(waitForMerge("https://example.test/pr/1", Date.now() + 1000)).toBe(true);
        expect(Atomics.wait).toHaveBeenCalledWith(expect.any(Int32Array), 0, 3000);

        ghApi.gh.mockReturnValue("OPEN");
        expect(waitForMerge("https://example.test/pr/1", Date.now() - 1)).toBe(false);
    });
});
