import { out } from "../shared/adapters/io.ts";
import { flag, type Args } from "../shared/cli.ts";
import { ExpectedError } from "../shared/errors.ts";
import { createTicket, milestoneIssues } from "./adapters/gh.ts";
import { oneProject, readProject, readTemplate } from "./adapters/files.ts";
import { bundleFor, planFiling, readMap } from "./domain/filing.ts";
import { toSnapshot } from "./domain/snapshot.ts";

/**
 * Turns a block of the map into GitHub tickets, together with the blocks the project's ticket size
 * bundles it with, or exactly the blocks named; a dry run unless `--yes`.
 */
export const file = ({ positionals }: Args): void => {
    const [projectId, capability, ...rest] = positionals;

    if (!capability) {
        throw new ExpectedError(
            "Usage: pnpm workflow:file <project> <capability> [<capability>…] [--yes]",
        );
    }

    const id = oneProject([projectId ?? ""]);
    const project = readProject(id);
    const templateId = (project as { template?: unknown } | null)?.template;
    const template = typeof templateId === "string" ? readTemplate(templateId) : null;

    if (!template) throw new ExpectedError(`${id}.yaml names no template that exists.`);

    const map = readMap(template, project);
    const { issues } = toSnapshot(map.milestone, milestoneIssues(map.milestone), [], new Map(), "");
    const { ids, later } =
        rest.length > 0
            ? { ids: [capability, ...rest], later: [] }
            : bundleFor(map, issues, capability);
    const filing = planFiling(map, issues, ids);

    if (!filing.ok) throw new ExpectedError(`Not filed: ${filing.reason}.`);

    const write = flag("yes");

    for (const ticket of filing.tickets) {
        const links = ticket.blockedBy.map((number) => `#${number}`).join(" ") || "nothing";
        const points =
            ticket.complexity === null ? "unestimated" : `complexity ${ticket.complexity}`;
        const summary = `${ticket.title}\n  labels ${ticket.labels.join(", ")} · milestone ${map.milestone} · blocked by ${links} · ${points}`;

        if (!write) {
            out.info(summary);
            continue;
        }

        out.success(`${createTicket({ ...ticket, milestone: map.milestone })}\n  ${ticket.title}`);
    }

    for (const reason of later) out.note(`Left for a later ticket: ${reason}.`);
    if (!write) out.note("Nothing was filed. Run it again with --yes to create these tickets.");
};
