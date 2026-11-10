import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Document, parseDocument } from "yaml";
import { assembleWorkflows, type Workflows } from "../../shared/workflows.ts";
import { readWorkflowFiles } from "./workflowFiles.ts";

const workflowsDir = (): string => String(useRuntimeConfig().workflowsDir);

export const loadWorkflows = async (): Promise<Workflows> => {
    const { templates, projects, snapshots } = await readWorkflowFiles(workflowsDir());

    return assembleWorkflows(templates, projects, snapshots);
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const textOf = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const createProject = async (
    edit: Record<string, unknown>,
    id: string,
    path: string,
    workflows: Workflows,
): Promise<string | null> => {
    if (existsSync(path)) return `${id} already exists`;

    const [title, template, area, milestone] = ["title", "template", "area", "milestone"].map(
        (key) => textOf(edit[key]),
    );

    if (!title) return "a project needs a title";
    if (!milestone) return "a project needs a milestone";
    if (!workflows.templates.some((candidate) => candidate.id === template)) {
        return `\`${template || "(none)"}\` names no template`;
    }

    const document = new Document({
        id,
        title,
        template,
        area,
        milestone,
        summary: "",
        switches: {},
    });

    await writeFile(path, document.toString(), "utf8");
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

    const view = workflows.projects.find(({ project }) => project.id === id);

    if (!view) return `${id}.yaml names no template, so it can't be edited here`;

    const document = parseDocument(await readFile(path, "utf8"));

    if (document.errors.length > 0) return `${id}.yaml doesn't parse`;

    if (edit.action === "switch") {
        const switchable = [...view.template.capabilities, ...view.template.groups].find(
            (candidate) => candidate.id === edit.capability,
        );

        if (!switchable?.optional) {
            return `\`${String(edit.capability)}\` isn't an optional capability or group of ${view.template.id}`;
        }
        if (typeof edit.on !== "boolean") return "a switch is on or off";

        document.setIn(["switches", switchable.id], edit.on);
    } else {
        return `\`${String(edit.action)}\` isn't an edit`;
    }

    await writeFile(path, document.toString(), "utf8");
    return null;
};
