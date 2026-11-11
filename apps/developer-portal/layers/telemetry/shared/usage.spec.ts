import { describe, expect, it } from "vitest";
import { parseLog, summarize, type UsageRecord } from "./usage.ts";

const NOW = "2026-11-09T00:00:00.000Z";

const record = (overrides: Partial<UsageRecord> = {}): UsageRecord => ({
    at: "2026-11-08",
    script: "issue",
    command: "pick",
    target: "",
    flags: "",
    area: "repo",
    caller: "human",
    tty: "1",
    exit: "0",
    ms: "100",
    ...overrides,
});

describe("parseLog", () => {
    it("reads cells by the header's names, so a reordered or added column still parses", () => {
        const text = "script,extra,at\nmap,x,2026-11-08\n";

        expect(parseLog(text)).toEqual([{ script: "map", extra: "x", at: "2026-11-08" }]);
    });

    it("skips a line whose cell count doesn't match the header", () => {
        expect(parseLog("at,script\n2026-11-08\n2026-11-08,map\n")).toHaveLength(1);
    });
});

describe("summarize", () => {
    it("counts runs, failures, callers, commands, targets, areas and flags per script", () => {
        const { scripts } = summarize(
            [
                record({ flags: "type=fix;check" }),
                record({
                    exit: "1",
                    caller: "claude-code",
                    tty: "0",
                    target: "ui",
                    flags: "check",
                }),
            ],
            [],
            NOW,
        );

        expect(scripts.issue).toMatchObject({
            runs: 2,
            failures: 1,
            headless: 1,
            totalMs: 200,
            callers: { human: 1, "claude-code": 1 },
            commands: { pick: 2 },
            targets: { ui: 1 },
            flags: { check: 2, "type=fix": 1 },
        });
    });

    it("doesn't count a Ctrl+C as a failure", () => {
        expect(summarize([record({ exit: "130" })], [], NOW).scripts.issue?.failures).toBe(0);
    });

    it("counts a run older than the window in the total but not in recent, and the first day in both", () => {
        const { scripts } = summarize(
            [record(), record({ at: "2026-01-01" }), record({ at: "2026-08-11" })],
            [],
            NOW,
        );

        expect(scripts.issue).toMatchObject({
            runs: 3,
            recent: 2,
            first: "2026-01-01",
        });
    });

    it("counts each window day's runs, agent runs and failures, and leaves older days out", () => {
        const { scripts } = summarize(
            [
                record({ at: "2026-11-08T13:04:27.729Z" }),
                record({ caller: "claude-code", exit: "1" }),
                record({ at: "2026-01-01" }),
            ],
            [],
            NOW,
        );

        expect(scripts.issue?.days).toEqual({
            "2026-11-08": { runs: 2, agent: 1, failures: 1 },
        });
    });
});
