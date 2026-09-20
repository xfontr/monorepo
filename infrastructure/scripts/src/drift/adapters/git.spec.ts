import { beforeEach, describe, expect, it, vi } from "vitest";

const gitApi = vi.hoisted(() => ({ at: vi.fn((...parts: string[]) => `/repo/${parts.join("/")}`), git: vi.fn() }));
vi.mock("../../shared/adapters/git.ts", () => gitApi);

import { changedFiles, diffNameStatus, diffNumstat, diffText, lastMdCommitEpochSeconds, mergeBase } from "./git.ts";

beforeEach(() => vi.clearAllMocks());

describe("drift git adapter", () => {
    it("uses validated refs for merge bases and every diff range", () => {
        gitApi.git
            .mockReturnValueOnce("base")
            .mockReturnValueOnce("a\n\nb\n")
            .mockReturnValueOnce("1\t2\tfile\n")
            .mockReturnValueOnce("M\tfile\n")
            .mockReturnValueOnce("diff text")
            .mockReturnValueOnce("123");

        expect(mergeBase("master")).toBe("base");
        expect(changedFiles("master", "HEAD")).toEqual(["a", "b"]);
        expect(diffNumstat("master", "HEAD", "packages/demo")).toEqual(["1\t2\tfile"]);
        expect(diffNameStatus("master", "HEAD", "packages/demo")).toEqual(["M\tfile"]);
        expect(diffText("master", "HEAD", "packages/demo")).toBe("diff text");
        expect(lastMdCommitEpochSeconds("packages/demo")).toBe("123");
        expect(gitApi.git).toHaveBeenNthCalledWith(2, "diff", "--name-only", "master..HEAD");
        expect(gitApi.git).toHaveBeenNthCalledWith(3, "diff", "--numstat", "master..HEAD", "--", "/repo/packages/demo");
    });

    it("rejects flag-like refs before constructing a range", () => {
        expect(() => changedFiles("--output", "HEAD")).toThrow(/base/);
        expect(() => mergeBase("--all")).toThrow(/ref/);
        expect(gitApi.git).not.toHaveBeenCalled();
    });
});
