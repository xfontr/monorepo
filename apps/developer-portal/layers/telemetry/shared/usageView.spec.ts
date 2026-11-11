import { describe, expect, it } from "vitest";
import type { LintRuleUsage, ScriptUsage } from "#layers/snapshot/shared/types.ts";
import {
    dailyTotals,
    lintTable,
    ruleQuadrants,
    scriptQuadrants,
    scriptRows,
    windowDays,
} from "./usageView.ts";

const NOW = "2026-11-09T07:00:00.000Z";

const usage = (overrides: Partial<ScriptUsage> = {}): ScriptUsage => ({
    runs: 0,
    recent: 0,
    failures: 0,
    headless: 0,
    totalMs: 0,
    first: "2026-11-01",
    last: "2026-11-08",
    callers: {},
    commands: {},
    targets: {},
    areas: {},
    flags: {},
    days: {},
    ...overrides,
});

const rule = (overrides: Partial<LintRuleUsage> = {}): LintRuleUsage => ({
    enabled: true,
    hits: 0,
    recent: 0,
    fixable: 0,
    last: null,
    projects: {},
    disabled: 0,
    ...overrides,
});

describe("windowDays", () => {
    it("runs from the window's first day through the snapshot's, so the matrix matches `recent`", () => {
        const days = windowDays(NOW);

        expect(days[0]).toBe("2026-08-11");
        expect(days.at(-1)).toBe("2026-11-09");
        expect(new Set(days).size).toBe(days.length);
    });
});

describe("scriptRows", () => {
    it("gives a known script with no run a row of its own, last and empty, instead of dropping it", () => {
        const rows = scriptRows({
            generatedAt: NOW,
            windowDays: 90,
            known: ["drift", "map"],
            scripts: { map: usage({ days: { "2026-11-08": { runs: 2, agent: 1, failures: 0 } } }) },
        });

        expect(rows.map((row) => [row.name, row.runs, row.last])).toEqual([
            ["map", 2, "2026-11-08"],
            ["drift", 0, null],
        ]);
    });

    it("sums runs from the window's days only, so an old busy script doesn't outrank a fresh one", () => {
        const rows = scriptRows({
            generatedAt: NOW,
            windowDays: 90,
            known: [],
            scripts: {
                old: usage({ runs: 500, days: {} }),
                fresh: usage({ days: { "2026-11-09": { runs: 1, agent: 0, failures: 0 } } }),
            },
        });

        expect(rows.map((row) => row.name)).toEqual(["fresh", "old"]);
    });

    it("marks a script failing only past the alert's run floor and rate", () => {
        const [row] = scriptRows({
            generatedAt: NOW,
            windowDays: 90,
            known: [],
            scripts: { ci: usage({ days: { "2026-11-08": { runs: 8, agent: 8, failures: 2 } } }) },
        });

        expect(row?.failing).toBe(true);
    });
});

describe("dailyTotals", () => {
    it("adds every script's runs on the same day", () => {
        const rows = scriptRows({
            generatedAt: NOW,
            windowDays: 90,
            known: [],
            scripts: {
                a: usage({ days: { "2026-11-09": { runs: 2, agent: 2, failures: 1 } } }),
                b: usage({ days: { "2026-11-09": { runs: 3, agent: 0, failures: 0 } } }),
            },
        });

        expect(dailyTotals(rows).at(-1)).toEqual({ runs: 5, agent: 2, failures: 1 });
    });
});

describe("lintTable", () => {
    it("orders project columns busiest first and fills a project a rule never hit with zero", () => {
        const table = lintTable({
            since: "2026-11-01",
            rules: {
                prettier: rule({ hits: 9, projects: { ui: 2, portal: 7 } }),
                "no-console": rule({ disabled: 4 }),
                quiet: rule(),
            },
        });

        expect(table.projects).toEqual(["portal", "ui"]);
        expect(table.rows.map((row) => [row.rule, row.projects])).toEqual([
            ["prettier", [7, 2]],
            ["no-console", [0, 0]],
        ]);
    });
});

describe("scriptRows on an older snapshot", () => {
    it("reads a script collected before per-day counts as idle in the window instead of throwing", () => {
        const old = usage({ runs: 40 });
        delete old.days;

        const rows = scriptRows({ generatedAt: NOW, windowDays: 90, known: [], scripts: { old } });

        expect(rows.map((row) => [row.name, row.runs])).toEqual([["old", 0]]);
    });
});

describe("scriptQuadrants", () => {
    it("draws the failing threshold where the alert fires and leaves idle scripts off the plot", () => {
        const rows = scriptRows({
            generatedAt: NOW,
            windowDays: 90,
            known: ["idle"],
            scripts: { ci: usage({ days: { "2026-11-08": { runs: 8, agent: 8, failures: 2 } } }) },
        });

        const chart = scriptQuadrants(rows);

        expect(chart.points.map((point) => [point.name, point.kind])).toEqual([["ci", "agents"]]);
        expect(chart.points[0]?.y).toBe(chart.y.threshold);
    });

    it("places more runs further right, so the busiest script reads as such", () => {
        const rows = scriptRows({
            generatedAt: NOW,
            windowDays: 90,
            known: [],
            scripts: {
                busy: usage({ days: { "2026-11-08": { runs: 90, agent: 0, failures: 0 } } }),
                rare: usage({ days: { "2026-11-08": { runs: 2, agent: 1, failures: 0 } } }),
            },
        });

        const [busy, rare] = scriptQuadrants(rows).points;

        expect(busy?.x).toBeGreaterThan(rare?.x ?? Infinity);
        expect([busy?.kind, rare?.kind]).toEqual(["people", "both"]);
    });
});

describe("ruleQuadrants", () => {
    it("pins a rule that is only ever disabled to the left edge and names it once it is fought", () => {
        const chart = ruleQuadrants({
            since: "2026-11-01",
            rules: {
                prettier: rule({ hits: 9, recent: 9, fixable: 9 }),
                "no-console": rule({ disabled: 22 }),
                quiet: rule(),
            },
        });

        const byName = Object.fromEntries(chart.points.map((point) => [point.name, point]));

        expect(Object.keys(byName)).toEqual(["prettier", "no-console"]);
        expect(byName["no-console"]).toMatchObject({ x: 0, labelled: true, kind: "manual" });
        expect(byName.prettier?.kind).toBe("auto");
    });
});
