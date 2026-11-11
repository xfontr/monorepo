import type { DayUsage, LintUsage, UsageArtifact } from "#layers/snapshot/shared/types.ts";
import { FOUGHT_DISABLES, NOISY_SHARE } from "./lintUsage.ts";
import { FAILING_RATE, MIN_RUNS, windowStart } from "./usage.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

const EMPTY_DAY: DayUsage = { runs: 0, agent: 0, failures: 0 };

export interface ScriptRow extends DayUsage {
    name: string;
    /** One entry per `windowDays` day, in the same order. */
    days: DayUsage[];
    /** `null` for a script folder with no recorded run. */
    last: string | null;
    failing: boolean;
}

export interface RuleRow {
    rule: string;
    hits: number;
    fixable: number;
    disabled: number;
    /** Hits per project, in the order of `LintTable.projects`. */
    projects: number[];
}

export interface LintTable {
    /** Busiest first. */
    projects: string[];
    rows: RuleRow[];
}

const nextDay = (day: string): string =>
    new Date(Date.parse(`${day}T00:00:00Z`) + DAY_MS).toISOString().slice(0, 10);

/** Every day from the window's first through the snapshot's, so a day with no run still gets a cell. */
export const windowDays = (generatedAt: string): string[] => {
    const days: string[] = [];
    const last = generatedAt.slice(0, 10);
    for (let day = windowStart(generatedAt); day <= last; day = nextDay(day)) days.push(day);

    return days;
};

export const sumDays = (days: DayUsage[]): DayUsage =>
    days.reduce(
        (total, day) => ({
            runs: total.runs + day.runs,
            agent: total.agent + day.agent,
            failures: total.failures + day.failures,
        }),
        EMPTY_DAY,
    );

export const isFailing = ({ runs, failures }: DayUsage): boolean =>
    runs >= MIN_RUNS && failures / runs >= FAILING_RATE;

/** Every known script and every recorded one, busiest in the window first. */
export const scriptRows = ({
    generatedAt,
    known,
    scripts,
}: Omit<UsageArtifact, "lint">): ScriptRow[] => {
    const days = windowDays(generatedAt);
    const names = [...new Set([...known, ...Object.keys(scripts)])];

    return names
        .map((name) => {
            const usage = scripts[name];
            const daily = days.map((day) => usage?.days?.[day] ?? EMPTY_DAY);
            const total = sumDays(daily);

            return {
                name,
                days: daily,
                ...total,
                last: usage?.last ?? null,
                failing: isFailing(total),
            };
        })
        .sort(
            (a, b) =>
                b.runs - a.runs ||
                (b.last ?? "").localeCompare(a.last ?? "") ||
                a.name.localeCompare(b.name),
        );
};

/** Each window day summed across scripts. */
export const dailyTotals = (rows: ScriptRow[]): DayUsage[] =>
    (rows[0]?.days ?? []).map((_, index) =>
        sumDays(rows.map((row) => row.days[index] ?? EMPTY_DAY)),
    );

/** Rules that fired or are disabled inline, against every project any of them fired in. */
export const lintTable = (lint: LintUsage): LintTable => {
    const shown = Object.entries(lint.rules)
        .filter(([, usage]) => usage.hits > 0 || usage.disabled > 0)
        .sort(([, a], [, b]) => b.hits - a.hits || b.disabled - a.disabled);

    const totals: Record<string, number> = {};
    for (const [, usage] of shown)
        for (const [project, count] of Object.entries(usage.projects))
            totals[project] = (totals[project] ?? 0) + count;

    const projects = Object.keys(totals).sort(
        (a, b) => (totals[b] ?? 0) - (totals[a] ?? 0) || a.localeCompare(b),
    );

    return {
        projects,
        rows: shown.map(([rule, usage]) => ({
            rule,
            hits: usage.hits,
            fixable: usage.fixable,
            disabled: usage.disabled,
            projects: projects.map((project) => usage.projects[project] ?? 0),
        })),
    };
};

export type CallerMix = "agents" | "both" | "people";

export type FixKind = "manual" | "auto";

export interface Tick {
    /** Percent along the axis. */
    at: number;
    label: string;
}

export interface Axis {
    ticks: Tick[];
    /** Percent along the axis where the alert's threshold sits. */
    threshold: number;
}

export interface Point<Kind extends string> {
    name: string;
    /** Percent from the left. */
    x: number;
    /** Percent from the bottom. */
    y: number;
    kind: Kind;
    title: string;
    labelled: boolean;
}

