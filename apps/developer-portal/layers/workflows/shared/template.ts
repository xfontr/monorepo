import { cycleProblem, readCapability } from "./capability.ts";
import { isRecord, Reader } from "./reader.ts";
import type { Capability, Template } from "./types.ts";

const duplicates = (ids: string[]): string[] =>
    [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))].sort((a, b) =>
        a.localeCompare(b),
    );

const referenceProblems = (
    capability: Capability,
    known: { stageIds: Set<string>; groupIds: Set<string>; capabilityIds: Set<string> },
): string[] => {
    const problems: string[] = [];

    if (capability.stage && !known.stageIds.has(capability.stage)) {
        problems.push(
            `capability \`${capability.id}\` names stage \`${capability.stage}\`, which the template doesn't have`,
        );
    }

    if (capability.group && !known.groupIds.has(capability.group)) {
        problems.push(
            `capability \`${capability.id}\` names group \`${capability.group}\`, which the template doesn't have`,
        );
    }

    for (const dependency of capability.dependsOn.filter((id) => !known.capabilityIds.has(id))) {
        problems.push(
            `capability \`${capability.id}\` depends on \`${dependency}\`, which the template doesn't have`,
        );
    }

    return problems;
};

const templateRuleProblems = ({ stages, groups, capabilities }: Template): string[] => {
    const problems: string[] = [];
    const stageIds = new Set(stages.map((stage) => stage.id));
    const groupIds = new Set(groups.map((group) => group.id));
    const capabilityIds = new Set(capabilities.map((capability) => capability.id));

    for (const id of duplicates(groups.map((group) => group.id))) {
        problems.push(`group \`${id}\` is declared twice`);
    }

    for (const id of groupIds) {
        if (capabilityIds.has(id)) {
            problems.push(
                `group \`${id}\` shares its id with a capability, so a switch can't tell them apart`,
            );
        }
    }

    for (const id of duplicates(stages.map((stage) => stage.id))) {
        problems.push(`stage \`${id}\` is declared twice`);
    }

    for (const id of duplicates(capabilities.map((capability) => capability.id))) {
        problems.push(`capability \`${id}\` is declared twice`);
    }

    const known = { stageIds, groupIds, capabilityIds };

    return [
        ...problems,
        ...capabilities.flatMap((capability) => referenceProblems(capability, known)),
        ...cycleProblem(capabilities),
    ];
};

/** A template read from parsed YAML, and everything about it that breaks the rules. */
export const readTemplate = (raw: unknown): { template: Template; problems: string[] } => {
    const reader = new Reader();
    const source = isRecord(raw) ? raw : {};

    if (!isRecord(raw)) reader.problems.push("the file isn't a mapping");

    const stages = reader.list(source, "stages", "template").flatMap((stage, index) => {
        if (!isRecord(stage)) {
            reader.problems.push(`stage #${index + 1} isn't a mapping`);
            return [];
        }

        const id = reader.text(stage, "id", `stage #${index + 1}`);
        const where = `stage \`${id || index + 1}\``;

        return [
            {
                id,
                title: reader.text(stage, "title", where),
                goal: reader.text(stage, "goal", where, ""),
            },
        ];
    });

    const groups = reader.list(source, "groups", "template").flatMap((group, index) => {
        if (!isRecord(group)) {
            reader.problems.push(`group #${index + 1} isn't a mapping`);
            return [];
        }

        const id = reader.text(group, "id", `group #${index + 1}`);
        const where = `group \`${id || index + 1}\``;
        const optional = group.optional === true;

        return [
            {
                id,
                title: reader.text(group, "title", where),
                summary: reader.text(group, "summary", where, ""),
                optional,
                default: optional ? group.default === true : true,
            },
        ];
    });

    const capabilities = reader
        .list(source, "capabilities", "template")
        .flatMap((capability, index) => readCapability(reader, capability, index) ?? []);

    const template: Template = {
        id: reader.text(source, "id", "template"),
        title: reader.text(source, "title", "template"),
        summary: reader.text(source, "summary", "template", ""),
        stages,
        groups,
        capabilities,
    };

    return { template, problems: [...reader.problems, ...templateRuleProblems(template)] };
};
