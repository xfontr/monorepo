import { out } from "../shared/adapters/io.ts";
import { fail, type Args } from "../shared/cli.ts";
import { excerpt } from "../shared/domain/logs.ts";
import { saveLog } from "./adapters/files.ts";
import { failedLog, prChecks, prTitle } from "./adapters/gh.ts";
import { openIssues } from "./adapters/sonar.ts";
import {
    externalCheck,
    group,
    headline,
    jobOf,
    sonarIssueLines,
    sonarPullRequestOf,
    stripLogPrefix,
    type Check,
    type SonarPullRequest,
} from "./domain/checks.ts";

const sonarReport = async (check: Check, sonar: SonarPullRequest): Promise<string[]> => {
    try {
        const issues = await openIssues(sonar);

        return [...externalCheck(check), ...sonarIssueLines(sonar, issues)];
    } catch (error) {
        return [
            ...externalCheck(check),
            `  Sonar's issues didn't load: ${(error as Error).message}`,
        ];
    }
};

const report = async (check: Check): Promise<string[]> => {
    const sonar = sonarPullRequestOf(check);
    if (sonar) return sonarReport(check, sonar);

    const job = jobOf(check);
    if (!job) return externalCheck(check);

    const log = stripLogPrefix(failedLog(job.run, job.job));
    const path = saveLog(job.job, log);
    const { lines, omitted } = excerpt(log);
    const name = check.workflow ? `${check.workflow} / ${check.name}` : check.name;

    return [
        `✖ ${name}`,
        ...lines.map((line) => `  ${line}`),
        omitted > 0 ? `  … ${omitted} more lines in ${path}` : `  full log: ${path}`,
    ];
};

export const main = async ({ positionals }: Args): Promise<void> => {
    const [pr] = positionals;
    const grouped = group(prChecks(pr));

    out.info(headline(prTitle(pr), grouped));
    for (const check of grouped.pending) out.info(`… ${check.name} (${check.state.toLowerCase()})`);
    const reports = await Promise.all(grouped.failed.map(report));
    for (const lines of reports) out.info(lines.join("\n"));

    if (grouped.failed.length > 0)
        fail(`${grouped.failed.length} failing check${grouped.failed.length === 1 ? "" : "s"}.`);
};
