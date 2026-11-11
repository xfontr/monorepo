import { existsSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseDocument } from "yaml";
import {
    assembleWorkflows,
    projectYaml,
    TICKET_SIZES,
    type TicketSize,
    type Workflows,
} from "../../shared/workflows.ts";
import { readWorkflowFiles } from "./workflowFiles.ts";

const workflowsDir = (): string => String(useRuntimeConfig().workflowsDir);

export const loadWorkflows = async (): Promise<Workflows> => {
    const { templates, projects, snapshots } = await readWorkflowFiles(workflowsDir());

    return assembleWorkflows(templates, projects, snapshots);
};

/** The project fields the page edits; the template stays, since its switches and settled blocks belong to it. */
const DETAILS = ["title", "summary", "milestone", "area"] as const;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === "object" && !Array.isArray(value);

const textOf = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const createProject = async (
    edit: Record<string, unknown>,
    id: string,
    path: string,
    workflows: Workflows,
): Promise<string | null> => {
    if (existsSync(path)) return `${id} already exists`;

    const [title, templateId, area, milestone, summary] = [
        "title",
        "template",
        "area",
        "milestone",
        "summary",
    ].map((key) => textOf(edit[key]));
    const ticketSize = textOf(edit.ticketSize) || "block";
    const template = workflows.templates.find((candidate) => candidate.id === templateId);

    if (!title) return "a project needs a title";
    if (!milestone) return "a project needs a milestone";
    if (!template) return `\`${templateId || "(none)"}\` names no template`;
    if (!(TICKET_SIZES as readonly string[]).includes(ticketSize)) {
        return `\`${ticketSize}\` isn't a ticket size`;
    }

    const switches: Record<string, boolean> = {};
    const optional = new Set(
        [...template.capabilities, ...template.groups]
            .filter((switchable) => switchable.optional)
            .map((switchable) => switchable.id),
    );

    for (const [key, on] of Object.entries(isRecord(edit.switches) ? edit.switches : {})) {
        if (!optional.has(key))
            return `\`${key}\` isn't an optional capability or group of ${template.id}`;
        if (typeof on !== "boolean") return "a switch is on or off";
        switches[key] = on;
    }

    const project = {
        id,
        title,
        template: template.id,
        area: area ?? "",
        milestone,
        summary: summary ?? "",
        switches,
    };

    await writeFile(
        path,
        projectYaml({ ...project, ticketSize: ticketSize as TicketSize }),
        "utf8",
    );
    return null;
};

/**
 * One edit to a project file through the YAML document model, so the comments and layout a person
 * wrote survive the round trip. Returns a problem, or null once the file is written.
 */
export const applyEdit = async (body: unknown): Promise<string | null> => {
    const edit = body !== null && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const id = textOf(edit.project);

    if (!SLUG.test(id)) return `\`${id}\` isn't a kebab-case project id`;

    const path = resolve(workflowsDir(), "projects", `${id}.yaml`);
    const workflows = await loadWorkflows();

    if (edit.action === "create") return createProject(edit, id, path, workflows);
    if (!existsSync(path)) return `${id} doesn't exist`;

    // GitHub keeps the milestone and its tickets; only the files that draw the project go.
    if (edit.action === "delete") {
        await rm(path);
        await rm(resolve(workflowsDir(), "projects", `${id}.snapshot.json`), { force: true });
        return null;
    }

    const view = workflows.projects.find(({ project }) => project.id === id);

    if (!view) return `${id}.yaml names no template, so it can't be edited here`;

    const document = parseDocument(await readFile(path, "utf8"));

    if (document.errors.length > 0) return `${id}.yaml doesn't parse`;

    if (edit.action !== "settings") return `\`${String(edit.action)}\` isn't an edit`;

    const details = Object.fromEntries(DETAILS.map((key) => [key, textOf(edit[key])] as const));

    if (!details.title) return "a project needs a title";
    if (!details.milestone) return "a project needs a milestone";

    const switches = isRecord(edit.switches) ? edit.switches : {};

    for (const [key, on] of Object.entries(switches)) {
        const switchable = [...view.template.capabilities, ...view.template.groups].find(
            (candidate) => candidate.id === key,
        );

        if (!switchable?.optional) {
            return `\`${key}\` isn't an optional capability or group of ${view.template.id}`;
        }
        if (typeof on !== "boolean") return "a switch is on or off";
    }

    const size = textOf(edit.ticketSize);

    if (!(TICKET_SIZES as readonly string[]).includes(size))
        return `\`${size}\` isn't a ticket size`;
    if (size !== view.project.ticketSize && view.tickets.filed > 0) {
        return "the ticket size is fixed once a ticket is filed";
    }

    for (const [key, value] of Object.entries(details)) document.set(key, value);
    for (const [key, on] of Object.entries(switches)) document.setIn(["switches", key], on);
    if (size !== view.project.ticketSize) document.set("ticketSize", size);

    await writeFile(path, document.toString(), "utf8");
    return null;
};
