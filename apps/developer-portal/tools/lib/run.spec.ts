import { describe, expect, it } from "vitest";
import { DisallowedGitSubcommandError, git, run, runAllowFailure, tryRun } from "./run.ts";
import { WORKSPACE_ROOT } from "./paths.ts";

describe("git", () => {
    it("rejects disallowed subcommands before executing them", async () => {
        await expect(git(["status"])).rejects.toBeInstanceOf(DisallowedGitSubcommandError);
    });
});

describe("tryRun", () => {
    it("preserves a successful value", async () => {
        await expect(tryRun(async () => "value")).resolves.toEqual({ ok: true, value: "value" });
    });

    it("turns Error and non-Error rejections into failure results", async () => {
        await expect(tryRun(async () => Promise.reject(new Error("broken")))).resolves.toEqual({ ok: false, error: "broken" });
        await expect(tryRun(async () => Promise.reject("broken differently"))).resolves.toEqual({ ok: false, error: "broken differently" });
    });
});

describe("runAllowFailure", () => {
    it("returns findings from stdout when the process exits non-zero", async () => {
        await expect(runAllowFailure(process.execPath, ["-e", "console.log('finding'); process.exitCode = 1"], WORKSPACE_ROOT))
            .resolves.toContain("finding");
    });

    it("rejects a silent non-zero process with its stderr message", async () => {
        await expect(runAllowFailure(process.execPath, ["-e", "console.error('useful failure'); process.exitCode = 1"], WORKSPACE_ROOT))
            .rejects.toThrow("useful failure");
    });
});

describe("run", () => {
    it("executes from the workspace root", async () => {
        await expect(run(process.execPath, ["-e", "process.stdout.write(process.cwd())"]))
            .resolves.toBe(WORKSPACE_ROOT);
    });
});
