import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parse } from "../shared/domain/cli.ts";
import { CancelledError } from "../shared/errors.ts";

const prompts = vi.hoisted(() => ({
    autocomplete: vi.fn(),
    confirm: vi.fn(),
    select: vi.fn(),
    text: vi.fn(),
}));
const state = vi.hoisted(() => ({ cancel: Symbol("cancel") }));
const gh = vi.hoisted(() => ({
    assignToMe: vi.fn(),
    developBranch: vi.fn(),
    isOnline: vi.fn(),
    listIssues: vi.fn(),
    listProjects: vi.fn(),
    moveToInProgress: vi.fn(),
    viewThread: vi.fn(),
}));
const git = vi.hoisted(() => ({ branchForIssue: vi.fn(), checkout: vi.fn() }));
const io = vi.hoisted(() => ({
    requireTerminal: vi.fn(),
    out: {
        begin: vi.fn(),
        end: vi.fn(),
        info: vi.fn(),
        note: vi.fn(),
        warn: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
        spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn(), message: vi.fn() })),
    },
}));
vi.mock("@clack/prompts", () => prompts);
vi.mock("./adapters/gh.ts", () => gh);
vi.mock("./adapters/git.ts", () => git);
vi.mock("../shared/adapters/io.ts", () => io);
vi.mock("../shared/adapters/prompts.ts", () => ({
    orExit: (value: unknown, message: string) => {
        if (value === state.cancel) throw new CancelledError(message);
        return value;
    },
}));

import { pick } from "./pick.ts";

const PROJECT = { title: "Roadmap", number: 7, url: "project" };
const ISSUE = { number: 42, title: "Fix picker", url: "issue", labels: ["bug"] };
const originalExitCode = process.exitCode;

beforeEach(() => {
    vi.resetAllMocks();
    process.exitCode = undefined;
    gh.listProjects.mockReturnValue([PROJECT]);
    gh.isOnline.mockReturnValue(true);
    gh.listIssues.mockReturnValue([ISSUE]);
    prompts.select.mockResolvedValueOnce("Roadmap").mockResolvedValueOnce("feature");
    prompts.autocomplete.mockResolvedValue(ISSUE);
    prompts.text.mockResolvedValue("Fix picker");
    prompts.confirm.mockResolvedValue(true);
    git.branchForIssue.mockReturnValue(undefined);
});

afterEach(() => {
    process.exitCode = originalExitCode;
});

