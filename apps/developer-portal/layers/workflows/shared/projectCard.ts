import { pointsLine } from "./complexity.ts";
import type { CapabilityState, ProjectView } from "./types.ts";

/** What can move now first; a fresh project is mostly blocks to file, so those have to show. */
const NOW: [CapabilityState, string][] = [
    ["waiting-on-you", "waiting on you"],
    ["ready", "ready"],
    ["can-file", "to file"],
    ["in-flight", "in flight"],
    ["blocked", "blocked"],
];

export interface ProjectCard {
    id: string;
    title: string;
    templateTitle: string;
    percent: number;
    now: string;
    points: string;
    progress: string;
    unsorted: number;
}

/** What a project's card on the Workflows page and the Overview says. */
export const projectCard = ({
    project,
    template,
    capabilities,
    counts,
    progress,
    points,
    unsorted,
    tickets,
}: ProjectView): ProjectCard => ({
    id: project.id,
    title: project.title,
    templateTitle: template.title,
    percent: progress.percent,
    now: capabilities.every(({ enabled }) => !enabled)
        ? "no blocks yet"
        : NOW.filter(([state]) => counts[state] > 0)
              .map(([state, label]) => `${counts[state]} ${label}`)
              .join(" · ") || "nothing left",
    points: pointsLine(points),
    progress: `${progress.done}/${progress.total} capabilities · ${tickets.filed} tickets filed, ${tickets.toFile[project.ticketSize]} to file`,
    unsorted: unsorted.length,
});

/** The projects with blocks still to finish. */
export const activeProjects = (projects: ProjectView[]): ProjectView[] =>
    projects.filter(({ progress }) => progress.percent < 100);
