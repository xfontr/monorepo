import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { readWorkflowFiles } from "../../server/utils/workflowFiles.ts";
import { assembleWorkflows, type Template, type WorkflowProblem } from "../../shared/workflows.ts";

/** Paths a capability's `reuse.from` points at that don't exist, relative to the workspace root. */
export const missingReusePaths = (
    templates: Template[],
    workspaceRoot: string,
): WorkflowProblem[] =>
    templates.flatMap((template) =>
        template.capabilities.flatMap((capability) => {
            const from = capability.reuse?.from;

            if (!from || existsSync(resolve(workspaceRoot, from))) return [];

            return [
                {
                    file: `templates/${template.id}.yaml`,
                    message: `capability \`${capability.id}\` reuses \`${from}\`, which doesn't exist`,
                },
            ];
        }),
    );

/** Every rule `docs/workflows/README.md` states, plus the one only a filesystem can check. */
export const workflowProblems = async (
    dir: string,
    workspaceRoot: string,
): Promise<WorkflowProblem[]> => {
    const files = await readWorkflowFiles(dir);
    const { templates, problems } = assembleWorkflows(
        files.templates,
        files.projects,
        files.snapshots,
    );

    return [...problems, ...missingReusePaths(templates, workspaceRoot)];
};
