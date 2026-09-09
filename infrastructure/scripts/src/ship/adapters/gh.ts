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

// ~7 checks across 3 services, each registering on its own schedule after a push
const CHECK_REGISTRATION_BUDGET_MS = 60_000;
const CHECK_REGISTRATION_INTERVAL_MS = 5_000;

/** Auto-merge only queues at this point — GitHub takes a further beat to actually execute the merge. */
const MERGE_POLL_BUDGET_MS = 45_000;
const MERGE_POLL_INTERVAL_MS = 3_000;

/** Blocks the one thread that matters here — every other call in this script is synchronous top to
 * bottom, and dragging `await` through `main.ts` for two retry loops would buy nothing. */
const wait = (ms: number): void => {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, ms);
};

const errorText = (error: unknown): string => {
    const { stdout, stderr } = error as { stdout?: Buffer | string, stderr?: Buffer | string };
    return [stdout, stderr].map((part) => part?.toString().trim() ?? "").filter(Boolean).join("\n");
};

/**
 * `gh` exits non-zero the moment any check fails or is cancelled, and its table of results is on
 * `stdout` of that same failed process — `run()` only returns stdout on success, so a failure has
 * to read it back off the caught error.
 */
export const watchChecks = (url: string, deadline = Date.now() + CHECK_REGISTRATION_BUDGET_MS): ChecksResult => {
    try {
        return { passed: true, output: gh("pr", "checks", assertNotFlagLike(url, "PR url"), "--watch") };
    }
    catch (error) {
        const output = errorText(error);
        // "no checks reported" also means "hasn't registered yet" — indistinguishable from a real
        // failure by exit code alone, which never carries this message, so retrying is safe
        if (isMissingChecksError(output) && Date.now() < deadline) {
            wait(CHECK_REGISTRATION_INTERVAL_MS);
            return watchChecks(url, deadline);
        }
        return { passed: false, output };
    }
};

const prState = (url: string): string =>
    gh("pr", "view", assertNotFlagLike(url, "PR url"), "--json", "state", "-q", ".state");

/** Polls a bounded window rather than reading state once, so the checkout below can fire on this same run instead of a lucky next one. */
export const waitForMerge = (url: string, deadline = Date.now() + MERGE_POLL_BUDGET_MS): boolean => {
    if (prState(url) === "MERGED") return true;
    if (Date.now() >= deadline) return false;
    wait(MERGE_POLL_INTERVAL_MS);
    return waitForMerge(url, deadline);
};
