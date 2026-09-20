import { titleCase } from "../../shared/domain/layout.ts";

const SCOPE = "@monorepo/";

const SELF = "@monorepo/scripts";

const ROOT_ORDER = ["apps", "infrastructure", "packages"];

export type Runnable = {
    root: string
    name: string
};

export type DevProject = Runnable & {
    label: string
};

export const labelFor = (name: string): string =>
    name.replace(SCOPE, "").split("-").map(titleCase).join(" ");

const rank = (root: string): number => {
    const position = ROOT_ORDER.indexOf(root);
    return position === -1 ? ROOT_ORDER.length : position;
};

export const toProjects = (runnables: Runnable[]): DevProject[] =>
    runnables
        .filter(({ name }) => name !== SELF)
        .map((runnable) => ({ ...runnable, label: labelFor(runnable.name) }))
        .sort((a, b) => rank(a.root) - rank(b.root) || a.label.localeCompare(b.label));

export const spellings = ({ name, label }: DevProject): string[] => [name, name.replace(SCOPE, ""), label];

export const rowFor = (project: DevProject): string => `${project.label} · ${project.root}`;

export const findProject = (projects: DevProject[], query: string): DevProject | undefined =>
    projects.find((project) =>
        spellings(project).some((spelling) => spelling.toLowerCase() === query.toLowerCase()));

export const matches = (project: DevProject, search: string): boolean =>
    [...spellings(project), project.root].some((spelling) =>
        spelling.toLowerCase().includes(search.toLowerCase()));
