import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { ESLint, type Linter } from "eslint";
import { WORKSPACE_ROOT } from "./paths.ts";

/** Rules differ by file kind (Vue blocks, spec globals), so one file of each is sampled. */
const KINDS: ((file: string) => boolean)[] = [
    (file) => file.endsWith(".vue"),
    (file) => file.endsWith(".spec.ts"),
    (file) => file.endsWith(".ts") && !file.endsWith(".spec.ts"),
];

/** A config ignores some files outright (its own config, generated code), so a few are tried. */
const TRIES_PER_KIND = 3;

const isOn = (entry: Linter.RuleEntry | undefined): boolean => {
    const severity = Array.isArray(entry) ? entry[0] : entry;
    return severity !== undefined && severity !== 0 && severity !== "off";
};

const projectOf = (file: string): string | undefined => {
    const [root, name] = file.split("/");
    return root && name ? `${root}/${name}` : undefined;
};

const rulesOf = async (project: string, files: string[]): Promise<string[]> => {
    const cwd = resolve(WORKSPACE_ROOT, project);
    if (!existsSync(resolve(cwd, "eslint.config.ts"))) return [];

    const eslint = new ESLint({ cwd });
    const samples = KINDS.flatMap((kind) => files.filter(kind).slice(0, TRIES_PER_KIND));
    const configs = (await Promise.all(
        samples.map((file) => eslint.calculateConfigForFile(resolve(WORKSPACE_ROOT, file))),
    )) as (Linter.Config | undefined)[];

    return configs.flatMap((config) =>
        Object.entries(config?.rules ?? {})
            .filter(([, entry]) => isOn(entry))
            .map(([rule]) => rule),
    );
};

/**
 * Every rule switched on for any sampled file of any project with an `eslint.config.ts`. A project
 * whose config fails to load is skipped, so one broken config can't fail the snapshot.
 */
export const enabledRules = async (trackedFiles: string[]): Promise<string[]> => {
    const byProject = new Map<string, string[]>();
    for (const file of trackedFiles) {
        const project = projectOf(file);
        if (project) byProject.set(project, [...(byProject.get(project) ?? []), file]);
    }

    const rules = await Promise.all(
        [...byProject].map(([project, files]) => rulesOf(project, files).catch(() => [])),
    );

    return [...new Set(rules.flat())].sort((a, b) => a.localeCompare(b));
};
