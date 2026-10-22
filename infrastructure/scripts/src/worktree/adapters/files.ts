import { copyFileSync, existsSync, mkdirSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";

/** Never overwrites, so an env file edited inside the worktree survives a second run. */
export const copyMissing = (from: string, to: string, files: string[]): string[] =>
    files.filter((file) => {
        const target = join(to, file);
        if (existsSync(target)) return false;

        mkdirSync(dirname(target), { recursive: true });
        copyFileSync(join(from, file), target);
        return true;
    });

export const isInstalled = (root: string): boolean => existsSync(join(root, "node_modules"));

export const canonical = (path: string): string => (existsSync(path) ? realpathSync(path) : path);
