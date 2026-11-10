import {
    appendFileSync,
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    renameSync,
    rmSync,
} from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { at } from "../../shared/adapters/git.ts";
import { usageBufferPath } from "../../shared/adapters/usage.ts";

const LOG_ROOT = ".telemetry";

const FLUSHING = /\.(\d+)\.flushing$/;

/** `kill(pid, 0)` sends nothing; it throws `ESRCH` only when no such process exists. */
const isAlive = (pid: number): boolean => {
    try {
        process.kill(pid, 0);
        return true;
    } catch (error) {
        return (error as NodeJS.ErrnoException).code !== "ESRCH";
    }
};

/**
 * The buffer is renamed before it is read, so a script that finishes mid-flush appends to a fresh
 * file instead of one about to be deleted. A `.flushing` is adopted only once its flush has died,
 * since another worktree's commit may be flushing it right now.
 */
export const takeBuffer = (log: string): { text: string; discard: () => void } => {
    const buffer = usageBufferPath(log);
    const directory = dirname(buffer);
    const taken = `${buffer}.${process.pid}.flushing`;
    const files = existsSync(directory)
        ? readdirSync(directory)
              .filter((name) => {
                  const pid = FLUSHING.exec(name)?.[1];
                  return pid !== undefined && !isAlive(Number(pid));
              })
              .map((name) => join(directory, name))
        : [];

    try {
        renameSync(buffer, taken);
        files.push(taken);
    } catch {
        // No buffer, or a concurrent flush renamed it first: nothing of ours to take.
    }

    return {
        text: files.map((file) => readFileSync(file, "utf8")).join(""),
        discard: () => files.forEach((file) => rmSync(file, { force: true })),
    };
};

/** Returns the repo-relative path written to. */
export const appendToLog = (
    log: string,
    file: string,
    columns: readonly string[],
    lines: string[],
): string => {
    const path = `${LOG_ROOT}/${log}/${file}`;
    const absolute = at(path);

    mkdirSync(dirname(absolute), { recursive: true });
    const header = existsSync(absolute) ? "" : `${columns.join(",")}\n`;
    appendFileSync(absolute, `${header}${lines.join("\n")}\n`);

    return path;
};
