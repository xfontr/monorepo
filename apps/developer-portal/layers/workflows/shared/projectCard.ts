import type { ProjectView } from "./types.ts";

export interface ProjectCard {
    id: string;
    title: string;
    templateTitle: string;
    percent: number;
    done: string;
}

/** What a project's card on the Workflows page and the Overview says. */
export const projectCard = ({ project, template, progress }: ProjectView): ProjectCard => ({
    id: project.id,
    title: project.title,
    templateTitle: template.title,
    percent: progress.percent,
    done: `${progress.done} of ${progress.total} done`,
});

/** The projects with blocks still to finish. */
export const activeProjects = (projects: ProjectView[]): ProjectView[] =>
    projects.filter(({ progress }) => progress.percent < 100);
