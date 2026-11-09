import type { CapabilityView, ProjectView } from "./workflows.ts";

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

/** An open capability whose last commit is this far behind the project's latest is flagged quiet. */
export const QUIET_DAYS = 21;

export interface CapabilityActivity {
    /** Distinct days with a commit, per week of the project's timeline, so each value is 0–7. */
    weeks: number[];
    commits: number;
    days: number;
    /** Tickets with at least one commit. */
    tickets: number;
    lastDay: string | null;
    /** The last active day when the capability is still open and has gone quiet, else null. */
    quietSince: string | null;
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
    capabilities: Record<string, CapabilityActivity>;
    lastDay: string;
}

/** Calendar days are compared in UTC, so a day lands in the same week on the server and in the browser. */
const time = (day: string): number => Date.parse(`${day}T00:00:00Z`);

const mondayOf = (day: string): number => {
    const at = time(day);
    return at - ((new Date(at).getUTCDay() + 6) % 7) * DAY_MS;
};

const isoDay = (at: number): string => new Date(at).toISOString().slice(0, 10);

const OPEN_STATES = new Set<CapabilityView["state"]>(["planned", "in-progress"]);

/** Commit activity over one shared timeline for a whole project; null when no commit names any of its tickets. */
export const projectActivity = (view: ProjectView): ProjectActivity | null => {
    const all = view.stages.flatMap((stage) =>
        stage.capabilities.flatMap((capability) =>
            capability.issues.flatMap((issue) => issue.activity),
        ),
    );

    if (all.length === 0) return null;

    const sorted = [...all].sort((a, b) => a.localeCompare(b));
    const first = mondayOf(sorted[0]!);
    const lastDay = sorted.at(-1)!;
    const count = Math.round((mondayOf(lastDay) - first) / WEEK_MS) + 1;
    const weekOf = (day: string): number => Math.round((mondayOf(day) - first) / WEEK_MS);

    const span = Math.round((time(lastDay) - time(sorted[0]!)) / DAY_MS) + 1;
    const dayOf = (day: string): number => Math.round((time(day) - time(sorted[0]!)) / DAY_MS);

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

            const last = days.at(-1) ?? null;
            const quiet =
                last !== null &&
                OPEN_STATES.has(capability.state) &&
                time(lastDay) - time(last) >= QUIET_DAYS * DAY_MS;

            capabilities[capability.id] = {
                weeks,
                commits: commits.length,
                days: days.length,
                tickets: capability.issues.filter((issue) => issue.activity.length > 0).length,
                lastDay: last,
                quietSince: quiet ? last : null,
            };
        }
    });

    return {
        weeks: Array.from({ length: count }, (_, week) => isoDay(first + week * WEEK_MS)),
        peak: Math.max(1, ...Object.values(capabilities).flatMap(({ weeks }) => weeks)),
        days: Array.from({ length: span }, (_, day) => isoDay(time(sorted[0]!) + day * DAY_MS)),
        byStage,
        capabilities,
        lastDay,
    };
};
