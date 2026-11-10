import { cycleProblem, readCapability } from "./capability.ts";
import { asText, isRecord, Reader } from "./reader.ts";
import {
    SETTLED_STATES,
    type Capability,
    type Feature,
    type Group,
    type Project,
    type SettledState,
    type Template,
} from "./types.ts";

/**
 * A project read from parsed YAML. Rules that need its template — a switch on a capability that
 * doesn't exist — live in `projectProblems`, because the template may be the broken file.
 */
export const readProject = (raw: unknown): { project: Project; problems: string[] } => {
    const reader = new Reader();
    const source = isRecord(raw) ? raw : {};

    if (!isRecord(raw)) reader.problems.push("the file isn't a mapping");

    const switches: Record<string, boolean> = {};

    for (const [id, value] of Object.entries(reader.record(source, "switches", "project"))) {
        if (typeof value === "boolean") switches[id] = value;
        else reader.problems.push(`switch \`${id}\` must be true or false`);
    }

    if (source.gates !== undefined) {
        reader.problems.push(
            "`gates:` is gone: a gate is an `owner` block now, approved by closing its ticket or settling it as done",
        );
    }

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

/** What a project says about its template that the template doesn't back up. */
export const projectProblems = (project: Project, template: Template): string[] => {
    const problems: string[] = [];
    const byId = new Map(template.capabilities.map((capability) => [capability.id, capability]));
    const stageIds = new Set(template.stages.map((stage) => stage.id));

    const groupsById = new Map(template.groups.map((group) => [group.id, group]));

    for (const id of Object.keys(project.switches)) {
        const switchable = byId.get(id) ?? groupsById.get(id);

        if (!switchable)
            problems.push(`switch \`${id}\` names no capability or group in \`${template.id}\``);
        else if (!switchable.optional)
            problems.push(
                `switch \`${id}\` is on a required ${byId.has(id) ? "capability" : "group"}`,
            );
    }

    const extraIds = new Set(project.extras.map((extra) => extra.id));

    for (const id of Object.keys(project.settled)) {
        if (!byId.has(id) && !extraIds.has(id)) {
            problems.push(`settled \`${id}\` names no capability`);
        }
    }

    const all = [...template.capabilities, ...project.extras];

    for (const extra of project.extras) {
        if (byId.has(extra.id)) problems.push(`extra \`${extra.id}\` reuses a template id`);
        if (extra.group && !groupsById.has(extra.group)) {
            problems.push(
                `extra \`${extra.id}\` names group \`${extra.group}\`, which doesn't exist`,
            );
        }
        if (!stageIds.has(extra.stage)) {
            problems.push(
                `extra \`${extra.id}\` names stage \`${extra.stage}\`, which doesn't exist`,
            );
        }
        for (const dependency of extra.dependsOn) {
            if (!byId.has(dependency) && !extraIds.has(dependency)) {
                problems.push(
                    `extra \`${extra.id}\` depends on \`${dependency}\`, which doesn't exist`,
                );
            }
        }
    }

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
