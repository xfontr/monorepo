import { createRequire } from "node:module";
import process from "node:process";
import { inherit } from "../../shared/adapters/exec.ts";
import { repoRoot } from "../../shared/adapters/git.ts";

/**
 * Resolved from this file rather than by looking for a `node_modules` directory: the question is
 * whether the dependencies this script is about to import are reachable, and this is the same
 * lookup Node will do for them. A root install that never reached this package would pass a
 * directory check and still die on the first import.
 */
const isInstalled = (): boolean => {
    try {
        createRequire(import.meta.url).resolve("@clack/prompts");
        return true;
    }
    catch {
        return false;
    }
};

export const ensureInstalled = (): boolean => {
    if (isInstalled()) return true;

    process.stdout.write("No dependencies installed yet — running pnpm install first.\n");

    return inherit("pnpm", ["-C", repoRoot(), "install"]) === 0;
};

/**
 * Hands the terminal over for good. `name` is always one Nx just reported, never typed text, which
 * is why it doesn't go through `assertNotFlagLike` on the way to a flag's value.
 */
export const dev = (name: string): number | null => inherit("pnpm", ["--filter", name, "run", "dev"]);
