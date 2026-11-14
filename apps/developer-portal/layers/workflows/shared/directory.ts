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

const report = (problems: WorkflowProblem[], file: string, messages: string[]): void => {
    problems.push(...messages.map((message) => ({ file, message })));
};

const snapshotOf = (
    problems: WorkflowProblem[],
    parsed: ParsedFile | undefined,
): Snapshot | null => {
    if (!parsed) return null;

    const where = `projects/${parsed.file}`;

    if (!parsed.ok) {
        report(problems, where, [parsed.error]);
        return null;
    }

    const { snapshot, problems: found } = readSnapshot(parsed.value);

    report(problems, where, found);
    return snapshot;
};

const templateOf = (problems: WorkflowProblem[], parsed: ParsedFile): Template | null => {
    const where = `templates/${parsed.file}`;

    if (!parsed.ok) {
        report(problems, where, [parsed.error]);
        return null;
    }

    const { template, problems: found } = readTemplate(parsed.value);

    report(problems, where, found);
    if (`${template.id}.yaml` !== parsed.file) {
        report(problems, where, [`\`id: ${template.id}\` doesn't match the filename`]);
    }
    return template.id ? template : null;
};

const projectOf = (
    problems: WorkflowProblem[],
    templates: Template[],
    parsed: ParsedFile,
    snapshotFiles: Record<string, ParsedFile>,
): ProjectView | null => {
    const where = `projects/${parsed.file}`;

    if (!parsed.ok) {
        report(problems, where, [parsed.error]);
        return null;
    }

    const named = isRecord(parsed.value) ? parsed.value.template : null;
    const { project, problems: found } = readProject(
        parsed.value,
        templates.find((candidate) => candidate.id === named)?.types,
    );
    report(problems, where, found);

    if (`${project.id}.yaml` !== parsed.file) {
        report(problems, where, [`\`id: ${project.id}\` doesn't match the filename`]);
    }

    const template = templates.find((candidate) => candidate.id === project.template);

    if (!template) {
        report(problems, where, [`\`template: ${project.template}\` names no template`]);
        return null;
    }

    report(problems, where, projectProblems(project, template));
    return projectView(project, template, snapshotOf(problems, snapshotFiles[project.id]));
};

/** A broken file becomes a problem rather than a throw, so one bad edit never blanks the page. */
export const assembleWorkflows = (
    templateFiles: ParsedFile[],
    projectFiles: ParsedFile[],
    snapshotFiles: Record<string, ParsedFile>,
): Workflows => {
    const problems: WorkflowProblem[] = [];
    const templates = templateFiles.flatMap((parsed) => templateOf(problems, parsed) ?? []);
    const projects = projectFiles.flatMap(
        (parsed) => projectOf(problems, templates, parsed, snapshotFiles) ?? [],
    );

    return { templates, projects, problems };
};
