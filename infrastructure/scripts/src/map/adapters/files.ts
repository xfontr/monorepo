import { readdirSync, readFileSync, statSync, type Dirent } from "node:fs";
import { join, relative } from "node:path";
import { at, repoRoot } from "../../shared/adapters/git.ts";
import { PROJECT_ROOTS } from "../../shared/domain/layout.ts";
import type { Doc, ProjectScripts } from "../domain/capabilities.ts";

const read = (path: string): string => readFileSync(path, "utf8");

// Assert the parsed package shape once because `JSON.parse` returns `any`.
const readJson = (path: string): Record<string, unknown> => JSON.parse(read(path)) as Record<string, unknown>;

const scriptNames = (pkg: Record<string, unknown>): string[] =>
    Object.keys((pkg.scripts ?? {}));

const entriesIn = (path: string, keep: (entry: Dirent) => boolean): string[] => {
    try {
        return readdirSync(path, { withFileTypes: true }).filter(keep).map((entry) => entry.name);
    }
    catch {
        return [];
    }
};

const dirsIn = (path: string): string[] => entriesIn(path, (entry) => entry.isDirectory());

const filesIn = (path: string): string[] => entriesIn(path, (entry) => entry.isFile());

const nameField = (text: string): string | undefined => /^name:[^\S\n]*(\S.*)$/m.exec(text)?.[1]?.trim();

export const rootScripts = (): string[] => scriptNames(readJson(at("package.json")));

export const projectScripts = (): ProjectScripts[] =>
    PROJECT_ROOTS.flatMap((top) =>
        dirsIn(at(top)).flatMap((dir) => {
            try {
                const pkg = readJson(at(top, dir, "package.json"));
                return [{ root: `${top}/${dir}`, name: String(pkg.name), scripts: scriptNames(pkg) }];
            }
            catch {
                return [];
            }
        }),
    );

export const hookNames = (): string[] => filesIn(at(".husky")).filter((name) => !name.startsWith("_"));

export const workflowFiles = (): { file: string, name: string }[] =>
    filesIn(at(".github", "workflows"))
        .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
        .map((file) => ({
            file,
            // Use the workflow's displayed name rather than its filename.
            name: nameField(read(at(".github", "workflows", file))) ?? file,
        }));

const skillsUnder = (dir: string): { source: string, name: string }[] =>
    dirsIn(at(dir))
        .map((skill) => `${dir}/${skill}/SKILL.md`)
        .filter((source) => {
            try {
                statSync(at(source));
                return true;
            }
            catch {
                return false;
            }
        })
        .map((source) => ({
            source,
            name: nameField(read(at(source))) ?? source,
        }));

export const skillFiles = (): { source: string, name: string }[] => skillsUnder(".agents/skills");

/** Ignore linked worktrees or duplicate docs would make the map branch-dependent. */
const IGNORED_DIRS = ["node_modules", ".git", ".nx", "dist", ".output", ".nuxt", "worktrees"];

const walkMarkdown = (dir: string, found: string[] = []): string[] => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const child = join(dir, entry.name);
        const generatedClaudeSkills = relative(repoRoot(), child) === ".claude/skills";

        if (entry.isDirectory() && !IGNORED_DIRS.includes(entry.name) && !generatedClaudeSkills) {
            walkMarkdown(child, found);
        }
        else if (entry.isFile() && entry.name.endsWith(".md") && entry.name !== "CLAUDE.md") {
            found.push(relative(repoRoot(), child));
        }
    }
    return found;
};

export const MAP_PATH = "docs/FEATURES.md";

/** Three deliberate exclusions from the markdown scan — see ./README.md#-picking-the-doc. */
export const docs = (): Doc[] =>
    walkMarkdown(repoRoot())
        .filter(
            (path) =>
                !path.endsWith("CHANGELOG.md") && !path.startsWith("docs/reviews/") && path !== MAP_PATH,
        )
        .map((path) => ({ path, text: read(at(path)) }));

export const readMap = (): string => {
    try {
        return read(at(MAP_PATH));
    }
    catch {
        return ""; // never rendered before; the diff against "" is the whole file
    }
};
