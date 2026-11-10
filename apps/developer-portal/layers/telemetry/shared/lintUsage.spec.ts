import { describe, expect, it } from "vitest";
import { lintAlerts, neverFired, parseDisables, summarizeLint } from "./lintUsage.ts";
import type { LintRuleUsage, LintUsage } from "../../snapshot/shared/types.ts";
import type { UsageRecord } from "./usage.ts";

const SINCE = "2026-08-11";

const hit = (overrides: Partial<UsageRecord> = {}): UsageRecord => ({
    at: "2026-11-08",
    rule: "no-console",
    project: "scripts",
    severity: "error",
    fixable: "0",
    caller: "claude-code",
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

const lint = (rules: Record<string, LintRuleUsage>): LintUsage => ({ since: "2026-11-01", rules });

const kinds = (rules: Record<string, LintRuleUsage>): string[] =>
    lintAlerts(lint(rules)).map((alert) => `${alert.rule}:${alert.kind}`);

describe("parseDisables", () => {
    it("reads every rule a line, next-line or block directive names, without its reason", () => {
        const source = [
            "// eslint-disable-next-line no-console -- the CLI prints",
            "const a = 1; // eslint-disable-line @typescript-eslint/no-explicit-any, no-eval",
            "/* eslint-disable vue/no-v-html */",
        ].join("\n");

        expect(parseDisables(source)).toEqual([
            "no-console",
            "@typescript-eslint/no-explicit-any",
            "no-eval",
            "vue/no-v-html",
        ]);
    });

    it("counts nothing for a bare directive or prose that mentions one", () => {
        expect(parseDisables("/* eslint-disable */\n// see eslint-disable rules")).toEqual([]);
    });
});

describe("summarizeLint", () => {
    it("lists an enabled rule that never fired, so silence is visible", () => {
        expect(summarizeLint([], ["no-eval"], {}, SINCE).rules["no-eval"]).toMatchObject({
            enabled: true,
            hits: 0,
        });
    });

    it("counts hits, recent hits, fixes and projects, and dates the first hit", () => {
        const { since, rules } = summarizeLint(
            [hit(), hit({ fixable: "1", project: "ui" }), hit({ at: "2026-01-01" })],
            ["no-console"],
            {},
            SINCE,
        );

        expect(since).toBe("2026-01-01");
        expect(rules["no-console"]).toMatchObject({
            hits: 3,
            recent: 2,
            fixable: 1,
            last: "2026-11-08",
            projects: { scripts: 2, ui: 1 },
        });
    });

    it("ignores a disable comment naming a rule nothing enables or reports", () => {
        const { rules } = summarizeLint([], ["no-console"], { "no-console": 2, typo: 4 }, SINCE);

        expect(rules["no-console"]?.disabled).toBe(2);
        expect(rules.typo).toBeUndefined();
    });
});

describe("neverFired", () => {
    it("leaves out a rule that fired, one that's disabled inline and one that's off", () => {
        const quiet = neverFired(
            lint({
                silent: rule(),
                fired: rule({ hits: 1, recent: 1 }),
                fought: rule({ disabled: 1 }),
                off: rule({ enabled: false }),
            }),
        );

        expect(quiet).toEqual(["silent"]);
    });

    it("lists a rule whose only hits fell out of the window", () => {
        expect(neverFired(lint({ old: rule({ hits: 9, recent: 0 }) }))).toEqual(["old"]);
    });
});

describe("lintAlerts", () => {
    it("flags a rule disabled inline again and again", () => {
        expect(kinds({ "no-console": rule({ disabled: 3 }) })).toEqual(["no-console:fought"]);
    });

    it("flags the rule behind most recent hits, but not below five", () => {
        expect(kinds({ a: rule({ hits: 8, recent: 8 }), b: rule({ hits: 2, recent: 2 }) })).toEqual(
            ["a:noisy"],
        );
        expect(kinds({ a: rule({ hits: 4, recent: 4 }) })).toEqual([]);
    });

    it("says a rule costs nothing only when every hit was auto-fixed", () => {
        const found = kinds({
            fixed: rule({ hits: 5, fixable: 5 }),
            mixed: rule({ hits: 5, fixable: 4 }),
        });

        expect(found).toEqual(["fixed:always-fixed"]);
    });
});
