import { describe, expect, it } from "vitest";
import { isEnvFile, parseWorktrees, preparedLine } from "./worktree.ts";

// Shape of `git worktree list --porcelain`, including a detached and a locked entry.
const PORCELAIN = `worktree /repo
HEAD cb796bce
branch refs/heads/master

worktree /repo/.claude/worktrees/agent-a1
HEAD 37de0354
detached

worktree /repo/.claude/worktrees/agent-a2
HEAD cb796bce
branch refs/heads/feature/huella-legal/247-materias
locked claude agent agent-a2
`;

describe("parseWorktrees", () => {
    it("keeps the main checkout first, so the caller can tell it apart from linked ones", () => {
        expect(parseWorktrees(PORCELAIN)).toEqual([
            { path: "/repo", branch: "master" },
            { path: "/repo/.claude/worktrees/agent-a1", branch: undefined },
            {
                path: "/repo/.claude/worktrees/agent-a2",
                branch: "feature/huella-legal/247-materias",
            },
        ]);
    });
});

describe("isEnvFile", () => {
    it.each([
        ["apps/huella-legal/.env", true],
        [".env.local", true],
        ["node_modules/some-dep/.env", false],
        [".claude/worktrees/agent-a1/", false],
        ["apps/huella-legal/env.ts", false],
    ])("treats %j as an env file to copy: %s", (path, expected) => {
        expect(isEnvFile(path)).toBe(expected);
    });
});

describe("preparedLine", () => {
    it("says when there was nothing to copy, so a missing .env isn't mistaken for a skipped step", () => {
        expect(preparedLine("/wt", [])).toBe("/wt: installed, no env files to copy");
    });
});
