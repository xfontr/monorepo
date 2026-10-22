import { out } from "../shared/adapters/io.ts";
import type { Args } from "../shared/cli.ts";
import { ExpectedError } from "../shared/errors.ts";
import { decisions, exists, projectDirs } from "./adapters/files.ts";
import { issueStatus, viewThread } from "./adapters/gh.ts";
import { currentBranch } from "./adapters/git.ts";
import { issueFromBranch } from "./domain/branch.ts";
import {
    blockersIn,
    decisionNumbersIn,
    docsIn,
    issueNumberFrom,
    projectsFor,
    referencedIssues,
    relevantDecisions,
    renderBrief,
    threadText,
    type IssueStatus,
} from "./domain/brief.ts";

const USAGE =
    "Name an issue — pnpm issue:brief <number> — or run it on a <type>/<board>/<number>-<slug> branch.";

const statusOf = (number: number): IssueStatus => {
    try {
        return issueStatus(number);
    } catch {
        return { number, title: "(couldn't read it)", state: "UNKNOWN" };
    }
};

export const brief = ({ positionals }: Args): void => {
    const [requested] = positionals;
    const branch = issueFromBranch(currentBranch());
    const number = requested ? issueNumberFrom(requested) : branch?.number;
    if (!number) throw new ExpectedError(USAGE);

    const thread = viewThread(number);
    const text = threadText(thread);
    const boardSlug = branch?.number === number ? branch.board : undefined;

    out.info(
        renderBrief({
            thread,
            blockers: blockersIn(thread.body).map(statusOf),
            decisions: relevantDecisions(
                decisions(),
                [number, ...referencedIssues(thread)],
                decisionNumbersIn(text),
            ),
            projects: projectsFor(thread, boardSlug, projectDirs()).map((dir) => ({
                dir,
                agents: exists(`${dir}/AGENTS.md`) ? `${dir}/AGENTS.md` : undefined,
            })),
            docs: docsIn(text, exists),
        }),
    );
};
