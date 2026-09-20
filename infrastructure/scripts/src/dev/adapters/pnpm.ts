import { createRequire } from "node:module";
import process from "node:process";
import { inherit } from "../../shared/adapters/exec.ts";
import { repoRoot } from "../../shared/adapters/git.ts";

/** Resolve the dependency with Node's lookup; a directory check can pass while the import fails. */
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

/** Nx supplies `name`, so it is not untrusted flag text. */
export const dev = (name: string): number | null => inherit("pnpm", ["--filter", name, "run", "dev"]);
