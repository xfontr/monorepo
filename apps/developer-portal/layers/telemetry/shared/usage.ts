import type { ScriptUsage, UsageArtifact } from "#layers/snapshot/shared/types.ts";

/** Below this many runs a share of 100% is one data point, not a pattern. */
export const MIN_RUNS = 5;
export const WINDOW_DAYS = 90;
export const FAILING_RATE = 0.25;

const DAY_MS = 24 * 60 * 60 * 1000;
const INTERRUPTED = "130";
const HUMAN = "human";

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
/** The window counts the snapshot's own day, so it starts `WINDOW_DAYS - 1` days before it. */
export const windowStart = (generatedAt: string): string =>
    new Date(Date.parse(generatedAt) - (WINDOW_DAYS - 1) * DAY_MS).toISOString().slice(0, 10);

const emptyUsage = (at: string): ScriptUsage => ({
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
    days: {},
});

const isFailure = ({ exit }: UsageRecord): boolean => exit !== "0" && exit !== INTERRUPTED;

const isAgent = ({ caller }: UsageRecord): boolean => caller !== HUMAN;

/** Older rows carry a full timestamp in `at`, newer ones only the day. */
const tallyDay = (usage: ScriptUsage, record: UsageRecord, at: string): void => {
    const day = ((usage.days ??= {})[at.slice(0, 10)] ??= { runs: 0, agent: 0, failures: 0 });
    day.runs += 1;
    if (isAgent(record)) day.agent += 1;
    if (isFailure(record)) day.failures += 1;
};

const tally = (usage: ScriptUsage, record: UsageRecord, at: string, since: string): void => {
    usage.runs += 1;
    if (at >= since) {
        usage.recent += 1;
        tallyDay(usage, record, at);
    }
    if (isFailure(record)) usage.failures += 1;
    if (record.tty === "0") usage.headless += 1;
    usage.totalMs += Number(record.ms) || 0;
    if (at < usage.first) usage.first = at;
    if (at > usage.last) usage.last = at;
    bump(usage.callers, record.caller);
    bump(usage.commands, record.command);
    bump(usage.targets, record.target);
    bump(usage.areas, record.area);
    for (const flag of record.flags?.split(";") ?? []) bump(usage.flags, flag);
};

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
        tally((scripts[script] ??= emptyUsage(at)), record, at, since);
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
