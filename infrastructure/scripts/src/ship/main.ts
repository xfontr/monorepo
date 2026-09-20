import process from "node:process";
import { out } from "../shared/adapters/io.ts";
import { ExpectedError } from "../shared/errors.ts";
import { createPr, enableAutoMerge, prUrlForBranch, waitForMerge, watchChecks } from "./adapters/gh.ts";
import { checkoutMaster, currentBranch, pullMaster, push } from "./adapters/git.ts";
import { shipReport } from "./domain/report.ts";

const MERGE_METHOD = "merge";

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
    const report = shipReport({ checksPassed: passed, merged });

    if (report.syncMaster) {
        checkoutMaster();
        pullMaster();
    }

    out.end(report.message);

    if (report.exitCode !== undefined) process.exitCode = report.exitCode;
};
