import { beforeEach, describe, expect, it, vi } from "vitest";

const gitApi = vi.hoisted(() => ({ git: vi.fn() }));
vi.mock("../../shared/adapters/git.ts", () => gitApi);

import { branchForIssue, checkout, currentBranch } from "./git.ts";

beforeEach(() => vi.clearAllMocks());

describe("issue git adapter", () => {
    it("finds the first branch whose final path segment starts with the issue number", () => {
        gitApi.git.mockReturnValue("main\nfeature/roadmap/42-fix\nother/42-not-at-root\n");

        expect(branchForIssue(42)).toBe("feature/roadmap/42-fix");
    });

    it("returns no branch for unrelated refs and forwards checkout/current-branch calls", () => {
        gitApi.git.mockReturnValueOnce("main\nfeature/roadmap/41-fix\n").mockReturnValueOnce(undefined).mockReturnValueOnce("master");

        expect(branchForIssue(42)).toBeUndefined();
        checkout("feature/roadmap/42-fix");
        expect(currentBranch()).toBe("master");
        expect(gitApi.git).toHaveBeenNthCalledWith(2, "checkout", "feature/roadmap/42-fix");
        expect(gitApi.git).toHaveBeenNthCalledWith(3, "rev-parse", "--abbrev-ref", "HEAD");
    });
});
