/** Every project in this workspace carries it, so a label that repeated it would say nothing. */
const SCOPE = "@monorepo/";

/**
 * This script *is* `pnpm dev`, and it declares a `dev` script of its own to be reachable that way —
 * so Nx honestly reports it as runnable and offering it back would just re-open the picker.
 */
const SELF = "@monorepo/scripts";

/** Words Title Case would ruin: nobody calls the component library "Ui". */
const ACRONYMS = ["ui", "api", "bff", "cms", "tms"];

/**
 * What someone who just cloned this most likely meant, offered first: an app before the service
 * behind it, and a component library's Storybook last. Deliberately its own order rather than
 * `PROJECT_ROOTS`', which describes the layout and has no opinion about what to run — but
 * [`projects.spec.ts`](./projects.spec.ts) pins that every root appears here, so a fourth one can't
 * quietly end up ranked last.
 */
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
        // Layer first, then alphabetical inside it: the list has to answer "which one is the app"
        // before it answers "where is the one I already know the name of", and it can't do either
        // if the rows move between runs.
        .sort((a, b) => rank(a.root) - rank(b.root) || a.label.localeCompare(b.label));

/**
 * The three ways one project gets referred to, because the scoped name is the one nobody types:
 * `@monorepo/huella-legal`, `huella-legal`, and the `Huella Legal` the picker shows.
 */
export const spellings = ({ name, label }: DevProject): string[] => [name, name.replace(SCOPE, ""), label];

/**
 * The layer rides in the row itself rather than in the picker's hint, which clack only renders for
 * the row you're on. On a workspace this size that's a nicety; at fifteen projects it's the
 * difference between a list you read and a list you scroll — ordering alone groups the rows, but
 * nothing tells you the grouping is there.
 */
export const rowFor = (project: DevProject): string => `${project.label} · ${project.root}`;

/** Exact only — a half-typed name is for the picker's search to narrow, not for this to guess at. */
export const findProject = (projects: DevProject[], query: string): DevProject | undefined =>
    projects.find((project) =>
        spellings(project).some((spelling) => spelling.toLowerCase() === query.toLowerCase()));

/**
 * What the picker's search box filters on: the same three spellings, plus the layer — so typing
 * `apps` narrows to the apps, which is the other question someone browsing fifteen rows is asking.
 */
export const matches = (project: DevProject, search: string): boolean =>
    [...spellings(project), project.root].some((spelling) =>
        spelling.toLowerCase().includes(search.toLowerCase()));
