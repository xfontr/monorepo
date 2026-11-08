import {
    chmodSync,
    constants,
    copyFileSync,
    existsSync,
    readFileSync,
    realpathSync,
    renameSync,
    statSync,
    writeFileSync,
} from "node:fs";
import process from "node:process";
import { at, git, repoRoot } from "../../shared/adapters/git.ts";

/** Tracked and new-but-unignored examples, repo-relative; ignored ones such as node_modules are skipped. */
export const examplePaths = (): string[] =>
    git(
        "-C",
        repoRoot(),
        "ls-files",
        "--cached",
        "--others",
        "--exclude-standard",
        "--",
        ":(glob)**/.env.example",
    )
        .split("\n")
        .filter((path) => path !== "" && existsSync(at(path)));

export const readText = (path: string): string => readFileSync(at(path), "utf8");

export const readOptional = (path: string): string | null =>
    existsSync(at(path)) ? readText(path) : null;

const stamp = (): string =>
    new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d+Z$/, "Z");

/**
 * Backs the old file up, then swaps the new one in by rename so a crash leaves one whole file.
 * Resolves symlinks first so the link survives. Returns the backup's repo-relative path.
 */
export const writeEnv = (path: string, text: string): string | null => {
    const absolute = at(path);

    if (!existsSync(absolute)) {
        writeFileSync(absolute, text, { mode: 0o600, flag: "wx" });
        return null;
    }

    const target = realpathSync(absolute);
    const mode = statSync(target).mode & 0o777;
    const suffix = `.backup-${stamp()}`;
    const backup = `${target}${suffix}`;
    copyFileSync(target, backup, constants.COPYFILE_EXCL);
    chmodSync(backup, mode);

    const temporary = `${target}.sync-${process.pid}`;
    writeFileSync(temporary, text, { mode, flag: "wx" });
    chmodSync(temporary, mode);
    renameSync(temporary, target);

    return `${path}${suffix}`;
};
