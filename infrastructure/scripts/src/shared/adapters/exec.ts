import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { ExpectedError } from "../errors.ts";

/**
 * A bare command name resolves via `PATH` search, not shell injection — SonarCloud flags this as
 * unsafe PATH resolution, since something earlier on `PATH` could shadow `git`/`gh` with a
 * lookalike. Falling back to the bare name outside these fixed dirs keeps this working wherever the
 * binary lives.
 */
const KNOWN_DIRS = ["/usr/bin", "/usr/local/bin", "/opt/homebrew/bin"];

const resolve = (command: string): string =>
    KNOWN_DIRS.map((dir) => `${dir}/${command}`).find(existsSync) ?? command;

/**
 * `execFileSync` inherits the child's stderr to this process by default — every caller here already
 * reads a failure back off the caught error, so an unconfigured `stdio` would double every `git`/`gh`
 * error as unformatted text on the terminal too. Piping stdin also keeps a `gh` prompt from reading
 * keystrokes meant for this CLI.
 */
export const run = (command: string, args: string[]): string =>
    execFileSync(resolve(command), args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

/** A `null` status means a signal ended the child — Ctrl+C out of a dev server, not a failure. */
export const inherit = (command: string, args: string[]): number | null =>
    spawnSync(resolve(command), args, { stdio: "inherit" }).status;

/**
 * A value starting with `-` would be read as a flag instead of the flag's value — the injection
 * shape SonarCloud flags where a flag's value is untrusted text (a typed title, a picked label).
 * `run` can't check this itself since it also carries real flags like `--title`, so callers like
 * `createIssue` call this on just their untrusted values.
 */
export const assertNotFlagLike = (value: string, field: string): string => {
    if (value.startsWith("-")) {
        throw new ExpectedError(`${field} can't start with "-" — gh would read it as a flag, not a value: "${value}"`);
    }
    return value;
};
