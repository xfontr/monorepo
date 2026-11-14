import { existsSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { isMap, parseDocument, type Document } from "yaml";
import {
    assembleWorkflows,
    PROJECT_ID,
    projectYaml,
    TICKET_SIZES,
    type NewPage,
    type ProjectView,
    type Template,
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === "object" && !Array.isArray(value);

const textOf = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const switchProblem = (template: Template, switches: Record<string, unknown>): string | null => {
    for (const [key, on] of Object.entries(switches)) {
        const switchable = [...template.capabilities, ...template.groups].find(
            (candidate) => candidate.id === key,
        );

        if (!switchable?.optional) {
            return `\`${key}\` isn't an optional capability or group of ${template.id}`;
        }
        if (typeof on !== "boolean") return "a switch is on or off";
    }

    return null;
};

/** The pages a new project adds, each an extra naming one of the template's page types. */
const readPages = (
    template: Template,
    raw: unknown,
): { pages: NewPage[] } | { problem: string } => {
    const failed = (problem: string) => ({ problem });

    if (raw === undefined) return { pages: [] };
    if (!Array.isArray(raw)) return failed("the pages are a list");

    const taken = new Set(template.capabilities.map(({ id }) => id));
    const pages: NewPage[] = [];

    for (const entry of raw) {
        const page = isRecord(entry) ? entry : {};
        const [id = "", type = "", title = ""] = ["id", "type", "title"].map((key) =>
            textOf(page[key]),
        );

        if (!title) return failed("a page needs a title");
        if (!PROJECT_ID.test(id)) return failed(`\`${id}\` isn't a kebab-case page id`);
        if (taken.has(id)) return failed(`\`${id}\` is already taken in ${template.id}`);
        if (!template.types.some((candidate) => candidate.id === type)) {
            return failed(`\`${type || "(none)"}\` isn't a page type of ${template.id}`);
        }

        taken.add(id);
        pages.push({ id, type, title });
    }

    return { pages };
};

const milestoneProblem = (workflows: Workflows, id: string, milestone: string): string | null => {
    const owner = workflows.projects.find(
        ({ project }) => project.id !== id && project.milestone === milestone,
    );

    return owner ? `\`${milestone}\` is already ${owner.project.id}'s milestone` : null;
};

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

    const switches = isRecord(edit.switches) ? edit.switches : {};
    const problem = switchProblem(template, switches) ?? milestoneProblem(workflows, id, milestone);

    if (problem) return problem;

    const read = readPages(template, edit.extras);

    if ("problem" in read) return read.problem;

    const extras = read.pages;

    const project = {
        id,
        title,
        template: template.id,
        area: area ?? "",
        milestone,
        summary: summary ?? "",
        switches: switches as Record<string, boolean>,
        extras,
    };

    try {
        await writeFile(path, projectYaml({ ...project, ticketSize: ticketSize as TicketSize }), {
            encoding: "utf8",
            flag: "wx",
        });
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "EEXIST") return `${id} already exists`;
        throw error;
    }
    return null;
};

/** Applies a settings edit to the parsed project file, or returns why it can't. */
const editSettings = (
    edit: Record<string, unknown>,
    document: Document,
    view: ProjectView,
    workflows: Workflows,
): string | null => {
    const { id } = view.project;
    const details = Object.fromEntries(DETAILS.map((key) => [key, textOf(edit[key])] as const));

    if (!details.title) return "a project needs a title";
    if (!details.milestone) return "a project needs a milestone";

    const switches = isRecord(edit.switches) ? edit.switches : {};
    const problem =
        switchProblem(view.template, switches) ??
        milestoneProblem(workflows, id, details.milestone ?? "");

    if (problem) return problem;

    const size = textOf(edit.ticketSize);

    if (!(TICKET_SIZES as readonly string[]).includes(size))
        return `\`${size}\` isn't a ticket size`;
    if (size !== view.project.ticketSize && view.tickets.filed > 0) {
        return "the ticket size is fixed once a ticket is filed";
    }

    for (const [key, value] of Object.entries(details)) document.set(key, value);
    if (Object.keys(switches).length > 0 && !isMap(document.get("switches"))) {
        document.set("switches", document.createNode({}));
    }
    for (const [key, on] of Object.entries(switches)) document.setIn(["switches", key], on);
    if (size !== view.project.ticketSize) document.set("ticketSize", size);

    return null;
};

/**
 * One edit to a project file through the YAML document model, so the comments and layout a person
 * wrote survive the round trip. Returns a problem, or null once the file is written.
 */
export const applyEdit = async (body: unknown): Promise<string | null> => {
    const edit = body !== null && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const id = textOf(edit.project);

    if (!PROJECT_ID.test(id)) return `\`${id}\` isn't a kebab-case project id`;

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

    const problem = editSettings(edit, document, view, workflows);

    if (problem) return problem;

    await writeFile(path, document.toString({ lineWidth: 0 }), "utf8");
    return null;
};
