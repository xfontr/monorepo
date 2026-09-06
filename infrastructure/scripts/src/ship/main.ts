import process from "node:process";
import { out } from "../shared/adapters/io.ts";
import { ExpectedError } from "../shared/errors.ts";
import { createPr, enableAutoMerge, prUrlForBranch, waitForMerge, watchChecks } from "./adapters/gh.ts";
import { checkoutMaster, currentBranch, pullMaster, push } from "./adapters/git.ts";
import { shipMessage } from "./domain/report.ts";

/**
 * Matches this repo's `viewerDefaultMergeMethod` (`gh repo view --json viewerDefaultMergeMethod`).
 * A constant rather than a flag: nobody remembers to pass one every time, and the day this repo
 * switches to squash or rebase merges, this is the one line that needs to change.
 */
const MERGE_METHOD = "merge";

/**
 * Anything already open for this branch is reused rather than re-created — `gh pr create` errors on
 * a second PR for the same branch, and re-running `issue:ship` after a check failure is the normal
 * "fixed it, ship again" path, not a fresh one.
 */
const prUrl = (branch: string): string => {
    const existing = prUrlForBranch(branch);
    if (existing) return existing;

    out.info("No PR for this branch yet — creating one.");
    return createPr();
};

export const main = (): void => {
    const branch = currentBranch();
    if (branch === "master") throw new ExpectedError("On master — nothing to ship from here.");

    out.begin(`🚀 Shipping ${branch}`);

    push(branch);
    const url = prUrl(branch);
    out.note(url, "PR");

    enableAutoMerge(url, MERGE_METHOD);

    const loading = out.spinner();
    loading.start("Watching checks — this blocks until they conclude...");
    const { passed, output } = watchChecks(url);
    loading.stop(passed ? "Checks passed." : "A check failed.");
    if (!passed) out.note(output, "Checks");

    const merged = passed && waitForMerge(url);

    if (merged) {
        checkoutMaster();
        pullMaster();
    }

    out.end(shipMessage({ checksPassed: passed, merged }));

    if (!passed) process.exitCode = 1;
};
