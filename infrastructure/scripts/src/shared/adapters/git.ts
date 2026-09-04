import { join } from "node:path";
import { run } from "./exec.ts";

export const git = (...args: string[]): string => run("git", args);

/**
 * Resolved on first call rather than at module load. Two of the three places that needed the repo
 * root used to compute it while being imported, which meant importing them at all — from a spec,
 * say — spawned a subprocess and failed outside a git checkout.
 */
let root: string | undefined;

export const repoRoot = (): string => (root ??= git("rev-parse", "--show-toplevel"));

/**
 * Every script here runs with cwd set to this package's own directory, because `pnpm --filter`
 * changes into it first — so a plain relative path like "packages/ui" would resolve against
 * `infrastructure/scripts/packages/ui`, which doesn't exist, and match nothing. Resolving against
 * the real repo root sidesteps that wherever the process was invoked from.
 */
export const at = (...parts: string[]): string => join(repoRoot(), ...parts);
