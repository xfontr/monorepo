import { execFileSync, spawnSync } from "node:child_process";
import { ExpectedError } from "../errors.ts";

/** Piping both streams keeps child errors and prompts inside this CLI's output handling. */
export const run = (command: string, args: string[]): string =>
    execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

/** A `null` status means a signal ended the child — Ctrl+C out of a dev server, not a failure. */
export const inherit = (command: string, args: string[]): number | null =>
    spawnSync(command, args, { stdio: "inherit" }).status;

/** A value starting with `-` is read as a flag, not a value — the injection shape SonarCloud flags. */
export const assertNotFlagLike = (value: string, field: string): string => {
    if (value.startsWith("-")) {
        throw new ExpectedError(`${field} can't start with "-" — it would be read as a flag, not a value: "${value}"`);
    }
    return value;
};
