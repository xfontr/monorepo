import { pointsLine } from "./complexity.ts";
import type { ProjectView } from "./types.ts";

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
    now: [
        `${counts["waiting-on-you"]} waiting on you`,
        `${counts.ready} ready`,
        `${counts["in-flight"]} in flight`,
        `${counts.blocked} blocked`,
    ].join(" · "),
    points: pointsLine(points),
    progress: `${progress.done}/${progress.total} capabilities · ${tickets.filed} tickets filed, ${tickets.toFile[project.ticketSize]} to file`,
    unsorted: unsorted.length,
});

/** The projects with blocks still to finish. */
export const activeProjects = (projects: ProjectView[]): ProjectView[] =>
    projects.filter(({ progress }) => progress.percent < 100);
