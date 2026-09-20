import { beforeEach, describe, expect, it, vi } from "vitest";
import { CancelledError } from "../shared/errors.ts";

const prompts = vi.hoisted(() => ({ autocomplete: vi.fn(), confirm: vi.fn(), select: vi.fn(), text: vi.fn() }));
const gh = vi.hoisted(() => ({ listLabels: vi.fn(), listProjects: vi.fn() }));
const sharedGh = vi.hoisted(() => ({ createIssue: vi.fn() }));
const git = vi.hoisted(() => ({ currentBranch: vi.fn() }));
const pickCommand = vi.hoisted(() => ({ pick: vi.fn() }));
const io = vi.hoisted(() => ({
    out: {
        begin: vi.fn(), end: vi.fn(), note: vi.fn(), cancelled: vi.fn(), warn: vi.fn(),
        spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
    },
}));

vi.mock("@clack/prompts", () => prompts);
vi.mock("./adapters/gh.ts", () => gh);
vi.mock("../shared/adapters/gh.ts", () => sharedGh);
vi.mock("./adapters/git.ts", () => git);
vi.mock("./pick.ts", () => pickCommand);
vi.mock("../shared/adapters/io.ts", () => io);
vi.mock("../shared/adapters/prompts.ts", () => ({ orExit: (value: unknown, message: string) => {
    if (typeof value === "symbol") throw new CancelledError(message);
    return value;
} }));

import { add } from "./add.ts";

beforeEach(() => {
    vi.clearAllMocks();
    gh.listProjects.mockReturnValue([{ title: "Roadmap", number: 1, url: "project" }]);
    gh.listLabels.mockReturnValue([{ name: "bug", description: "Broken" }]);
    prompts.select.mockResolvedValue("Roadmap");
    prompts.autocomplete.mockResolvedValue("bug");
    prompts.text.mockResolvedValueOnce("Fix title").mockResolvedValueOnce("Fix body");
    prompts.confirm.mockResolvedValue(true);
    sharedGh.createIssue.mockReturnValue("https://example.test/issues/1");
    git.currentBranch.mockReturnValue("feature/demo");
});

describe("issue add", () => {
    it("warns when no project list is available and omits None selections from the issue", async () => {
        gh.listProjects.mockReturnValue([]);
        prompts.autocomplete.mockResolvedValue("");
        prompts.text.mockReset();
        prompts.text.mockResolvedValueOnce("Title").mockResolvedValueOnce("Body");

        await add();

        expect(io.out.warn).toHaveBeenCalledWith(expect.stringContaining("No open projects"));
        expect(sharedGh.createIssue).toHaveBeenCalledWith({ title: "Title", body: "Body", label: undefined, project: undefined });
    });

    it("passes selected project and label and exposes the label search filter", async () => {
        await add();

        const options = prompts.autocomplete.mock.calls[0]?.[0] as { options: { value: string, hint?: string }[], filter: (search: string, option: { value: string, hint?: string }) => boolean };
        expect(options.options).toEqual([
            { value: "bug", label: "bug", hint: "Broken" },
            { value: "", label: "— none —" },
        ]);
        expect(options.filter("broken", { value: "bug", hint: "Broken" })).toBe(true);
        expect(options.filter("bug", { value: "", hint: undefined })).toBe(false);
        const titlePrompt = prompts.text.mock.calls[0]?.[0] as { validate: (value: string) => string | undefined };
        const bodyPrompt = prompts.text.mock.calls[1]?.[0] as { validate: (value: string) => string | undefined };
        expect(titlePrompt.validate(" ")).toBe("A title is required.");
        expect(bodyPrompt.validate(" ")).toBe("A description is required.");
        expect(sharedGh.createIssue).toHaveBeenCalledWith({ title: "Fix title", body: "Fix body", label: "bug", project: "Roadmap" });
    });

    it("does not create an issue after confirmation is rejected", async () => {
        prompts.confirm.mockResolvedValue(false);

        await add();

        expect(sharedGh.createIssue).not.toHaveBeenCalled();
        expect(io.out.cancelled).toHaveBeenCalledWith("Cancelled — no issue created.");
    });

    it("reports creation failures after stopping the creation spinner", async () => {
        const error = new Error("create failed");
        sharedGh.createIssue.mockImplementation(() => {
            throw error;
        });

        await expect(add()).rejects.toBe(error);
    });

    it("offers issue picking only on master and honors that offer", async () => {
        git.currentBranch.mockReturnValue("master");
        prompts.confirm.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

        await add();

        expect(pickCommand.pick).toHaveBeenCalledOnce();
    });

    it("does not offer picking from an existing feature branch", async () => {
        await add();

        expect(prompts.confirm).toHaveBeenCalledOnce();
        expect(pickCommand.pick).not.toHaveBeenCalled();
    });

    it("does not pick another issue when the master offer is rejected", async () => {
        git.currentBranch.mockReturnValue("master");
        prompts.confirm.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

        await add();

        expect(pickCommand.pick).not.toHaveBeenCalled();
    });

    it.each([
        ["project", () => prompts.select.mockResolvedValueOnce(Symbol("cancel")), false],
        ["label", () => prompts.autocomplete.mockResolvedValueOnce(Symbol("cancel")), false],
        ["title", () => prompts.text.mockReset(), true],
    ])("turns cancellation at the %s prompt into a cancellation error", async (_where, setup, title) => {
        setup();
        if (title) prompts.text.mockResolvedValueOnce(Symbol("cancel"));

        await expect(add()).rejects.toThrow(new CancelledError("Cancelled — no issue created."));
    });

    it("turns description cancellation into the same clean cancellation", async () => {
        prompts.text.mockReset();
        prompts.text.mockResolvedValueOnce("Title").mockResolvedValueOnce(Symbol("cancel"));

        await expect(add()).rejects.toThrow(new CancelledError("Cancelled — no issue created."));
    });

    it("treats confirmation cancellation as cancellation rather than rejection", async () => {
        prompts.confirm.mockResolvedValue(Symbol("cancel"));

        await expect(add()).rejects.toThrow(new CancelledError("Cancelled — no issue created."));
    });
});
