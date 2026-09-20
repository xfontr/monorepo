import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const clack = vi.hoisted(() => ({
    cancel: vi.fn(),
    intro: vi.fn(),
    log: { info: vi.fn(), success: vi.fn(), warn: vi.fn(), error: vi.fn() },
    note: vi.fn(),
    outro: vi.fn(),
    spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn(), message: vi.fn() })),
}));

vi.mock("@clack/prompts", () => clack);
import { isInteractive } from "./io.ts";

const ORIGINAL_CI = process.env.CI;
const ORIGINAL_TTY = process.stdout.isTTY;

const setEnvironment = (isTTY: boolean, ci: boolean): void => {
    process.stdout.isTTY = isTTY;
    if (ci) process.env.CI = "1";
    else delete process.env.CI;
};

let stdout: string[];
let stderr: string[];

beforeEach(() => {
    stdout = [];
    stderr = [];
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
    vi.clearAllMocks();
});

afterEach(() => {
    vi.restoreAllMocks();
    if (ORIGINAL_CI === undefined) delete process.env.CI;
    else process.env.CI = ORIGINAL_CI;

    process.stdout.isTTY = ORIGINAL_TTY;
});

describe("non-interactive output", () => {
    it("routes messages to the documented streams and renders note titles", async () => {
        const { out } = await import("./io.ts");

        out.info("info");
        out.success("success");
        out.warn("warn");
        out.error("error");
        out.note("body", "Title");
        out.begin("begin");
        out.end("end");
        out.cancelled("cancelled");

        expect(stdout).toEqual(["info\n", "success\n", "Title\nbody\n", "begin\n", "end\n", "cancelled\n"]);
        expect(stderr).toEqual(["warn\n", "error\n"]);
    });

    it("prints spinner start and stop while discarding intermediate messages", async () => {
        const { out } = await import("./io.ts");
        const spinner = out.spinner();

        spinner.start("start");
        spinner.message("hidden");
        spinner.stop("stop");

        expect(stdout).toEqual(["start\n", "stop\n"]);
    });
});

describe("interactive output", () => {
    it("delegates decoration and spinner control to clack", async () => {
        process.stdout.isTTY = true;
        const spinner = { start: vi.fn(), stop: vi.fn(), message: vi.fn() };
        clack.spinner.mockReturnValue(spinner);
        const { out } = await import("./io.ts");

        out.info("info");
        out.success("success");
        out.warn("warn");
        out.error("error");
        out.note("body", "Title");
        out.begin("begin");
        out.end("end");
        out.cancelled("cancelled");
        const actual = out.spinner();

        expect(clack.log.info).toHaveBeenCalledWith("info");
        expect(clack.log.success).toHaveBeenCalledWith("success");
        expect(clack.log.warn).toHaveBeenCalledWith("warn", { output: process.stderr });
        expect(clack.log.error).toHaveBeenCalledWith("error", { output: process.stderr });
        expect(clack.note).toHaveBeenCalledWith("body", "Title");
        expect(clack.intro).toHaveBeenCalledWith("begin");
        expect(clack.outro).toHaveBeenCalledWith("end");
        expect(clack.cancel).toHaveBeenCalledWith("cancelled");
        expect(actual).toBe(spinner);
    });
});

describe("isInteractive", () => {
    it.each([
        [true, false, true],
        [false, false, false],
        [true, true, false],
        [false, true, false],
    ])("returns %j for TTY=%j and CI=%j", (isTTY, ci, expected) => {
        setEnvironment(isTTY, ci);

        expect(isInteractive()).toBe(expected);
    });
});
