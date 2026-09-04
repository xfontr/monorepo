import { assertNotFlagLike, run } from "../shared/exec.ts";

const git = (...args: string[]): string => run("git", args);

/**
 * `base`/`head` end up embedded inside one `base..head` token rather than passed as their own
 * args, so a leading `-` on either would otherwise reach `git` unnoticed — checking the joined
 * range wouldn't catch it, since `..` always sits before whatever `head` contributed. Both come
 * from `DOCS_DRIFT_BASE`/`DOCS_DRIFT_HEAD` in [`drift/index.ts`](./index.ts), which is process env
 * rather than a hardcoded ref, so this is the one spot in this file that isn't purely internal.
 */
const range = (base: string, head: string): string =>
    `${assertNotFlagLike(base, "base")}..${assertNotFlagLike(head, "head")}`;

/**
 * `pnpm docs:drift` runs with cwd set to this package's own directory (`pnpm --filter` changes
 * into it before running the script), not the repo root — so a plain relative pathspec like
 * "packages/ui" would resolve against `infrastructure/scripts/packages/ui`, which doesn't exist,
 * and match nothing. Resolving every root against the actual repo root up front sidesteps that
 * regardless of where the process happens to be invoked from.
 */
const REPO_ROOT = git("rev-parse", "--show-toplevel");
const absolute = (root: string): string => `${REPO_ROOT}/${root}`;

export const mergeBase = (ref: string): string => git("merge-base", "HEAD", assertNotFlagLike(ref, "ref"));

export const changedFiles = (base: string, head: string): string[] =>
    git("diff", "--name-only", range(base, head)).split("\n").filter(Boolean);

export const diffNumstat = (base: string, head: string, root: string): string[] =>
    git("diff", "--numstat", range(base, head), "--", absolute(root)).split("\n").filter(Boolean);

export const diffNameStatus = (base: string, head: string, root: string): string[] =>
    git("diff", "--name-status", range(base, head), "--", absolute(root)).split("\n").filter(Boolean);

export const diffText = (base: string, head: string, root: string): string =>
    git("diff", range(base, head), "--", absolute(root));

/**
 * `:(glob)` turns on `**` for this one pathspec without needing `--glob-pathspecs` for the whole
 * invocation, which would also change how every other pathspec in the process is read. Empty
 * output means no commit has ever touched a markdown file under `root` — a package with no docs
 * at all, not a stale-but-existing one.
 */
export const lastMdCommitEpochSeconds = (root: string): string =>
    git("log", "-1", "--format=%ct", "--", `:(glob)${absolute(root)}/**/*.md`);
