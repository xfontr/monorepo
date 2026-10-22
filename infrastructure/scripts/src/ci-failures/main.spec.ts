import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Check } from "./domain/checks.ts";

const gh = vi.hoisted(() => ({ prTitle: vi.fn(), prChecks: vi.fn(), failedLog: vi.fn() }));
const files = vi.hoisted(() => ({ saveLog: vi.fn() }));
const io = vi.hoisted(() => ({ out: { info: vi.fn(), error: vi.fn() } }));
vi.mock("./adapters/gh.ts", () => gh);
vi.mock("./adapters/files.ts", () => files);
vi.mock("../shared/adapters/io.ts", () => io);

import { main } from "./main.ts";

const check = (overrides: Partial<Check>): Check => ({
    name: "checks",
    bucket: "pass",
    state: "SUCCESS",
    link: "",
    workflow: "CI",
    description: "",
    ...overrides,
});

const ACTIONS_FAILURE = check({
    bucket: "fail",
    state: "FAILURE",
    link: "https://github.com/owner/repo/actions/runs/1/job/2",
});
const SONAR_FAILURE = check({
    name: "SonarCloud",
    bucket: "fail",
    state: "FAILURE",
    workflow: "",
    link: "https://github.com/owner/repo/runs/3",
});

const NO_ARGS = { flags: new Set<string>(), positionals: [] };
const originalExitCode = process.exitCode;

const printed = (): string => io.out.info.mock.calls.map(([message]) => String(message)).join("\n");

beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    gh.prTitle.mockReturnValue("#287 Title");
    gh.failedLog.mockReturnValue("checks\tRun nx\t2026-10-22T13:59:41.0Z ##[error]Process failed");
    files.saveLog.mockReturnValue("/tmp/job-2.log");
});

afterEach(() => {
    process.exitCode = originalExitCode;
});

describe("ci-failures main", () => {
    it("reports a green PR in one line and exits 0", () => {
        gh.prChecks.mockReturnValue([check({}), check({ bucket: "skipping" })]);

        main(NO_ARGS);

        expect(io.out.info.mock.calls).toEqual([
            ["#287 Title: 0 failed, 0 pending, 2 passed or skipped"],
        ]);
        expect(process.exitCode).toBeUndefined();
    });

    it("names a pending check without failing, since its log doesn't exist yet", () => {
        gh.prChecks.mockReturnValue([check({ bucket: "pending", state: "IN_PROGRESS" })]);

        main(NO_ARGS);

        expect(printed()).toContain("… checks (in_progress)");
        expect(gh.failedLog).not.toHaveBeenCalled();
        expect(process.exitCode).toBeUndefined();
    });

    it("prints a failed job's error lines and the saved log's path, then exits 1", () => {
        gh.prChecks.mockReturnValue([ACTIONS_FAILURE]);

        main({ flags: new Set(), positionals: ["287"] });

        expect(gh.failedLog).toHaveBeenCalledWith("1", "2");
        expect(printed()).toContain(
            "✖ CI / checks\n  ##[error]Process failed\n  full log: /tmp/job-2.log",
        );
        expect(io.out.error).toHaveBeenCalledWith("1 failing check.");
        expect(process.exitCode).toBe(1);
    });

    it("links an external app's check instead of fetching a log gh can't reach", () => {
        gh.prChecks.mockReturnValue([SONAR_FAILURE, ACTIONS_FAILURE]);

        main(NO_ARGS);

        expect(gh.failedLog).toHaveBeenCalledTimes(1);
        expect(printed()).toContain("https://github.com/owner/repo/runs/3");
        expect(io.out.error).toHaveBeenCalledWith("2 failing checks.");
    });
});
