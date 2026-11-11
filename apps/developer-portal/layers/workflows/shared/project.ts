import { cycleProblem, readCapability } from "./capability.ts";
import { asText, isRecord, Reader } from "./reader.ts";
import {
    SETTLED_STATES,
    TICKET_SIZES,
    type Capability,
    type Feature,
    type Group,
    type Project,
    type SettledState,
    type Template,
    type TicketSize,
} from "./types.ts";

const readSwitches = (reader: Reader, source: Record<string, unknown>): Project["switches"] => {
    const switches: Project["switches"] = {};

    for (const [id, value] of Object.entries(reader.record(source, "switches", "project"))) {
        if (typeof value === "boolean") switches[id] = value;
        else reader.problems.push(`switch \`${id}\` must be true or false`);
    }

    return switches;
};

const readSettled = (reader: Reader, source: Record<string, unknown>): Project["settled"] => {
    const settled: Project["settled"] = {};

    for (const [id, value] of Object.entries(reader.record(source, "settled", "project"))) {
        const entry = isRecord(value) ? value : {};
        const status = asText(entry.status) ?? "";

        if ((SETTLED_STATES as readonly string[]).includes(status)) {
            const on = asText(entry.on);

            if (on !== null && !/^\d{4}-\d{2}-\d{2}$/.test(on)) {
                reader.problems.push(`settled \`${id}\`: \`on\` must be a YYYY-MM-DD date`);
            }
            settled[id] = { status: status as SettledState, note: asText(entry.note) ?? "", on };
        } else {
            reader.problems.push(
                `settled \`${id}\`: \`status: ${status || "(missing)"}\` isn't one of ${SETTLED_STATES.join(", ")}`,
            );
        }
    }

    return settled;
};

const readTicketSize = (reader: Reader, source: Record<string, unknown>): TicketSize => {
    const size = reader.text(source, "ticketSize", "project", "block");

    if ((TICKET_SIZES as readonly string[]).includes(size)) return size as TicketSize;

    reader.problems.push(`\`ticketSize: ${size}\` isn't one of ${TICKET_SIZES.join(", ")}`);
    return "block";
};

/**
 * A project read from parsed YAML. Rules that need its template — a switch on a capability that
 * doesn't exist — live in `projectProblems`, because the template may be the broken file.
 */
export const readProject = (raw: unknown): { project: Project; problems: string[] } => {
    const reader = new Reader();
    const source = isRecord(raw) ? raw : {};

    if (!isRecord(raw)) reader.problems.push("the file isn't a mapping");

    const switches = readSwitches(reader, source);

    if (source.gates !== undefined) {
        reader.problems.push(
            "`gates:` is gone: a gate is an `owner` block now, approved by closing its ticket or settling it as done",
        );
    }

    const settled = readSettled(reader, source);
    const extras = reader
        .list(source, "extras", "project")
        .flatMap((capability, index) => readCapability(reader, capability, index) ?? []);

    const project: Project = {
        id: reader.text(source, "id", "project"),
        title: reader.text(source, "title", "project"),
        template: reader.text(source, "template", "project"),
        area: reader.text(source, "area", "project", ""),
        milestone: reader.text(source, "milestone", "project"),
        summary: reader.text(source, "summary", "project", ""),
        switches,
        ticketSize: readTicketSize(reader, source),
        settled,
        extras,
    };

    return { project, problems: reader.problems };
};

const switchedOn = (switchable: Group | Capability, project: Project): boolean =>
    switchable.optional ? (project.switches[switchable.id] ?? switchable.default) : true;

/** Whether a group is on in a project; a capability outside any group is never held back by one. */
export const isGroupEnabled = (
    id: string | null,
    project: Project,
    template: Template,
): boolean => {
    const group = template.groups.find((candidate) => candidate.id === id);
    return group ? switchedOn(group, project) : true;
};

export const isEnabled = (capability: Capability, project: Project, template: Template): boolean =>
    isGroupEnabled(capability.group, project, template) && switchedOn(capability, project);

const switchProblems = (project: Project, template: Template): string[] =>
    Object.keys(project.switches).flatMap((id) => {
        const capability = template.capabilities.find((candidate) => candidate.id === id);
        const switchable = capability ?? template.groups.find((group) => group.id === id);

        if (!switchable)
            return [`switch \`${id}\` names no capability or group in \`${template.id}\``];
        if (!switchable.optional) {
            return [`switch \`${id}\` is on a required ${capability ? "capability" : "group"}`];
        }
        return [];
    });

const extraProblems = (extra: Capability, template: Template, known: Set<string>): string[] => {
    const problems: string[] = [];

    if (template.capabilities.some((capability) => capability.id === extra.id)) {
        problems.push(`extra \`${extra.id}\` reuses a template id`);
    }
    if (extra.group && !template.groups.some((group) => group.id === extra.group)) {
        problems.push(`extra \`${extra.id}\` names group \`${extra.group}\`, which doesn't exist`);
    }
    if (!template.stages.some((stage) => stage.id === extra.stage)) {
        problems.push(`extra \`${extra.id}\` names stage \`${extra.stage}\`, which doesn't exist`);
    }
    for (const dependency of extra.dependsOn.filter((id) => !known.has(id))) {
        problems.push(`extra \`${extra.id}\` depends on \`${dependency}\`, which doesn't exist`);
    }

    return problems;
};

/** What a project says about its template that the template doesn't back up. */
export const projectProblems = (project: Project, template: Template): string[] => {
    const all = [...template.capabilities, ...project.extras];
    const known = new Set(all.map((capability) => capability.id));

    const problems = [
        ...switchProblems(project, template),
        ...Object.keys(project.settled)
            .filter((id) => !known.has(id))
            .map((id) => `settled \`${id}\` names no capability`),
        ...project.extras.flatMap((extra) => extraProblems(extra, template, known)),
    ];

    return project.extras.length > 0 ? [...problems, ...cycleProblem(all)] : problems;
};

export const featuresOf = (project: Project, template: Template): Feature[] => {
    const titles = (ids: Capability[]) => ids.map(({ title }) => title);

    return [
        ...template.groups
            .filter((group) => group.optional)
            .map((group) => ({
                id: group.id,
                title: group.title,
                summary: group.summary,
                enabled: isGroupEnabled(group.id, project, template),
                blocks: titles(
                    template.capabilities.filter((c) => c.group === group.id && !c.optional),
                ),
                within: null,
            })),
        ...template.capabilities
            .filter((capability) => capability.optional)
            .map((capability) => ({
                id: capability.id,
                title: capability.title,
                summary: capability.summary,
                enabled: switchedOn(capability, project),
                blocks: [capability.title],
                within: template.groups.some((g) => g.id === capability.group && g.optional)
                    ? capability.group
                    : null,
            })),
    ];
};
