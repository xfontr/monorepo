import { assertNotFlagLike } from "../../shared/adapters/exec.ts";
import { git } from "../../shared/adapters/git.ts";

export const currentBranch = (): string => git("rev-parse", "--abbrev-ref", "HEAD");

/**
 * `-u` is a no-op after the first push and is what makes `gh pr view <branch>` resolve the branch
 * with no explicit `--repo`/remote lookup of its own. `branch` comes from `currentBranch()` above,
 * not from anything a person typed, but it's still a ref read out of the environment rather than a
 * literal, so it goes through the same check a typed value would.
 */
export const push = (branch: string): void => {
    git("push", "-u", "origin", assertNotFlagLike(branch, "branch"));
};
