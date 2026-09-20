import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CancelledError, ExpectedError } from "./errors.ts";
import { run } from "./cli.ts";

const ORIGINAL_ARGV = process.argv;
const ORIGINAL_EXIT_CODE = process.exitCode;
const ORIGINAL_CI = process.env.CI;
const ORIGINAL_TTY = process.stdout.isTTY;

let stdout: string[];
let stderr: string[];

beforeEach(() => {
    stdout = [];
    stderr = [];
    process.argv = [process.execPath, `${process.cwd()}/src/index.ts`];
    process.exitCode = undefined;
    delete process.env.CI;
    process.stdout.isTTY = false;
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
        stdout.push(String(chunk));
        return true;
    });
    vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
        stderr.push(String(chunk));
        return true;
    });
});

afterEach(() => {
    vi.restoreAllMocks();
    process.argv = ORIGINAL_ARGV;
    process.exitCode = ORIGINAL_EXIT_CODE;

    if (ORIGINAL_CI === undefined) delete process.env.CI;
    else process.env.CI = ORIGINAL_CI;

    process.stdout.isTTY = ORIGINAL_TTY;
});

describe("run", () => {
    it("passes parsed flags and all positionals to a single command", async () => {
        process.argv.push("--check", "issue-42");
        const command = vi.fn();

        await run(command);

        expect(command).toHaveBeenCalledWith({ flags: new Set(["check"]), positionals: ["issue-42"] });
        expect(process.exitCode).toBeUndefined();
    });

    it("parses flags and dispatches the named command with the remaining positionals", async () => {
        process.argv.push("add", "--check", "issue-42");
        const command = vi.fn();

        await run({ add: command });

        expect(command).toHaveBeenCalledWith({ flags: new Set(["check"]), positionals: ["issue-42"] });
        expect(process.exitCode).toBeUndefined();
    });

    it("reports usage and exits 1 when no command matches the first positional", async () => {
        process.argv.push("missing");

        await run({ add: vi.fn() });

        expect(stderr.join("")).toContain("Usage: node src/index.ts <add>");
        expect(process.exitCode).toBe(1);
    });

    it("reports cancellation without marking the command as failed", async () => {
        await run(() => {
            throw new CancelledError("Cancelled — stopped here.");
        });

        expect(stdout.join("")).toBe("Cancelled — stopped here.\n");
        expect(process.exitCode).toBeUndefined();
    });

    it("reports an expected error without exposing its stack and exits 1", async () => {
        await run(() => {
            throw new ExpectedError("The requested project does not exist.");
        });

        expect(stderr.join("")).toBe("The requested project does not exist.\n");
        expect(process.exitCode).toBe(1);
    });

    it("reports an unexpected error's stack and stderr detail before exiting 1", async () => {
        const error = Object.assign(new Error("unexpected failure"), {
            stderr: Buffer.from("command detail"),
        });

        await run(() => {
            throw error;
        });

        expect(stderr.join("")).toContain(error.stack);
        expect(stderr.join("")).toContain("command detail");
        expect(process.exitCode).toBe(1);
    });

    it("reports a non-Error throw as a user-visible failure", async () => {
        await run(() => new Promise((_, reject) => {
            // This deliberately exercises the CLI's non-Error rejection path.
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject("bad value");
        }));

        expect(stderr.join("")).toBe("bad value\n");
        expect(process.exitCode).toBe(1);
    });
});
