import { join } from "node:path";
import { run } from "./exec.ts";

export const git = (...args: string[]): string => run("git", args);

let root: string | undefined;

export const repoRoot = (): string => (root ??= git("rev-parse", "--show-toplevel"));

/** pnpm may set cwd to this package, so repo-relative paths resolve from the actual Git root. */
export const at = (...parts: string[]): string => join(repoRoot(), ...parts);
