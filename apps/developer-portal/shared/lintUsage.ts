import type { LintRuleUsage, LintUsage } from "./types.ts";
import type { UsageRecord } from "./usage.ts";

export type LintAlertKind = "fought" | "noisy" | "always-fixed";

export interface LintAlert {
    rule: string;
    kind: LintAlertKind;
    message: string;
}

export const MIN_HITS = 5;
export const FOUGHT_DISABLES = 3;
export const NOISY_SHARE = 0.3;

const DIRECTIVE = /(?:\/\/|\/\*)\s*eslint-disable(?:-next-line|-line)?\s/;
const RULE_ID = /^@?[\w-]+(?:\/[\w-]+)*$/;

/** The rule IDs each `eslint-disable` comment in a file names; a bare directive names none. */
export const parseDisables = (source: string): string[] =>
    source.split("\n").flatMap((line) => {
        const match = DIRECTIVE.exec(line);
        if (!match) return [];

        const rest = line.slice(match.index + match[0].length);
        const [names = ""] = rest.split("--");
        return names
            .replace("*/", "")
            .split(",")
            .map((name) => name.trim())
            .filter((name) => RULE_ID.test(name));
    });

const emptyRule = (enabled: boolean): LintRuleUsage => ({
    enabled,
    hits: 0,
    recent: 0,
    fixable: 0,
    last: null,
    projects: {},
    disabled: 0,
});

/** `since` is the first day inside the window, as `YYYY-MM-DD`. */
export const summarizeLint = (
    records: UsageRecord[],
    enabled: string[],
    disabled: Record<string, number>,
    since: string,
): LintUsage => {
    const rules: Record<string, LintRuleUsage> = {};
    for (const rule of enabled) rules[rule] = emptyRule(true);

    let first: string | null = null;
    for (const { at, rule, project, fixable } of records) {
        if (!at || !rule) continue;
        const usage = (rules[rule] ??= emptyRule(false));

        usage.hits += 1;
        if (at >= since) usage.recent += 1;
        if (fixable === "1") usage.fixable += 1;
        if (!usage.last || at > usage.last) usage.last = at;
        if (project) usage.projects[project] = (usage.projects[project] ?? 0) + 1;
        if (!first || at < first) first = at;
    }

    // A comment naming a rule nothing enables or reports is a typo or a plugin long gone.
    for (const [rule, count] of Object.entries(disabled)) {
        const usage = rules[rule];
        if (usage) usage.disabled = count;
    }

    return { since: first, rules };
};

/** Rules that are on, haven't fired inside the window and that nobody disables either. */
export const neverFired = (lint: LintUsage): string[] =>
    Object.entries(lint.rules)
        .filter(([, usage]) => usage.enabled && usage.recent === 0 && usage.disabled === 0)
        .map(([rule]) => rule)
        .sort((a, b) => a.localeCompare(b));

export const lintAlerts = (lint: LintUsage): LintAlert[] => {
    const recentTotal = Object.values(lint.rules).reduce((sum, usage) => sum + usage.recent, 0);
    const alerts: LintAlert[] = [];

    for (const [rule, usage] of Object.entries(lint.rules)) {
        if (usage.disabled >= FOUGHT_DISABLES)
            alerts.push({
                rule,
                kind: "fought",
                message: `Disabled inline ${usage.disabled} times. Either the rule or the code it keeps catching is wrong.`,
            });

        if (usage.recent >= MIN_HITS && usage.recent / recentTotal >= NOISY_SHARE)
            alerts.push({
                rule,
                kind: "noisy",
                message: `${Math.round((usage.recent / recentTotal) * 100)}% of recent hits. Worth saying in a CLAUDE.md, or a sign the rule is too broad.`,
            });

        if (usage.hits >= MIN_HITS && usage.fixable === usage.hits)
            alerts.push({
                rule,
                kind: "always-fixed",
                message: "Every hit was auto-fixed, so it costs agents nothing.",
            });
    }

    return alerts;
};
