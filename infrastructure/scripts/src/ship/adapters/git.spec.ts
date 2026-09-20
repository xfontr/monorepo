import { beforeEach, describe, expect, it, vi } from "vitest";

const gitApi = vi.hoisted(() => ({ git: vi.fn() }));
vi.mock("../../shared/adapters/git.ts", () => gitApi);

import { checkoutMaster, currentBranch, pullMaster, push } from "./git.ts";

beforeEach(() => vi.clearAllMocks());

describe("ship git adapter", () => {
    it("reads the current branch and performs master synchronization", () => {
        gitApi.git.mockReturnValue("feature/demo");

        expect(currentBranch()).toBe("feature/demo");
        checkoutMaster();
        pullMaster();

        expect(gitApi.git).toHaveBeenNthCalledWith(2, "checkout", "master");
        expect(gitApi.git).toHaveBeenNthCalledWith(3, "pull", "origin", "master");
    });

    it("translates push failures into the user-facing expected error", () => {
        gitApi.git.mockImplementation(() => {
            throw new Error("rejected");
        });

        expect(() => push("feature/demo")).toThrow("Push rejected");
        expect(() => push("--delete")).toThrow("Push rejected");
    });
});
