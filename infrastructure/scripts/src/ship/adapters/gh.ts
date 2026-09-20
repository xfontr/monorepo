import { assertNotFlagLike } from "../../shared/adapters/exec.ts";
import { gh } from "../../shared/adapters/gh.ts";
import { isMissingChecksError } from "../domain/checks.ts";

/** A missing PR is the normal first-push case, so return `undefined` for `main.ts` to create one. */
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
    /** `gh`'s per-check table, shown when a check fails. */
    output: string
};

// ~7 checks across 3 services, each registering on its own schedule after a push
const CHECK_REGISTRATION_BUDGET_MS = 60_000;
const CHECK_REGISTRATION_INTERVAL_MS = 5_000;

/** Auto-merge only queues at this point — GitHub takes a further beat to actually execute the merge. */
const MERGE_POLL_BUDGET_MS = 60_000;
const MERGE_POLL_INTERVAL_MS = 3_000;

/** Keep retry loops synchronous so the rest of this script stays synchronous. */
const wait = (ms: number): void => {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, ms);
};

const errorText = (error: unknown): string => {
    const { stdout, stderr } = error as { stdout?: Buffer | string, stderr?: Buffer | string };
    return [stdout, stderr].map((part) => part?.toString().trim() ?? "").filter(Boolean).join("\n");
};

/** Failed `gh` checks put their result table on the caught error's stdout. */
export const watchChecks = (url: string, deadline = Date.now() + CHECK_REGISTRATION_BUDGET_MS): ChecksResult => {
    try {
        return { passed: true, output: gh("pr", "checks", assertNotFlagLike(url, "PR url"), "--watch") };
    }
    catch (error) {
        const output = errorText(error);
        // "no checks reported" also means registration is pending, so retry before treating it as failure.
        if (isMissingChecksError(output) && Date.now() < deadline) {
            wait(CHECK_REGISTRATION_INTERVAL_MS);
            return watchChecks(url, deadline);
        }
        return { passed: false, output };
    }
};

const prState = (url: string): string =>
    gh("pr", "view", assertNotFlagLike(url, "PR url"), "--json", "state", "-q", ".state");

/** Polling lets the same run return to master after the merge completes. */
export const waitForMerge = (url: string, deadline = Date.now() + MERGE_POLL_BUDGET_MS): boolean => {
    if (prState(url) === "MERGED") return true;
    if (Date.now() >= deadline) return false;
    wait(MERGE_POLL_INTERVAL_MS);
    return waitForMerge(url, deadline);
};