describe("issue pick", () => {
    it("selects a live issue, creates its linked branch, assigns it and moves it on the board", async () => {
        await pick();

        expect(gh.developBranch).toHaveBeenCalledWith(42, "feature/roadmap/42-fix-picker");
        expect(gh.assignToMe).toHaveBeenCalledWith(42);
        expect(gh.moveToInProgress).toHaveBeenCalledWith(PROJECT, ISSUE);
        expect(io.out.end).toHaveBeenCalledWith("feature/roadmap/42-fix-picker");
    });

    it("uses cached projects and issues when gh is offline", async () => {
        gh.listProjects.mockReturnValueOnce([]).mockReturnValueOnce([PROJECT]);
        gh.isOnline.mockReturnValue(false);

        await pick();

        expect(gh.listProjects).toHaveBeenNthCalledWith(1);
        expect(gh.listProjects).toHaveBeenNthCalledWith(2, true);
        expect(gh.listIssues).toHaveBeenCalledWith("Roadmap", true);
        expect(io.out.warn).toHaveBeenCalledWith(expect.stringContaining("cached"));
    });

    it("falls back to cached issues after an offline live issue request fails", async () => {
        gh.listIssues
            .mockImplementationOnce(() => {
                throw new Error("offline");
            })
            .mockReturnValueOnce([ISSUE]);
        gh.isOnline.mockReturnValue(false);

        await pick();

        expect(gh.listIssues).toHaveBeenNthCalledWith(1, "Roadmap", false);
        expect(gh.listIssues).toHaveBeenNthCalledWith(2, "Roadmap", true);
        const issuePrompt = prompts.autocomplete.mock.calls[0]?.[0] as {
            filter: (search: string, option: { value: unknown }) => boolean;
        };
        expect(issuePrompt.filter("42", { value: ISSUE })).toBe(true);
    });

    it("turns an online issue lookup failure into the scope guidance", async () => {
        gh.listIssues.mockImplementation(() => {
            throw new Error("unauthorized");
        });

        await expect(pick()).rejects.toThrow("`project` scope");
    });

    it("returns without prompts when neither live nor cached projects exist", async () => {
        gh.listProjects.mockReturnValue([]);
        gh.isOnline.mockReturnValue(false);

        await pick();

        expect(prompts.select).not.toHaveBeenCalled();
    });

    it("returns to project selection when the issue picker chooses Back", async () => {
        let projectSelections = 0;
        prompts.select.mockReset();
        let selectCalls = 0;
        prompts.select.mockImplementation(() => {
            selectCalls++;
            if (selectCalls < 3) projectSelections++;
            return selectCalls < 3 ? "Roadmap" : "feature";
        });
        let autocompleteCalls = 0;
        prompts.autocomplete.mockImplementation((options: { options: { value: unknown }[] }) => {
            autocompleteCalls++;
            return autocompleteCalls === 1 ? options.options[0]!.value : ISSUE;
        });

        await pick();

        expect(projectSelections).toBe(2);
        expect(gh.developBranch).toHaveBeenCalledOnce();
    });

    it("checks out and resumes an existing branch, with assignment and board failures only warning", async () => {
        git.branchForIssue.mockReturnValue("feature/roadmap/42-existing");
        gh.assignToMe.mockImplementation(() => {
            throw new Error("assignment");
        });
        gh.moveToInProgress.mockImplementation(() => {
            throw new Error("board");
        });

        await pick();

        expect(git.checkout).toHaveBeenCalledWith("feature/roadmap/42-existing");
        expect(gh.developBranch).not.toHaveBeenCalled();
        expect(io.out.warn).toHaveBeenCalledTimes(2);
    });

    it("continues with a new branch when an existing branch is rejected", async () => {
        git.branchForIssue.mockReturnValue("feature/roadmap/42-existing");
        prompts.confirm.mockResolvedValueOnce(false);

        await pick();

        expect(gh.developBranch).toHaveBeenCalled();
    });

    it("reports gh issue develop failures after the branch prompt", async () => {
        gh.developBranch.mockImplementation(() => {
            throw new Error("develop");
        });

        await expect(pick()).rejects.toThrow("develop");
        expect(io.out.error).toHaveBeenCalledWith("gh issue develop failed.");
    });

    it("validates branch titles before asking gh to create the branch", async () => {
        await pick();

        const branchPrompt = prompts.text.mock.calls[0]?.[0] as {
            validate: (value: string) => string | undefined;
        };
        expect(branchPrompt.validate("!!!")).toBe("Needs at least one letter or digit.");
    });

    it("turns cancellation at each prompt boundary into a clean cancellation", async () => {
        prompts.select.mockReset();
        prompts.select.mockResolvedValue(state.cancel);
        await expect(pick()).rejects.toThrow(
            new CancelledError("Cancelled — still on the same branch."),
        );

        vi.clearAllMocks();
        gh.listProjects.mockReturnValue([PROJECT]);
        prompts.select.mockResolvedValue("Roadmap");
        prompts.autocomplete.mockResolvedValue(state.cancel);
        await expect(pick()).rejects.toThrow(
            new CancelledError("Cancelled — still on the same branch."),
        );
    });
});

