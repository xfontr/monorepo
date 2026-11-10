import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "yaml";
import type { ParsedFile } from "../../shared/workflows.ts";

export interface WorkflowFiles {
    templates: ParsedFile[];
    projects: ParsedFile[];
    /** Keyed by project id; a project that was never synced has no entry. */
    snapshots: Record<string, ParsedFile>;
}

const SNAPSHOT_SUFFIX = ".snapshot.json";

const namesIn = async (dir: string): Promise<string[]> =>
    (await readdir(dir).catch(() => [] as string[])).sort((a, b) => a.localeCompare(b));

const parseFile = async (
    dir: string,
    file: string,
    parser: (text: string) => unknown,
): Promise<ParsedFile> => {
    try {
        return { file, ok: true, value: parser(await readFile(resolve(dir, file), "utf8")) };
    } catch (cause) {
        return { file, ok: false, error: cause instanceof Error ? cause.message : "unreadable" };
    }
};

/**
 * Every file under `docs/workflows`, parsed but not yet checked. Node-only and free of Nitro
 * globals, because the server route and the `tools/` invariant pass both read through it.
 */
export const readWorkflowFiles = async (dir: string): Promise<WorkflowFiles> => {
    const templatesDir = resolve(dir, "templates");
    const projectsDir = resolve(dir, "projects");
    const [templateNames, projectNames] = await Promise.all([
        namesIn(templatesDir),
        namesIn(projectsDir),
    ]);
    const yamlIn = (names: string[]) => names.filter((name) => name.endsWith(".yaml"));
    const snapshotNames = projectNames.filter((name) => name.endsWith(SNAPSHOT_SUFFIX));

    const [templates, projects, snapshots] = await Promise.all([
        Promise.all(yamlIn(templateNames).map((file) => parseFile(templatesDir, file, parse))),
        Promise.all(yamlIn(projectNames).map((file) => parseFile(projectsDir, file, parse))),
        Promise.all(snapshotNames.map((file) => parseFile(projectsDir, file, JSON.parse))),
    ]);

    return {
        templates,
        projects,
        snapshots: Object.fromEntries(
            snapshots.map((parsed) => [parsed.file.slice(0, -SNAPSHOT_SUFFIX.length), parsed]),
        ),
    };
};
