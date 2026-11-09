import { describe, expect, it } from "vitest";
import type { ScriptUsage, UsageArtifact } from "./types.ts";
import { parseLog, summarize, usageAlerts, type UsageRecord } from "./usage.ts";

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

const usage = (overrides: Partial<ScriptUsage> = {}): ScriptUsage => ({
    runs: 10,
    recent: 10,
    failures: 0,
    headless: 0,
    totalMs: 1000,
    first: "2026-11-01T00:00:00.000Z",
    last: "2026-11-08T00:00:00.000Z",
    callers: { human: 5, "claude-code": 5 },
    commands: {},
    targets: {},
    areas: { "huella-legal": 5, repo: 5 },
    flags: {},
    ...overrides,
});

const artifact = (scripts: Record<string, ScriptUsage>, known = Object.keys(scripts)) =>
    ({ generatedAt: NOW, windowDays: 90, known, scripts }) satisfies Omit<UsageArtifact, "lint">;

const kinds = (scripts: Record<string, ScriptUsage>, known?: string[]): string[] =>
    usageAlerts(artifact(scripts, known)).map((alert) => `${alert.script}:${alert.kind}`);

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
});

describe("usageAlerts", () => {
    it("flags a script folder that has no recorded run", () => {
        expect(kinds({ drift: usage() }, ["drift", "map"])).toContain("map:never-run");
    });

    it("flags a script idle for a quarter, but not one run last week", () => {
        const found = kinds({ old: usage({ last: "2026-07-01T00:00:00.000Z" }), fresh: usage() });

        expect(found).toContain("old:stale");
        expect(found).not.toContain("fresh:stale");
    });

    it("flags the script behind most recent runs, and says nothing when it is the only one", () => {
        expect(kinds({ issue: usage({ recent: 90 }), map: usage({ recent: 10 }) })).toContain(
            "issue:heavy",
        );
        expect(kinds({ issue: usage({ recent: 90 }) })).not.toContain("issue:heavy");
    });

    it("doesn't call a script heavy for runs that fell out of the window", () => {
        const found = kinds({ old: usage({ runs: 900, recent: 0 }), map: usage({ recent: 10 }) });

        expect(found).not.toContain("old:heavy");
    });

    it("flags a script whose every run named the same project", () => {
        expect(kinds({ dev: usage({ targets: { "huella-legal": 10 } }) })).toContain(
            "dev:one-project",
        );
        expect(kinds({ dev: usage({ targets: { "huella-legal": 6, ui: 4 } }) })).not.toContain(
            "dev:one-project",
        );
    });

    it("falls back to the branch area, but not when that area is the repo", () => {
        expect(kinds({ a: usage({ areas: { content: 10 } }) })).toContain("a:one-project");
        expect(kinds({ a: usage({ areas: { repo: 10 } }) })).not.toContain("a:one-project");
    });

    it("flags a flag passed on nearly every run", () => {
        expect(kinds({ a: usage({ flags: { check: 10, refresh: 2 } }) })).toEqual(["a:one-flag"]);
    });

    it("flags a script only agents run", () => {
        expect(kinds({ a: usage({ callers: { "claude-code": 10 } }) })).toEqual(["a:agents-only"]);
    });

    it("flags a script that often exits non-zero", () => {
        expect(kinds({ a: usage({ failures: 3 }) })).toContain("a:failing");
    });

    it("draws no pattern from fewer than five runs", () => {
        expect(
            kinds({
                a: usage({
                    runs: 4,
                    recent: 4,
                    failures: 4,
                    areas: { content: 4 },
                    flags: { x: 4 },
                    callers: { "claude-code": 4 },
                }),
            }),
        ).toEqual([]);
    });
});
