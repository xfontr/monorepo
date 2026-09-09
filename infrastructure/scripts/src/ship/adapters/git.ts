import { assertNotFlagLike } from "../../shared/adapters/exec.ts";
import { git } from "../../shared/adapters/git.ts";
import { ExpectedError } from "../../shared/errors.ts";

export const currentBranch = (): string => git("rev-parse", "--abbrev-ref", "HEAD");

/**
 * `-u` is a no-op after the first push and is what makes `gh pr view <branch>` resolve the branch
 * with no explicit `--repo`/remote lookup of its own. `branch` comes from `currentBranch()` above,
 * not from anything a person typed, but it's still a ref read out of the environment rather than a
 * literal, so it goes through the same check a typed value would.
 */
export const push = (branch: string): void => {
    try {
        git("push", "-u", "origin", assertNotFlagLike(branch, "branch"));
    }
    catch {
        throw new ExpectedError("Push rejected — ensure the code passes the push requirements (branch name, lint, test, typecheck) before shipping.");
    }
};

/**
 * Runs only once the PR has actually merged — leaves the now-merged branch and lands back on
 * `master`, the same two commands a person would type by hand after watching a PR merge in the
 * browser.
 */
export const checkoutMaster = (): void => {
    git("checkout", "master");
};

export const pullMaster = (): void => {
    git("pull", "origin", "master");
};
