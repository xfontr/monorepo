import { out } from "../shared/adapters/io.ts";
import { flag, type Args } from "../shared/cli.ts";
import { ExpectedError } from "../shared/errors.ts";
import { closeAsNotPlanned, closeMilestone, milestoneIssues } from "./adapters/gh.ts";
import { commitLog } from "./adapters/git.ts";
import { oneProject, readProject } from "./adapters/files.ts";
import { dropPlan, ticketStatus } from "./domain/queue.ts";
import { activityByIssue, syncTargetOf, toSnapshot } from "./domain/snapshot.ts";

/**
 * Closes the milestone tickets nobody started as not planned, and the milestone once none is left;
 * a dry run unless `--yes`.
 */
export const drop = ({ positionals }: Args): void => {
    const id = oneProject(positionals);
    const read = syncTargetOf(readProject(id));

    if ("problem" in read) throw new ExpectedError(`${id}.yaml can't be read: ${read.problem}.`);

    const { issues } = toSnapshot(
        read.milestone,
        milestoneIssues(read.milestone),
        [],
        activityByIssue(commitLog()),
        "",
    );
    const { close, keep } = dropPlan(issues);
    const write = flag("yes");

    for (const issue of close) {
        if (write) closeAsNotPlanned(issue.number);
        out.info(`${write ? "Closed" : "Closes"} #${issue.number} ${issue.title}`);
    }

    if (keep.length > 0) {
        out.note(
            keep
                .map((issue) => `#${issue.number} ${issue.title} — ${ticketStatus(issue)}`)
                .join("\n"),
            `Kept (${keep.length})`,
        );
    }

    const openKept = keep.some(({ state }) => state === "open");

    if (!write) {
        out.note(
            `Nothing was closed. Run it again with --yes to close ${close.length} tickets` +
                (openKept ? "." : ` and the ${read.milestone} milestone.`),
        );
        return;
    }

    if (!openKept) closeMilestone(read.milestone);
    out.success(
        `${id}: closed ${close.length} tickets` +
            (openKept ? `; ${read.milestone} stays open for the rest.` : ` and ${read.milestone}.`),
    );
};
