import { out } from "../shared/adapters/io.ts";
import type { Args } from "../shared/cli.ts";
import { ExpectedError } from "../shared/errors.ts";
import { milestoneIssues } from "./adapters/gh.ts";
import { oneProject, readProject } from "./adapters/files.ts";
import { describeQueue } from "./domain/queue.ts";
import { syncTargetOf, toSnapshot } from "./domain/snapshot.ts";

/** What can be taken now, read live from GitHub rather than from the last snapshot. */
export const next = ({ positionals }: Args): void => {
    const id = oneProject(positionals);
    const read = syncTargetOf(readProject(id));

    if ("problem" in read) throw new ExpectedError(`${id}.yaml can't be read: ${read.problem}.`);

    const { issues } = toSnapshot(
        read.milestone,
        milestoneIssues(read.milestone),
        [],
        new Map(),
        "",
    );
    const lines = describeQueue(issues);

    if (lines.length === 0) {
        out.success(`${id}: nothing open in ${read.milestone}.`);
        return;
    }

    out.note(lines.join("\n"), `${id} · ${read.milestone}`);
};
