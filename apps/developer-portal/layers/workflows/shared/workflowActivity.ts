import type { ProjectView } from "./workflows.ts";

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

export interface CapabilityActivity {
    /** Distinct days with a commit, per week of the project's timeline, so each value is 0–7. */
    weeks: number[];
    commits: number;
    days: number;
    /** Tickets with at least one commit. */
    tickets: number;
    lastDay: string | null;
}

export interface ProjectActivity {
    /** The Monday that starts each week, as `YYYY-MM-DD`. */
    weeks: string[];
    /** The busiest week any one capability had, the shared top of every sparkline. */
    peak: number;
    /** Every calendar day from the first commit to the last, as `YYYY-MM-DD`. */
    days: string[];
    /** Capabilities with a commit, per day and stage, in the template's stage order. */
    byStage: number[][];
    /** The most capabilities any one day moved across all stages, the shared top of the strip. */
    busiest: number;
    capabilities: Record<string, CapabilityActivity>;
    /** Null on a replayed day before the first commit. */
    lastDay: string | null;
}

/** Calendar days are compared in UTC, so a day lands in the same week on the server and in the browser. */
const time = (day: string): number => Date.parse(`${day}T00:00:00Z`);

const mondayOf = (day: string): number => {
    const at = time(day);
    return at - ((new Date(at).getUTCDay() + 6) % 7) * DAY_MS;
};

const isoDay = (at: number): string => new Date(at).toISOString().slice(0, 10);

/**
 * Commit activity over one shared timeline for a whole project; null when no commit names any of its tickets.
 * A replayed view passes the synced project's activity as `frame`, so it keeps that timeline and scale.
 */
export const projectActivity = (
    view: ProjectView,
    frame: ProjectActivity | null = null,
): ProjectActivity | null => {
    const all = view.stages.flatMap((stage) =>
        stage.capabilities.flatMap((capability) =>
            capability.issues.flatMap((issue) => issue.activity),
        ),
    );

    const sorted = [...all].sort((a, b) => a.localeCompare(b));
    const lastDay = sorted.at(-1) ?? null;
    const start = frame?.days[0] ?? sorted[0];
    const end = frame?.days.at(-1) ?? lastDay;

    if (!start || !end) return null;

    const first = mondayOf(start);
    const count = Math.round((mondayOf(end) - first) / WEEK_MS) + 1;
    const weekOf = (day: string): number => Math.round((mondayOf(day) - first) / WEEK_MS);

    const span = Math.round((time(end) - time(start)) / DAY_MS) + 1;
    const dayOf = (day: string): number => Math.round((time(day) - time(start)) / DAY_MS);

    const capabilities: Record<string, CapabilityActivity> = {};
    const byStage = Array.from({ length: span }, () => view.stages.map(() => 0));

    view.stages.forEach((stage, stageIndex) => {
        for (const capability of stage.capabilities) {
            const commits = capability.issues.flatMap((issue) => issue.activity);
            const days = [...new Set(commits)].sort((a, b) => a.localeCompare(b));
            const weeks = Array.from({ length: count }, () => 0);

            for (const day of days) {
                weeks[weekOf(day)]! += 1;
                byStage[dayOf(day)]![stageIndex]! += 1;
            }

            capabilities[capability.id] = {
                weeks,
                commits: commits.length,
                days: days.length,
                tickets: capability.issues.filter((issue) => issue.activity.length > 0).length,
                lastDay: days.at(-1) ?? null,
            };
        }
    });

    return {
        weeks: Array.from({ length: count }, (_, week) => isoDay(first + week * WEEK_MS)),
        peak:
            frame?.peak ??
            Math.max(1, ...Object.values(capabilities).flatMap(({ weeks }) => weeks)),
        days: Array.from({ length: span }, (_, day) => isoDay(time(start) + day * DAY_MS)),
        byStage,
        busiest:
            frame?.busiest ??
            Math.max(1, ...byStage.map((day) => day.reduce((sum, moved) => sum + moved, 0))),
        capabilities,
        lastDay,
    };
};
