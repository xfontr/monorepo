import { git } from "../../shared/adapters/git.ts";

/** Reuse an existing issue branch so checkout does not fail on a duplicate ref. */
export const branchForIssue = (issue: number): string | undefined =>
    git("branch", "--format=%(refname:short)")
        .split("\n")
        .find((name) => new RegExp(`^[^/]+/[^/]+/${issue}-`).test(name));

export const checkout = (branch: string): void => void git("checkout", branch);

export const currentBranch = (): string => git("rev-parse", "--abbrev-ref", "HEAD");