export interface Quadrants<Kind extends string> {
    x: Axis;
    y: Axis;
    points: Point<Kind>[];
}

/** Keeps zero off the log scale's first decade, so a count of 1 isn't drawn on the axis. */
const ZERO_BAND = 6;

const decadesFor = (max: number): number => Math.max(1, Math.ceil(Math.log10(Math.max(10, max))));

/** Percent along a log axis of `decades` powers of ten, zero pinned to the axis itself. */
const logAt = (value: number, decades: number): number =>
    value <= 0 ? 0 : ZERO_BAND + ((100 - ZERO_BAND) * Math.log10(value)) / decades;

const logTicks = (decades: number): Tick[] => [
    { at: 0, label: "0" },
    ...Array.from({ length: decades + 1 }, (_, power) => ({
        at: logAt(10 ** power, decades),
        label: String(10 ** power),
    })),
];

const linearTicks = (max: number, format: (value: number) => string): Tick[] =>
    [0, 0.25, 0.5, 0.75, 1].map((step) => ({ at: step * 100, label: format(step * max) }));

const callerMix = ({ runs, agent }: DayUsage): CallerMix => {
    if (agent === runs) return "agents";

    return agent === 0 ? "people" : "both";
};

const rate = (part: number, whole: number): number => (whole === 0 ? 0 : part / whole);

/** Scripts run in the window: how often against how often they fail, on the alerts' thresholds. */
export const scriptQuadrants = (rows: ScriptRow[]): Quadrants<CallerMix> => {
    const plotted = rows.filter((row) => row.runs > 0);
    const decades = decadesFor(Math.max(MIN_RUNS, ...plotted.map((row) => row.runs)));
    const topRate = Math.max(
        FAILING_RATE * 2,
        ...plotted.map((row) => rate(row.failures, row.runs)),
    );
    const yMax = Math.ceil(topRate * 10) / 10;

    return {
        x: { ticks: logTicks(decades), threshold: logAt(MIN_RUNS, decades) },
        y: {
            ticks: linearTicks(yMax, (value) => `${Math.round(value * 100)}%`),
            threshold: (FAILING_RATE / yMax) * 100,
        },
        points: plotted.map((row) => {
            const failed = rate(row.failures, row.runs);

            return {
                name: row.name,
                x: logAt(row.runs, decades),
                y: (failed / yMax) * 100,
                kind: callerMix(row),
                title: `${row.name} · ${row.runs} runs · ${Math.round(failed * 100)}% failed · ${row.agent} by agents`,
                labelled: true,
            };
        }),
    };
};

/** How many labelled rules a quiet chart still names, so it never reads as anonymous dots. */
const NAMED_BUSIEST = 3;

/** Rules that fired in the window or are disabled inline: hits against `eslint-disable` comments. */
export const ruleQuadrants = (lint: LintUsage): Quadrants<FixKind> => {
    const rules = Object.entries(lint.rules);
    const recentTotal = rules.reduce((sum, [, usage]) => sum + usage.recent, 0);
    const noisyAt = NOISY_SHARE * recentTotal;
    const shown = rules
        .filter(([, usage]) => usage.recent > 0 || usage.disabled > 0)
        .sort(([, a], [, b]) => b.recent - a.recent || b.disabled - a.disabled);
    const decades = decadesFor(Math.max(noisyAt, ...shown.map(([, usage]) => usage.recent)));
    const topDisabled = Math.max(FOUGHT_DISABLES * 2, ...shown.map(([, usage]) => usage.disabled));
    const yMax = Math.ceil(topDisabled / 5) * 5;

    return {
        x: { ticks: logTicks(decades), threshold: logAt(noisyAt, decades) },
        y: {
            ticks: linearTicks(yMax, (value) => String(Math.round(value))),
            threshold: (FOUGHT_DISABLES / yMax) * 100,
        },
        points: shown.map(([name, usage], index) => ({
            name,
            x: logAt(usage.recent, decades),
            y: (usage.disabled / yMax) * 100,
            kind: usage.hits > 0 && usage.fixable === usage.hits ? "auto" : "manual",
            title: `${name} · ${usage.recent} hits · ${usage.fixable} auto-fixed · disabled ${usage.disabled}×`,
            labelled:
                index < NAMED_BUSIEST ||
                usage.disabled >= FOUGHT_DISABLES ||
                (recentTotal > 0 && usage.recent >= noisyAt),
        })),
    };
};
