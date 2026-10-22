import { out } from "../shared/adapters/io.ts";
import { fail, type Args } from "../shared/cli.ts";
import { excerpt } from "../shared/domain/logs.ts";
import { saveLog } from "./adapters/files.ts";
import { failedLog, prChecks, prTitle } from "./adapters/gh.ts";
import {
    externalCheck,
    group,
    headline,
    jobOf,
    stripLogPrefix,
    type Check,
} from "./domain/checks.ts";

const report = (check: Check): string[] => {
    const job = jobOf(check);
    if (!job) return externalCheck(check);

    const log = stripLogPrefix(failedLog(job.run, job.job));
    const path = saveLog(job.job, log);
    const { lines, omitted } = excerpt(log);

    return [
        `✖ ${check.workflow ? `${check.workflow} / ` : ""}${check.name}`,
        ...lines.map((line) => `  ${line}`),
        omitted > 0 ? `  … ${omitted} more lines in ${path}` : `  full log: ${path}`,
    ];
};

export const main = ({ positionals }: Args): void => {
    const [pr] = positionals;
    const grouped = group(prChecks(pr));

    out.info(headline(prTitle(pr), grouped));
    for (const check of grouped.pending) out.info(`… ${check.name} (${check.state.toLowerCase()})`);
    for (const check of grouped.failed) out.info(report(check).join("\n"));

    if (grouped.failed.length > 0)
        fail(`${grouped.failed.length} failing check${grouped.failed.length === 1 ? "" : "s"}.`);
};
