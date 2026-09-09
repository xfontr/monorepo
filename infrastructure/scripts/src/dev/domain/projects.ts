/** Every project in this workspace carries it, so a label that repeated it would say nothing. */
const SCOPE = "@monorepo/";

const SELF = "@monorepo/scripts";

/** Words Title Case would ruin: nobody calls the component library "Ui". */
const ACRONYMS = ["ui", "api", "bff", "cms", "tms"];

const ROOT_ORDER = ["apps", "infrastructure", "packages"];

/** A project Nx reports as having a `dev` target, and the project root it was found under. */
export type Runnable = {
    root: string
    name: string
};

export type DevProject = Runnable & {
    /** The project as a person says it out loud, which is what the picker shows. */
    label: string
};

const titleCase = (word: string): string =>
    ACRONYMS.includes(word) ? word.toUpperCase() : `${word.charAt(0).toUpperCase()}${word.slice(1)}`;

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

/**
 * The three ways one project gets referred to, because the scoped name is the one nobody types:
 * `@monorepo/huella-legal`, `huella-legal`, and the `Huella Legal` the picker shows.
 */
export const spellings = ({ name, label }: DevProject): string[] => [name, name.replace(SCOPE, ""), label];

export const rowFor = (project: DevProject): string => `${project.label} · ${project.root}`;

/** Exact only — a half-typed name is for the picker's search to narrow, not for this to guess at. */
export const findProject = (projects: DevProject[], query: string): DevProject | undefined =>
    projects.find((project) =>
        spellings(project).some((spelling) => spelling.toLowerCase() === query.toLowerCase()));

export const matches = (project: DevProject, search: string): boolean =>
    [...spellings(project), project.root].some((spelling) =>
        spelling.toLowerCase().includes(search.toLowerCase()));
