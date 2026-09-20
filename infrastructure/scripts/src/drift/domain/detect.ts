import { createHash } from "node:crypto";
import { PROJECT_ROOTS, titleCase } from "../../shared/domain/layout.ts";

/** A file at the repo root (README.md, AGENTS.md, package.json) maps to no project on purpose. */
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

// Stable SHA-256 fingerprints suppress repeated warnings without treating this as security.
export const fingerprint = (diff: string): string => createHash("sha256").update(diff).digest("hex");

export type FingerprintTransition = {
    seen: Record<string, string>
    isNew: boolean
};

export const recordFingerprint = (
    seen: Record<string, string>,
    root: string,
    diff: string,
): FingerprintTransition => {
    const value = fingerprint(diff);
    if (seen[root] === value) return { seen, isNew: false };

    return { seen: { ...seen, [root]: value }, isNew: true };
};

// 120 days is the stale-docs threshold.
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

export const shouldWarn = (size: ChangeSize, lastMdCommitMs: number | undefined, now = Date.now()): boolean =>
    isStale(lastMdCommitMs, now) || isBigChange(size);

export const displayName = (root: string): string =>
    (root.split("/").pop() ?? root)
        .split("-")
        .map(titleCase)
        .join(" ");
