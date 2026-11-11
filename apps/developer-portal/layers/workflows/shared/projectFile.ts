import type { TicketSize } from "./types.ts";

export interface NewProject {
    id: string;
    title: string;
    template: string;
    area: string;
    milestone: string;
    summary: string;
    switches: Record<string, boolean>;
    ticketSize: TicketSize;
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

    return [
        ...lines,
        "",
        switches.length > 0 ? ["switches:", ...switches].join("\n") : "switches: {}",
        "",
        `ticketSize: ${project.ticketSize}`,
        "",
    ].join("\n");
};
