import { git } from "../shared/git.ts";

/**
 * The first local branch already named after this issue, if any. Branch names start with the issue
 * number for exactly this reason: coming back to a ticket should reuse the branch, not fail on
 * `git checkout -b` because the name is taken.
 */
export const branchForIssue = (issue: number): string | undefined =>
    git("branch", "--format=%(refname:short)")
        .split("\n")
        .find((name) => new RegExp(`^[^/]+/${issue}-`).test(name));

export const checkout = (branch: string): void => void git("checkout", branch);

export const currentBranch = (): string => git("branch", "--show-current");
