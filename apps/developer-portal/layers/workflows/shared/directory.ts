import { projectProblems, readProject } from "./project.ts";
import { isRecord } from "./reader.ts";
import { projectView } from "./projectView.ts";
import { readSnapshot } from "./snapshot.ts";
import { readTemplate } from "./template.ts";
import type { ProjectView, Snapshot, Template, WorkflowProblem } from "./types.ts";

export type ParsedFile = { file: string } & (
    { ok: true; value: unknown } | { ok: false; error: string }
);

export interface Workflows {
    templates: Template[];
    projects: ProjectView[];
    problems: WorkflowProblem[];
}

/** A broken file becomes a problem rather than a throw, so one bad edit never blanks the page. */
export const assembleWorkflows = (
    templateFiles: ParsedFile[],
    projectFiles: ParsedFile[],
    snapshotFiles: Record<string, ParsedFile>,
): Workflows => {
    const problems: WorkflowProblem[] = [];
    const templates: Template[] = [];

    const snapshotOf = (parsed: ParsedFile | undefined): Snapshot | null => {
        if (!parsed) return null;

        const where = `projects/${parsed.file}`;

        if (!parsed.ok) {
            problems.push({ file: where, message: parsed.error });
            return null;
        }

        const { snapshot, problems: found } = readSnapshot(parsed.value);

        problems.push(...found.map((message) => ({ file: where, message })));
        return snapshot;
    };

    for (const parsed of templateFiles) {
        const where = `templates/${parsed.file}`;

        if (!parsed.ok) {
            problems.push({ file: where, message: parsed.error });
            continue;
        }

        const { template, problems: found } = readTemplate(parsed.value);

        problems.push(...found.map((message) => ({ file: where, message })));
        if (`${template.id}.yaml` !== parsed.file) {
            problems.push({
                file: where,
                message: `\`id: ${template.id}\` doesn't match the filename`,
            });
        }
        if (template.id) templates.push(template);
    }

    const projects: ProjectView[] = [];

    for (const parsed of projectFiles) {
        const where = `projects/${parsed.file}`;

        if (!parsed.ok) {
            problems.push({ file: where, message: parsed.error });
            continue;
        }

        const named = isRecord(parsed.value) ? parsed.value.template : null;
        const { project, problems: found } = readProject(
            parsed.value,
            templates.find((candidate) => candidate.id === named)?.types,
        );
        problems.push(...found.map((message) => ({ file: where, message })));

        if (`${project.id}.yaml` !== parsed.file) {
            problems.push({
                file: where,
                message: `\`id: ${project.id}\` doesn't match the filename`,
            });
        }

        const template = templates.find((candidate) => candidate.id === project.template);

        if (!template) {
            problems.push({
                file: where,
                message: `\`template: ${project.template}\` names no template`,
            });
            continue;
        }

        problems.push(
            ...projectProblems(project, template).map((message) => ({ file: where, message })),
        );
        projects.push(projectView(project, template, snapshotOf(snapshotFiles[project.id])));
    }

    return { templates, projects, problems };
};
