import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const git = vi.hoisted(() => ({ worktreeList: vi.fn(), envFiles: vi.fn() }));
const files = vi.hoisted(() => ({
    canonical: vi.fn((path: string) => path),
    copyMissing: vi.fn(),
    isInstalled: vi.fn(),
}));
const pnpm = vi.hoisted(() => ({ install: vi.fn() }));
const io = vi.hoisted(() => ({ out: { success: vi.fn() } }));
vi.mock("./adapters/git.ts", () => git);
vi.mock("./adapters/files.ts", () => files);
vi.mock("./adapters/pnpm.ts", () => pnpm);
vi.mock("../shared/adapters/io.ts", () => io);

import { main } from "./main.ts";

const PORCELAIN = `worktree /repo
branch refs/heads/master

worktree /repo/.claude/worktrees/a1
detached

worktree /repo/.claude/worktrees/a2
detached
`;

const args = (...positionals: string[]) => ({ flags: new Set<string>(), positionals });

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("INIT_CWD", "/repo");
    git.worktreeList.mockReturnValue(PORCELAIN);
    git.envFiles.mockReturnValue(["apps/huella-legal/.env"]);
    files.copyMissing.mockReturnValue(["apps/huella-legal/.env"]);
    pnpm.install.mockReturnValue({ status: 0, stdout: "", stderr: "" });
});

afterEach(() => {
    vi.unstubAllEnvs();
});

describe("worktree main", () => {
    it("resolves the path from where the command was typed, not the package pnpm runs it in", () => {
        main(args(".claude/worktrees/a1"));

        expect(files.copyMissing).toHaveBeenCalledWith("/repo", "/repo/.claude/worktrees/a1", [
            "apps/huella-legal/.env",
        ]);
        expect(pnpm.install).toHaveBeenCalledWith("/repo/.claude/worktrees/a1");
        expect(io.out.success).toHaveBeenCalledWith(
            "/repo/.claude/worktrees/a1: installed, copied apps/huella-legal/.env",
        );
    });

    it("refuses the main checkout, so it never installs over the one being worked in", () => {
        expect(() => main(args("."))).toThrow("/repo is not a linked worktree");
        expect(files.copyMissing).not.toHaveBeenCalled();
        expect(pnpm.install).not.toHaveBeenCalled();
    });

    it("lists only the linked worktrees still missing node_modules when no path is given", () => {
        files.isInstalled.mockImplementation((path: string) => path.endsWith("a1"));

        expect(() => main(args())).toThrow(
            "Linked worktrees with no node_modules:\n  /repo/.claude/worktrees/a2",
        );
    });

    it("fails with the install's error lines rather than reporting a half-prepared worktree", () => {
        pnpm.install.mockReturnValue({
            status: 1,
            stdout: "Progress: resolved 1",
            stderr: "ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with frozen-lockfile",
        });

        expect(() => main(args(".claude/worktrees/a1"))).toThrow("ERR_PNPM_OUTDATED_LOCKFILE");
        expect(io.out.success).not.toHaveBeenCalled();
    });
});
