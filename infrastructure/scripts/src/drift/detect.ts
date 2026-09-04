import { createHash } from "node:crypto";

/** Every project in this repo lives directly under one of these three — see the `new-package` skill. */
export const PROJECT_ROOTS = ["packages", "apps", "infrastructure"];

/**
 * A file at the repo root (README.md, CLAUDE.md, package.json) maps to no project, which is
 * correct here: those are the exact-duplication and structural-assertion cases the other two
 * layers in 0040 already cover, not this one.
 */
export const projectRootFor = (file: string): string | undefined => {
    const [top, name] = file.split("/");
    return top && name && PROJECT_ROOTS.includes(top) ? `${top}/${name}` : undefined;
};

export const projectRootsFor = (files: string[]): string[] =>
    [...new Set(files.map(projectRootFor).filter((root): root is string => root !== undefined))];

export const parseLinesChanged = (numstat: string[]): number =>
    numstat.reduce((sum, line) => {
        const [added, deleted] = line.split("\t");
        return sum + (Number(added) || 0) + (Number(deleted) || 0);
    }, 0);

export const hasRename = (nameStatus: string[]): boolean =>
    nameStatus.some((line) => line.startsWith("R"));

// A stable digest of a project's diff, so a second push with nothing new for that project reads
// as "already warned" instead of nagging on every push until the docs actually get touched.
export const fingerprint = (diff: string): string => createHash("sha1").update(diff).digest("hex");

// ~4 months: long enough that a package under active, well-documented development never trips it.
export const STALE_DOCS_MS = 120 * 24 * 60 * 60 * 1000;

export const BIG_CHANGE_LINES = 200;
export const BIG_CHANGE_FILES = 8;

export type ChangeSize = {
    linesChanged: number
    filesChanged: number
    renamed: boolean
};

/** `undefined` means no markdown file under the project has ever been committed — treated as stale. */
export const isStale = (lastMdCommitMs: number | undefined, now: number): boolean =>
    lastMdCommitMs === undefined || now - lastMdCommitMs >= STALE_DOCS_MS;

export const isBigChange = ({ linesChanged, filesChanged, renamed }: ChangeSize): boolean =>
    renamed || linesChanged >= BIG_CHANGE_LINES || filesChanged >= BIG_CHANGE_FILES;

// Either condition is enough on its own: a big change with fresh docs is still worth a look, and
// so is a small change landing on docs nobody has touched in months.
export const shouldWarn = (size: ChangeSize, lastMdCommitMs: number | undefined, now = Date.now()): boolean =>
    isStale(lastMdCommitMs, now) || isBigChange(size);

export const displayName = (root: string): string =>
    (root.split("/").pop() ?? root)
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