describe("issue pick <number>", () => {
    const THREAD = {
        ...ISSUE,
        state: "OPEN",
        body: "",
        assignees: [],
        comments: [],
        boards: [{ title: "Roadmap", status: "Todo" }],
    };
    const args = (...argv: string[]) => parse(argv);

    beforeEach(() => {
        gh.viewThread.mockReturnValue(THREAD);
    });

    it("branches, assigns and moves the issue without a single prompt", async () => {
        await pick(args("42"));

        expect(gh.developBranch).toHaveBeenCalledWith(42, "fix/roadmap/42-fix-picker");
        expect(gh.assignToMe).toHaveBeenCalledWith(42);
        expect(gh.moveToInProgress).toHaveBeenCalledWith(PROJECT, ISSUE);
        expect(io.requireTerminal).not.toHaveBeenCalled();
        expect(prompts.select).not.toHaveBeenCalled();
    });

    it("lets the flags override the label, the board and the branch title", async () => {
        gh.listProjects.mockReturnValue([{ ...PROJECT, title: "DX" }]);

        await pick(args("#42", "--type=hotfix", "--project=DX", "--title=Short"));

        expect(gh.developBranch).toHaveBeenCalledWith(42, "hotfix/dx/42-short");
    });

    it("refuses to guess a branch type for a spike, and names the flag that settles it", async () => {
        gh.viewThread.mockReturnValue({ ...THREAD, labels: ["spike"] });

        await expect(pick(args("42"))).rejects.toThrow("--type=<feature|fix|hotfix|release>");
        expect(gh.developBranch).not.toHaveBeenCalled();
    });

    it("names the valid types when --type is misspelt, rather than blaming the label", async () => {
        await expect(pick(args("42", "--type=feat"))).rejects.toThrow(
            '"feat" isn\'t a branch type',
        );
        expect(gh.developBranch).not.toHaveBeenCalled();
    });

    it("refuses a title that slugs to nothing, which would leave the branch name without one", async () => {
        await expect(pick(args("42", "--title=???"))).rejects.toThrow("--title=<branch title>");
        expect(gh.developBranch).not.toHaveBeenCalled();
    });

    it("rejects an argument that isn't an issue before calling gh", async () => {
        await expect(pick(args("feature"))).rejects.toThrow("isn't an issue number or URL");
        expect(gh.viewThread).not.toHaveBeenCalled();
    });

    it("still branches when --project names no open board, leaving the board column alone", async () => {
        await pick(args("42", "--project=Archived"));

        expect(gh.developBranch).toHaveBeenCalledWith(42, "fix/archived/42-fix-picker");
        expect(gh.moveToInProgress).not.toHaveBeenCalled();
        expect(io.out.warn).toHaveBeenCalledWith(expect.stringContaining('"Archived"'));
    });

    it("asks for --project when the issue is on no board, since the branch name needs one", async () => {
        gh.viewThread.mockReturnValue({ ...THREAD, boards: [] });

        await expect(pick(args("42"))).rejects.toThrow("--project=<board title>");
    });

    it("checks out an existing branch for the issue instead of creating a second one", async () => {
        git.branchForIssue.mockReturnValue("feature/roadmap/42-old-name");

        await pick(args("42"));

        expect(git.checkout).toHaveBeenCalledWith("feature/roadmap/42-old-name");
        expect(gh.developBranch).not.toHaveBeenCalled();
    });

    it("resumes an existing branch even when the issue has left every board", async () => {
        git.branchForIssue.mockReturnValue("feature/roadmap/42-old-name");
        gh.viewThread.mockReturnValue({ ...THREAD, boards: [] });

        await pick(args("42"));

        expect(git.checkout).toHaveBeenCalledWith("feature/roadmap/42-old-name");
        expect(gh.assignToMe).toHaveBeenCalledWith(42);
        expect(gh.moveToInProgress).not.toHaveBeenCalled();
    });

    it("prompts only after confirming there is a terminal to prompt in", async () => {
        io.requireTerminal.mockImplementation(() => {
            throw new Error("No terminal");
        });

        await expect(pick()).rejects.toThrow("No terminal");
        expect(prompts.select).not.toHaveBeenCalled();
    });
});
