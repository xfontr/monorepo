import { assertNotFlagLike } from "../../shared/adapters/exec.ts";
import { gh } from "../../shared/adapters/gh.ts";

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
 * Blocks until every check on the PR concludes, same as running it by hand — the wait itself *is*
 * the "don't babysit the browser" part of `pnpm issue:ship`. `gh` exits non-zero the moment any
 * check fails or is cancelled, and its table of results is on `stdout` of that same failed process
 * — `run()` only returns stdout on success, so a failure has to read it back off the caught error.
 */
export const watchChecks = (url: string): ChecksResult => {
    try {
        return { passed: true, output: gh("pr", "checks", assertNotFlagLike(url, "PR url"), "--watch") };
    }
    catch (error) {
        const output = (error as { stdout?: Buffer | string }).stdout?.toString().trim() ?? "";
        return { passed: false, output };
    }
};

export const prMerged = (url: string): boolean =>
    gh("pr", "view", assertNotFlagLike(url, "PR url"), "--json", "state", "-q", ".state") === "MERGED";
