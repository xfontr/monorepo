import { out } from "../shared/adapters/io.ts";
import { flag, type Args } from "../shared/cli.ts";
import { ExpectedError } from "../shared/errors.ts";
import { createTicket, milestoneIssues } from "./adapters/gh.ts";
import { oneProject, readProject, readTemplate } from "./adapters/files.ts";
import { planFiling, readMap } from "./domain/filing.ts";
import { toSnapshot } from "./domain/snapshot.ts";

/** Turns one block of the map into GitHub tickets; a dry run unless `--yes`. */
export const file = ({ positionals }: Args): void => {
    const [projectId, capability, ...rest] = positionals;

    if (!capability || rest.length > 0) {
        throw new ExpectedError("Usage: pnpm workflow:file <project> <capability> [--yes]");
    }

    const id = oneProject([projectId ?? ""]);
    const project = readProject(id);
    const templateId = (project as { template?: unknown } | null)?.template;
    const template = typeof templateId === "string" ? readTemplate(templateId) : null;

    if (!template) throw new ExpectedError(`${id}.yaml names no template that exists.`);

    const map = readMap(template, project);
    const { issues } = toSnapshot(map.milestone, milestoneIssues(map.milestone), [], new Map(), "");
    const filing = planFiling(map, issues, capability);

    if (!filing.ok) throw new ExpectedError(`Not filed: ${filing.reason}.`);

    const write = flag("yes");

    for (const ticket of filing.tickets) {
        const links = ticket.blockedBy.map((number) => `#${number}`).join(" ") || "nothing";
        const summary = `${ticket.title}\n  labels ${ticket.labels.join(", ")} · milestone ${map.milestone} · blocked by ${links}`;

        if (!write) {
            out.info(summary);
            continue;
        }

        out.success(`${createTicket({ ...ticket, milestone: map.milestone })}\n  ${ticket.title}`);
    }

    if (!write) out.note("Nothing was filed. Run it again with --yes to create these tickets.");
};
