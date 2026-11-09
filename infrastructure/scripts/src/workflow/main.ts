import { out } from "../shared/adapters/io.ts";
import type { Args } from "../shared/cli.ts";
import { ExpectedError } from "../shared/errors.ts";
import { areaIssuesWithoutMilestone, milestoneIssues } from "./adapters/gh.ts";
import { commitLog } from "./adapters/git.ts";
import {
    projectIds,
    readProject,
    readSnapshot,
    snapshotPath,
    writeSnapshot,
} from "./adapters/files.ts";
import {
    activityByIssue,
    describeSnapshot,
    sameIssues,
    syncTargetOf,
    toSnapshot,
} from "./domain/snapshot.ts";

export const main = ({ positionals }: Args): void => {
    const known = projectIds();
    const ids = positionals.length > 0 ? positionals : known;

    if (ids.length === 0) throw new ExpectedError("No project under docs/workflows/projects/ yet.");

    const unknown = ids.filter((id) => !known.includes(id));
    if (unknown.length > 0) {
        throw new ExpectedError(
            `No project file for ${unknown.join(", ")}. Known: ${known.join(", ")}.`,
        );
    }

    const activity = activityByIssue(commitLog());

    for (const id of ids) {
        const read = syncTargetOf(readProject(id));

        if ("problem" in read)
            throw new ExpectedError(`${id}.yaml can't be synced: ${read.problem}.`);

        const snapshot = toSnapshot(
            read.milestone,
            milestoneIssues(read.milestone),
            read.area ? areaIssuesWithoutMilestone(read.area) : [],
            activity,
            new Date().toISOString(),
        );

        if (sameIssues(readSnapshot(id), snapshot)) {
            out.success(`${id}: unchanged — ${describeSnapshot(snapshot)}.`);
            continue;
        }

        writeSnapshot(id, snapshot);
        out.success(`${id}: wrote ${snapshotPath(id)} — ${describeSnapshot(snapshot)}.`);
    }
};
