import type { ScriptUsage, UsageArtifact } from "#layers/snapshot/shared/types.ts";

export type AlertKind =
    "never-run" | "stale" | "heavy" | "one-project" | "one-flag" | "agents-only" | "failing";

export interface UsageAlert {
    script: string;
    kind: AlertKind;
    message: string;
}

/** Below this many runs a share of 100% is one data point, not a pattern. */
export const MIN_RUNS = 5;
export const WINDOW_DAYS = 90;
export const HEAVY_SHARE = 0.4;
export const FAILING_RATE = 0.25;
export const ALWAYS_FLAG_SHARE = 0.9;

const DAY_MS = 24 * 60 * 60 * 1000;
const INTERRUPTED = "130";
const UNSCOPED_AREA = "repo";

/** One CSV row keyed by the header line of its file, which `@monorepo/scripts` writes. */
export type UsageRecord = Record<string, string>;

/** Cells never hold a comma or a quote, so a plain split is the whole CSV grammar needed. */
export const parseLog = (text: string): UsageRecord[] => {
    const [header, ...lines] = text.split("\n");
    const columns = header?.split(",") ?? [];

    return lines
        .map((line) => line.split(","))
        .filter((cells) => cells.length === columns.length)
        .map((cells) => Object.fromEntries(columns.map((column, i) => [column, cells[i] ?? ""])))
        .filter((record) => record.at);
};

const bump = (counts: Record<string, number>, key: string | undefined): void => {
    if (key) counts[key] = (counts[key] ?? 0) + 1;
};

const sorted = (counts: Record<string, number>): Record<string, number> =>
    Object.fromEntries(Object.entries(counts).sort(([, a], [, b]) => b - a));

/** The first day inside the window, as `YYYY-MM-DD` like every recorded row. */
export const windowStart = (generatedAt: string): string =>
    new Date(Date.parse(generatedAt) - WINDOW_DAYS * DAY_MS).toISOString().slice(0, 10);

export const summarize = (
    records: UsageRecord[],
    known: string[],
    generatedAt: string,
): Omit<UsageArtifact, "lint"> => {
    const since = windowStart(generatedAt);
    const scripts: Record<string, ScriptUsage> = {};

    for (const record of records) {
        const { at, script } = record;
        if (!at || !script) continue;
        const usage = (scripts[script] ??= {
            runs: 0,
            recent: 0,
            failures: 0,
            headless: 0,
            totalMs: 0,
            first: at,
            last: at,
            callers: {},
            commands: {},
            targets: {},
            areas: {},
            flags: {},
        });

        usage.runs += 1;
        if (at >= since) usage.recent += 1;
        if (record.exit !== "0" && record.exit !== INTERRUPTED) usage.failures += 1;
        if (record.tty === "0") usage.headless += 1;
        usage.totalMs += Number(record.ms) || 0;
        if (at < usage.first) usage.first = at;
        if (at > usage.last) usage.last = at;
        bump(usage.callers, record.caller);
        bump(usage.commands, record.command);
        bump(usage.targets, record.target);
        bump(usage.areas, record.area);
        for (const flag of record.flags?.split(";") ?? []) bump(usage.flags, flag);
    }

    for (const usage of Object.values(scripts)) {
        usage.callers = sorted(usage.callers);
        usage.commands = sorted(usage.commands);
        usage.targets = sorted(usage.targets);
        usage.areas = sorted(usage.areas);
        usage.flags = sorted(usage.flags);
    }

    return { generatedAt, windowDays: WINDOW_DAYS, known, scripts };
};

export const agentRuns = (usage: ScriptUsage): number =>
    Object.entries(usage.callers).reduce(
        (sum, [caller, count]) => (caller === "human" ? sum : sum + count),
        0,
    );

const percent = (part: number, whole: number): string => `${Math.round((part / whole) * 100)}%`;

const only = (counts: Record<string, number>): [string, number] | undefined => {
    const entries = Object.entries(counts);
    return entries.length === 1 ? entries[0] : undefined;
};

/** A named project beats the branch's area, which says what the issue was about, not the run. */
const oneProject = (usage: ScriptUsage): string | undefined => {
    const targeted = Object.values(usage.targets).reduce((sum, count) => sum + count, 0);
    if (targeted >= MIN_RUNS) {
        const [target, count] = only(usage.targets) ?? [];
        return count === targeted ? target : undefined;
    }

    const [area] = only(usage.areas) ?? [];
    return area === UNSCOPED_AREA ? undefined : area;
};

const patternsOf = (name: string, usage: ScriptUsage): UsageAlert[] => {
    const alerts: UsageAlert[] = [];
    const alert = (kind: AlertKind, message: string): number =>
        alerts.push({ script: name, kind, message });

    const project = oneProject(usage);
    if (project)
        alert("one-project", `Every run was for ${project}. It may belong to that project.`);

    for (const [flag, count] of Object.entries(usage.flags))
        if (count / usage.runs >= ALWAYS_FLAG_SHARE)
            alert(
                "one-flag",
                `${percent(count, usage.runs)} of runs pass --${flag}. It may be the better default.`,
            );

    if (agentRuns(usage) === usage.runs)
        alert(
            "agents-only",
            "No person has run it. If people should, the scripts README may not say when to.",
        );

    if (usage.failures / usage.runs >= FAILING_RATE)
        alert("failing", `${percent(usage.failures, usage.runs)} of runs exit non-zero.`);

    return alerts;
};

export const usageAlerts = ({
    known,
    scripts,
    generatedAt,
}: Omit<UsageArtifact, "lint">): UsageAlert[] => {
    const now = Date.parse(generatedAt);
    const recentTotal = Object.values(scripts).reduce((sum, usage) => sum + usage.recent, 0);
    const alerts: UsageAlert[] = [];

    for (const name of known)
        if (!scripts[name])
            alerts.push({
                script: name,
                kind: "never-run",
                message: "Nothing recorded. Either it is new, or nobody needs it.",
            });

    for (const [name, usage] of Object.entries(scripts)) {
        const idleDays = Math.floor((now - Date.parse(usage.last)) / DAY_MS);
        if (idleDays >= WINDOW_DAYS)
            alerts.push({ script: name, kind: "stale", message: `Last run ${idleDays} days ago.` });

        const isAlone = Object.keys(scripts).length === 1;
        if (!isAlone && usage.recent >= MIN_RUNS && usage.recent / recentTotal >= HEAVY_SHARE)
            alerts.push({
                script: name,
                kind: "heavy",
                message: `${percent(usage.recent, recentTotal)} of runs in the last ${WINDOW_DAYS} days. Worth making fast and obvious.`,
            });

        if (usage.runs >= MIN_RUNS) alerts.push(...patternsOf(name, usage));
    }

    return alerts;
};
