import { execFileSync } from "node:child_process";

const git = (...args: string[]): string => execFileSync("git", args, { encoding: "utf8" }).trim();

/**
 * `pnpm docs:drift` runs with cwd set to this package's own directory (`pnpm --filter` changes
 * into it before running the script), not the repo root — so a plain relative pathspec like
 * "packages/ui" would resolve against `infrastructure/scripts/packages/ui`, which doesn't exist,
 * and match nothing. Resolving every root against the actual repo root up front sidesteps that
 * regardless of where the process happens to be invoked from.
 */
const REPO_ROOT = git("rev-parse", "--show-toplevel");
const absolute = (root: string): string => `${REPO_ROOT}/${root}`;

export const mergeBase = (ref: string): string => git("merge-base", "HEAD", ref);

export const changedFiles = (base: string, head: string): string[] =>
    git("diff", "--name-only", `${base}..${head}`).split("\n").filter(Boolean);

export const diffNumstat = (base: string, head: string, root: string): string[] =>
    git("diff", "--numstat", `${base}..${head}`, "--", absolute(root)).split("\n").filter(Boolean);

export const diffNameStatus = (base: string, head: string, root: string): string[] =>
    git("diff", "--name-status", `${base}..${head}`, "--", absolute(root)).split("\n").filter(Boolean);

export const diffText = (base: string, head: string, root: string): string =>
    git("diff", `${base}..${head}`, "--", absolute(root));

/**
 * `:(glob)` turns on `**` for this one pathspec without needing `--glob-pathspecs` for the whole
 * invocation, which would also change how every other pathspec in the process is read. Empty
 * output means no commit has ever touched a markdown file under `root` — a package with no docs
 * at all, not a stale-but-existing one.
 */
export const lastMdCommitEpochSeconds = (root: string): string =>
    git("log", "-1", "--format=%ct", "--", `:(glob)${absolute(root)}/**/*.md`);
