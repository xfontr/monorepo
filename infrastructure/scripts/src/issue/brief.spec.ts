import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IssueThread } from "./domain/brief.ts";

const gh = vi.hoisted(() => ({ viewThread: vi.fn(), issueStatus: vi.fn() }));
const git = vi.hoisted(() => ({ currentBranch: vi.fn() }));
const files = vi.hoisted(() => ({
    decisions: vi.fn(() => []),
    exists: vi.fn(() => true),
    projectDirs: vi.fn(() => ["apps/huella-legal", "infrastructure/scripts"]),
}));
const io = vi.hoisted(() => ({ out: { info: vi.fn() } }));
vi.mock("./adapters/gh.ts", () => gh);
vi.mock("./adapters/git.ts", () => git);
vi.mock("./adapters/files.ts", () => files);
vi.mock("../shared/adapters/io.ts", () => io);

import { brief } from "./brief.ts";

const thread = (number: number): IssueThread => ({
    number,
    title: "Title",
    state: "OPEN",
    url: "url",
    body: "**Blocked by:** #9",
    labels: [],
    assignees: [],
    boards: [],
    comments: [],
});

const args = (...positionals: string[]) => ({ flags: new Set<string>(), positionals });

const printed = (): string => String(io.out.info.mock.calls[0]?.[0]);

beforeEach(() => {
    vi.clearAllMocks();
    gh.viewThread.mockImplementation(thread);
    gh.issueStatus.mockReturnValue({ number: 9, title: "Blocker", state: "CLOSED" });
    git.currentBranch.mockReturnValue("feature/huella-legal/42-thing");
});

describe("issue brief", () => {
    it("reads the issue off the branch when none is named", () => {
        brief(args());

        expect(gh.viewThread).toHaveBeenCalledWith(42);
        expect(printed()).toContain("apps/huella-legal — read apps/huella-legal/AGENTS.md");
    });

    it("ignores the branch's board for another issue, whose project it says nothing about", () => {
        brief(args("#7"));

        expect(gh.viewThread).toHaveBeenCalledWith(7);
        expect(printed()).not.toContain("apps/huella-legal");
    });

    it("names both ways to call it when there's no number and the branch has none", () => {
        git.currentBranch.mockReturnValue("master");

        expect(() => brief(args())).toThrow("pnpm issue:brief <number>");
        expect(gh.viewThread).not.toHaveBeenCalled();
    });

    it("still prints the brief when a blocker can't be read", () => {
        gh.issueStatus.mockImplementation(() => {
            throw new Error("Could not resolve to an issue");
        });

        brief(args());

        expect(printed()).toContain("#9 (couldn't read it) — UNKNOWN");
    });
});
