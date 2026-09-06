import { assertNotFlagLike } from "../../shared/adapters/exec.ts";
import { gh } from "../../shared/adapters/gh.ts";
import { isMissingChecksError } from "../domain/checks.ts";

/**
 * `gh pr view` exits non-zero when the branch has no PR at all, which is the normal "first push on
 * this branch" case rather than a failure — so this swallows that and hands `main.ts` `undefined` to
 * fall through to `createPr` on, instead of every caller having to know which `gh` errors are fine.
 */
export const prUrlForBranch = (branch: string): string | undefined => {
    try {
        return gh("pr", "view", assertNotFlagLike(branch, "branch"), "--json", "url", "-q", ".url");
    }
    catch {
        return undefined;
    }
};

/** `--fill` takes the title and body from the branch's one commit, or its commits' summary. */
export const createPr = (): string => gh("pr", "create", "--fill");

export const enableAutoMerge = (url: string, method: string): void => {
    gh("pr", "merge", "--auto", `--${method}`, assertNotFlagLike(url, "PR url"));
};

export type ChecksResult = {
    passed: boolean
    /** `gh`'s own per-check table — the part worth showing on a failure, so the terminal names
     * which check failed instead of just that one did. */
    output: string
};

/**
 * Right after a push, GitHub can take a few seconds to attach any check run to the new commit at
 * all. `gh pr checks` doesn't wait that out — it errors immediately with "no checks reported",
 * which is otherwise indistinguishable, at the process-exit-code level, from a genuine failing
 * check. A few retries a few seconds apart cover that registration lag; a real failure never
 * carries this message, so it still returns on the first try.
 */
const CHECK_REGISTRATION_ATTEMPTS = 5;
const CHECK_REGISTRATION_DELAY_MS = 3_000;

/** Blocks the one thread that matters here — every other call in this script is synchronous top to
 * bottom, and dragging `await` through `main.ts` for one retry loop would buy nothing. */
const wait = (ms: number): void => {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, ms);
};

const errorText = (error: unknown): string => {
    const { stdout, stderr } = error as { stdout?: Buffer | string, stderr?: Buffer | string };
    return [stdout, stderr].map((part) => part?.toString().trim() ?? "").filter(Boolean).join("\n");
};

/**
 * Blocks until every check on the PR concludes, same as running it by hand — the wait itself *is*
 * the "don't babysit the browser" part of `pnpm issue:ship`. `gh` exits non-zero the moment any
 * check fails or is cancelled, and its table of results is on `stdout` of that same failed process
 * — `run()` only returns stdout on success, so a failure has to read it back off the caught error.
 */
export const watchChecks = (url: string, attemptsLeft = CHECK_REGISTRATION_ATTEMPTS): ChecksResult => {
    try {
        return { passed: true, output: gh("pr", "checks", assertNotFlagLike(url, "PR url"), "--watch") };
    }
    catch (error) {
        const output = errorText(error);
        if (isMissingChecksError(output) && attemptsLeft > 1) {
            wait(CHECK_REGISTRATION_DELAY_MS);
            return watchChecks(url, attemptsLeft - 1);
        }
        return { passed: false, output };
    }
};

export const prMerged = (url: string): boolean =>
    gh("pr", "view", assertNotFlagLike(url, "PR url"), "--json", "state", "-q", ".state") === "MERGED";
