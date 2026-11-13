import type { TicketSize } from "./types.ts";

/** A page the project adds once, as an extra naming one of its template's page types. */
export interface NewPage {
    id: string;
    type: string;
    title: string;
}

export interface NewProject {
    id: string;
    title: string;
    template: string;
    area: string;
    milestone: string;
    summary: string;
    switches: Record<string, boolean>;
    ticketSize: TicketSize;
    extras: NewPage[];
}

/** Also the file name, so nothing that could climb out of `projects/` gets through. */
export const PROJECT_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** A title as a project id: accents dropped, anything else between words a dash. */
export const projectSlug = (title: string): string =>
    title
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

/** A page's block id from its title, ending in `-page` like the hand-written extras do. */
export const pageId = (title: string): string => {
    const slug = projectSlug(title);
    return !slug || /(?:^|-)page$/.test(slug) ? slug : `${slug}-page`;
};

/** Why each page can't be written yet, or null; `taken` are the template's own block ids. */
export const pageProblems = (pages: { title: string }[], taken: Set<string>): (string | null)[] =>
    pages.map(({ title }, index) => {
        const id = pageId(title);

        if (!title.trim()) return "Name the page, or remove it";
        if (!id) return "The title has no letters to make an id from";
        if (taken.has(id)) return `\`${id}\` is already a block of the template`;
        if (pages.slice(0, index).some((other) => pageId(other.title) === id)) {
            return "Another page has this name";
        }
        return null;
    });

const PLAIN = /^[A-Z][\w.,()/-]*(?:[ :][\w.,()/-]+)*$/i;

// YAML 1.1 readers still turn these into booleans or null when they're left unquoted.
const KEYWORDS = /^(?:true|false|yes|no|on|off|y|n|null)$/i;

const scalar = (text: string): string =>
    PLAIN.test(text) && !KEYWORDS.test(text) ? text : JSON.stringify(text);

/** A new project's file, written without the `yaml` package so the browser can build it too. */
export const projectYaml = (project: NewProject): string => {
    const lines = (["id", "title", "template", "area", "milestone", "summary"] as const).map(
        (key) => `${key}: ${scalar(project[key])}`,
    );
    const switches = Object.entries(project.switches).map(([key, on]) => `  ${scalar(key)}: ${on}`);
    const extras = project.extras.flatMap(({ id, type, title }) => [
        `  - id: ${scalar(id)}`,
        `    type: ${scalar(type)}`,
        `    title: ${scalar(title)}`,
    ]);

    return [
        ...lines,
        "",
        switches.length > 0 ? ["switches:", ...switches].join("\n") : "switches: {}",
        "",
        `ticketSize: ${project.ticketSize}`,
        ...(extras.length > 0 ? ["", "extras:", ...extras] : []),
        "",
    ].join("\n");
};
