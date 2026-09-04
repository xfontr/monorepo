import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { at, repoRoot } from "../shared/git.ts";
import { PROJECT_ROOTS } from "../shared/layout.ts";
import type { Doc, ProjectScripts } from "./capabilities.ts";

const read = (path: string): string => readFileSync(path, "utf8");

// `JSON.parse` is `any`, and only the two fields read below are ever touched — asserting the shape
// here keeps that assumption in one place instead of at every call site.
const readJson = (path: string): Record<string, unknown> => JSON.parse(read(path)) as Record<string, unknown>;

const scriptNames = (pkg: Record<string, unknown>): string[] =>
    Object.keys((pkg.scripts ?? {}));

const dirsIn = (path: string): string[] => {
    try {
        return readdirSync(path, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name);
    }
    catch {
        return []; // a project root that doesn't exist yet is not an error, just nothing to list
    }
};

const filesIn = (path: string): string[] => {
    try {
        return readdirSync(path, { withFileTypes: true })
            .filter((entry) => entry.isFile())
            .map((entry) => entry.name);
    }
    catch {
        return [];
    }
};

export const rootScripts = (): string[] => scriptNames(readJson(at("package.json")));

export const projectScripts = (): ProjectScripts[] =>
    PROJECT_ROOTS.flatMap((top) =>
        dirsIn(at(top)).flatMap((dir) => {
            try {
                const pkg = readJson(at(top, dir, "package.json"));
                return [{ root: `${top}/${dir}`, name: String(pkg.name), scripts: scriptNames(pkg) }];
            }
            catch {
                return []; // a directory under packages/ with no package.json isn't a project
            }
        }),
    );

/** `_` holds husky's own generated shim, which is not a hook anyone wrote. */
export const hookNames = (): string[] => filesIn(at(".husky")).filter((name) => !name.startsWith("_"));

export const workflowFiles = (): { file: string, name: string }[] =>
    filesIn(at(".github", "workflows"))
        .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
        .map((file) => ({
            file,
            // The `name:` a workflow gives itself is what GitHub's Actions tab shows, so it's the
            // name someone would search for, not the filename.
            name: /^name:\s*(.+)$/m.exec(read(at(".github", "workflows", file)))?.[1]?.trim() ?? file,
        }));

const skillsUnder = (dir: string, scope?: string): { source: string, name: string, scope?: string }[] =>
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
            // The frontmatter `name` is what the Skill tool dispatches on; the directory name only
            // happens to match it today.
            name: /^name:\s*(.+)$/m.exec(read(at(source)))?.[1]?.trim() ?? source,
            scope,
        }));

/**
 * Repo-level skills plus the per-project ones, which are scoped to the project they sit in and so
 * are invisible from the root `.claude/` directory.
 */
export const skillFiles = (): { source: string, name: string, scope?: string }[] => [
    ...skillsUnder(".claude/skills"),
    ...PROJECT_ROOTS.flatMap((top) =>
        dirsIn(at(top)).flatMap((dir) => skillsUnder(`${top}/${dir}/.claude/skills`, dir)),
    ),
];

const IGNORED_DIRS = ["node_modules", ".git", ".nx", "dist", ".output", ".nuxt"];

const walkMarkdown = (dir: string, found: string[] = []): string[] => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory() && !IGNORED_DIRS.includes(entry.name)) {
            walkMarkdown(join(dir, entry.name), found);
        }
        else if (entry.isFile() && entry.name.endsWith(".md")) {
            found.push(relative(repoRoot(), join(dir, entry.name)));
        }
    }
    return found;
};

export const MAP_PATH = "docs/FEATURES.md";

/**
 * Every markdown file that could explain a capability. Three exclusions, each because a match
 * there would be a false positive rather than an answer: `CHANGELOG.md` is generated and names a
 * commit; `docs/reviews/` scores the repo at a point in time and mentions a capability to rate it,
 * not to explain it; and the map itself lists every capability, so it would document all of them.
 */
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
