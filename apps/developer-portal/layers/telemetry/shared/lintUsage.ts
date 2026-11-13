import type { LintRuleUsage, LintUsage } from "#layers/snapshot/shared/types.ts";
import type { UsageRecord } from "./usage.ts";

export const FOUGHT_DISABLES = 3;
export const NOISY_SHARE = 0.3;

const DIRECTIVE = /(?:\/\/|\/\*|<!--)\s*eslint-disable(?:-next-line|-line)?\s/g;
const RULE_ID = /^@?[\w-]+(?:\/[\w-]+)*$/;

/** Whether the line's text up to here is still inside a string, where a `//` is only text. */
const insideString = (before: string): boolean => {
    let quote: string | null = null;

    for (let index = 0; index < before.length; index += 1) {
        const char = before[index]!;
        if (char === "\\") index += 1;
        else if (quote === char) quote = null;
        else if (quote === null && (char === '"' || char === "'" || char === "`")) quote = char;
    }

    return quote !== null;
};

/** The rule IDs each `eslint-disable` comment in a file names; a bare directive names none. */
export const parseDisables = (source: string): string[] =>
    source.split("\n").flatMap((line) => {
        const match = [...line.matchAll(DIRECTIVE)].find(
            ({ index }) => !insideString(line.slice(0, index)),
        );
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

const tally = (usage: LintRuleUsage, { at = "", project, fixable }: UsageRecord, since: string) => {
    usage.hits += 1;
    if (!usage.last || at > usage.last) usage.last = at;
    if (at < since) return;

    usage.recent += 1;
    if (fixable === "1") usage.fixable += 1;
    if (project) usage.projects[project] = (usage.projects[project] ?? 0) + 1;
};

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
    for (const record of records) {
        const { at, rule } = record;
        if (!at || !rule) continue;
        const usage = rules[rule] ?? emptyRule(false);
        rules[rule] = usage;
        tally(usage, record, since);
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
