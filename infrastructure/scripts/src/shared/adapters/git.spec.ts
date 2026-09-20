import { beforeEach, describe, expect, it, vi } from "vitest";

const exec = vi.hoisted(() => ({ run: vi.fn() }));

vi.mock("./exec.ts", () => ({ run: exec.run }));

import { at, git, repoRoot } from "./git.ts";

beforeEach(() => vi.clearAllMocks());

describe("git and repository paths", () => {
    it("memoizes the repository root and resolves paths from it", () => {
        exec.run.mockReturnValue("/repo");

        expect(git("status", "--short")).toBe("/repo");
        expect(repoRoot()).toBe("/repo");
        expect(repoRoot()).toBe("/repo");
        expect(at("docs", "README.md")).toBe("/repo/docs/README.md");
        expect(exec.run).toHaveBeenCalledTimes(2);
        expect(exec.run).toHaveBeenCalledWith("git", ["status", "--short"]);
    });
});
