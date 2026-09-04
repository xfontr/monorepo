import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

/**
 * `execFileSync` never spawns a shell, so args can't smuggle in shell metacharacters — but a bare
 * command name still resolves by searching `PATH`, which is what SonarCloud's "OS commands should
 * not rely on PATH resolution" flags: something earlier on `PATH` could shadow `git`/`gh` with a
 * lookalike. Checking these fixed, unwriteable locations first pins the real binary without
 * hardcoding one platform's layout; falling back to the bare name keeps this working wherever the
 * binary lives outside the list, same as before this existed.
 */
const KNOWN_DIRS = ["/usr/bin", "/usr/local/bin", "/opt/homebrew/bin"];

const resolve = (command: string): string =>
    KNOWN_DIRS.map((dir) => `${dir}/${command}`).find(existsSync) ?? command;

export const run = (command: string, args: string[]): string =>
    execFileSync(resolve(command), args, { encoding: "utf8" }).trim();

/**
 * A value that starts with `-` would be read as a flag of its own rather than as the value of the
 * flag before it — the argument-injection shape SonarCloud flags where a flag's value is text this
 * tooling didn't author itself (a typed issue title, a picked label). `run` can't apply this: it
 * also carries the flags themselves (`"--title"`), which legitimately start with `-`. Only a
 * caller that knows which of its arguments are untrusted values, not flags, can tell them apart —
 * so this is exported for `createIssue` to call on exactly those.
 */
export const assertNotFlagLike = (value: string, field: string): string => {
    if (value.startsWith("-")) {
        throw new Error(`${field} can't start with "-" — gh would read it as a flag, not a value: "${value}"`);
    }
    return value;
};
