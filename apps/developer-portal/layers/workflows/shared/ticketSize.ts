import { routedNeeds } from "./capability.ts";
import { complexityOf } from "./complexity.ts";
import { featuresOf, isEnabled } from "./project.ts";
import type { NewPage } from "./projectFile.ts";
import {
    TICKET_SIZES,
    type Capability,
    type Project,
    type ReceiptRow,
    type Template,
    type TicketSize,
} from "./types.ts";

/** The points a shared ticket holds before the next block wraps onto a new one. */
export const TICKET_WIDTH = { supervised: 13, fast: 21 } as const;

/** Puts each block after the ones it needs from the same group, keeping template order otherwise. */
const inDependencyOrder = (group: Capability[], needs: Map<string, string[]>): Capability[] => {
    const left = [...group];
    const order: Capability[] = [];

    while (left.length > 0) {
        const ready = left.findIndex(({ id }) =>
            (needs.get(id) ?? []).every((need) => !left.some((other) => other.id === need)),
        );
        order.push(...left.splice(Math.max(0, ready), 1));
    }

    return order;
};

/** Every block each one waits on, directly or through others, among the blocks being bundled. */
const ancestorsOf = (ids: string[], needs: Map<string, string[]>): Map<string, Set<string>> => {
    const known = new Set(ids);
    const ancestors = new Map<string, Set<string>>();

    const walk = (id: string, seen: Set<string>): Set<string> => {
        const cached = ancestors.get(id);
        if (cached) return cached;

        const found = new Set<string>();
        for (const need of needs.get(id) ?? []) {
            if (!known.has(need) || seen.has(need)) continue;
            found.add(need);
            for (const further of walk(need, new Set([...seen, need]))) found.add(further);
        }

        ancestors.set(id, found);
        return found;
    };

    for (const id of ids) walk(id, new Set([id]));
    return ancestors;
};

/** Whether every member would wait on exactly what the ticket waits on, so none inherits a wait. */
const sharesWaits = (members: string[], ancestors: Map<string, Set<string>>): boolean => {
    const inside = new Set(members);
    const outside = (id: string) =>
        [...(ancestors.get(id) ?? [])]
            .filter((need) => !inside.has(need))
            .sort((a, b) => a.localeCompare(b))
            .join(",");
    const [first, ...rest] = members.map(outside);

    return rest.every((waits) => waits === first);
};

/** Puts each block in the first ticket it fits, by width and by waits, or starts another. */
const pack = (
    group: Capability[],
    width: number,
    needs: Map<string, string[]>,
    ancestors: Map<string, Set<string>>,
): Capability[][] => {
    const lines: { members: Capability[]; points: number }[] = [];

    for (const capability of inDependencyOrder(group, needs)) {
        const weight = capability.complexity ?? 0;
        const line = lines.find(
            ({ members, points }) =>
                points + weight <= width &&
                sharesWaits([...members.map(({ id }) => id), capability.id], ancestors),
        );

        if (line) {
            line.members.push(capability);
            line.points += weight;
        } else {
            lines.push({ members: [capability], points: weight });
        }
    }

    return lines.map(({ members }) => members);
};

/**
 * Mirrors `bundlesOf` in the scripts' `domain/filing.ts`; change both together. `pool` is every
 * block that is on and unsettled, filed or not, so the bundles never shift as tickets are filed.
 */
export const bundlesOf = (
    pool: Capability[],
    size: TicketSize,
    needs: Map<string, string[]> = routedNeeds(pool, () => true),
): Capability[][] => {
    if (size === "block") return pool.map((capability) => [capability]);

    const byId = new Map(pool.map((capability) => [capability.id, capability]));
    const ancestors = ancestorsOf([...byId.keys()], needs);
    const levels = new Map<string, number>();

    const levelOf = (capability: Capability, walking: Set<string>): number => {
        const known = levels.get(capability.id);
        if (known !== undefined) return known;

        const level = Math.max(
            0,
            ...(needs.get(capability.id) ?? []).flatMap((need) => {
                const dependency = byId.get(need);
                if (!dependency || dependency.stage !== capability.stage || walking.has(need)) {
                    return [];
                }

                const behind = levelOf(dependency, new Set([...walking, need]));
                return [
                    capability.kind !== "build" && dependency.kind === "build"
                        ? behind + 1
                        : behind,
                ];
            }),
        );

        levels.set(capability.id, level);
        return level;
    };

    const keyOf = (capability: Capability): string => {
        if (capability.kind === "owner") return `owner:${capability.id}`;
        if (capability.kind === "spike")
            return size === "fast" ? "spike" : `spike:${capability.id}`;
        return `build:${capability.stage}:${levelOf(capability, new Set([capability.id]))}`;
    };

    const groups = new Map<string, Capability[]>();
    for (const capability of pool) {
        const key = keyOf(capability);
        groups.set(key, [...(groups.get(key) ?? []), capability]);
    }

    return [...groups.values()].flatMap((group) =>
        pack(group, TICKET_WIDTH[size], needs, ancestors),
    );
};

/**
 * The tickets the unfiled blocks of `pool` would become: a block filed alone becomes its suggested
 * tickets, and a bundle one ticket for whichever of its members are still unfiled.
 */
export const ticketsToFile = (
    pool: Capability[],
    needs?: Map<string, string[]>,
    filed: Set<string> = new Set(),
): Record<TicketSize, number> =>
    Object.fromEntries(
        TICKET_SIZES.map((size) => [
            size,
            bundlesOf(pool, size, needs)
                .map((bundle) => bundle.filter(({ id }) => !filed.has(id)))
                .reduce(
                    (sum, bundle) =>
                        sum +
                        (bundle.length > 1
                            ? 1
                            : Math.max(bundle.length, bundle[0]?.tickets.length ?? 0)),
                    0,
                ),
        ]),
    ) as Record<TicketSize, number>;

/** A project not yet written, so a template's features and counts can be shown before it exists. */
export const draftProject = (
    template: Template,
    switches: Record<string, boolean> = {},
    ticketSize: TicketSize = "block",
    extras: Capability[] = [],
): Project => ({
    id: "",
    title: "",
    template: template.id,
    area: "",
    milestone: "",
    summary: "",
    switches,
    ticketSize,
    settled: {},
    extras,
});

/** The blocks a template turns on under these switches, its defaults where a switch is unset. */
export const blocksOn = (
    template: Template,
    switches: Record<string, boolean> = {},
    extras: Capability[] = [],
): Capability[] =>
    template.capabilities.filter((capability) =>
        isEnabled(capability, draftProject(template, switches, "block", extras), template),
    );

/** What a template files under these switches and extras: blocks, tickets at each size, and points. */
export const estimateOf = (
    template: Template,
    switches: Record<string, boolean> = {},
    extras: Capability[] = [],
) => {
    const project = draftProject(template, switches, "block", extras);
    const blocks = [...blocksOn(template, switches, extras), ...extras];
    const needs = routedNeeds([...template.capabilities, ...extras], (capability) =>
        isEnabled(capability, project, template),
    );

    return {
        blocks: blocks.length,
        tickets: ticketsToFile(blocks, needs),
        points: complexityOf(blocks),
    };
};

/** What each page adds, in order: its type's points plus any on-demand setup no earlier page brought. */
export const pageCosts = (
    template: Template,
    pages: { type: string }[],
): { points: number; setup: Capability[] }[] => {
    const brought = new Set<string>();

    return pages.map(({ type }) => {
        const pageType = template.types.find(({ id }) => id === type);
        const setup = template.capabilities.filter(
            ({ id, onDemand }) =>
                onDemand && !brought.has(id) && (pageType?.dependsOn.includes(id) ?? false),
        );

        for (const { id } of setup) brought.add(id);
        return { points: (pageType?.complexity ?? 0) + complexityOf(setup), setup };
    });
};

/** The core blocks, each feature switched on and each page: `estimateOf`'s points, line by line. */
export const receiptOf = (
    template: Template,
    switches: Record<string, boolean> = {},
    pages: NewPage[] = [],
): ReceiptRow[] => {
    const optionalGroups = new Set(
        template.groups.filter(({ optional }) => optional).map(({ id }) => id),
    );
    const core = template.capabilities.filter(
        ({ optional, onDemand, group }) =>
            !optional && !onDemand && !(group && optionalGroups.has(group)),
    );
    const costs = pageCosts(template, pages);
    const on = featuresOf(draftProject(template, switches), template).filter(
        ({ enabled }) => enabled,
    );
    const row = ({ id, title, points }: (typeof on)[number], nested: boolean): ReceiptRow => ({
        id,
        label: title,
        detail: null,
        points,
        nested,
    });

    return [
        {
            id: "core",
            label: "Core build",
            detail: null,
            points: complexityOf(core),
            nested: false,
        },
        ...on
            .filter(({ within }) => within === null)
            .flatMap((parent) => [
                row(parent, false),
                ...on.filter(({ within }) => within === parent.id).map((child) => row(child, true)),
            ]),
        ...pages.map(({ type, title }, index) => {
            const { points, setup } = costs[index] ?? { points: 0, setup: [] };
            const typeTitle = template.types.find(({ id }) => id === type)?.title ?? null;

            return {
                id: `page-${index}`,
                label: title || "Unnamed page",
                detail: [typeTitle, ...setup.map((block) => `with ${block.title}`)]
                    .filter(Boolean)
                    .join(", "),
                points,
                nested: false,
            };
        }),
    ];
};

/** What a template files with its defaults on. */
export const templateEstimate = (template: Template) => estimateOf(template);

export const TICKET_SIZE_LABELS = {
    block: {
        title: "Reviewed",
        summary: "One ticket per block, or its suggested ones, each PR reviewed by hand",
        warning: null,
    },
    supervised: {
        title: "Supervised",
        summary: `A stage's build blocks share tickets of up to ${TICKET_WIDTH.supervised} SP; spikes and sign-offs stay apart`,
        warning:
            "Meant for AI-run projects: a ticket bundles several blocks, so no one reviews each block's code by hand.",
    },
    fast: {
        title: "Fast",
        summary: `Tickets of up to ${TICKET_WIDTH.fast} SP, and the spikes together; sign-offs stay apart`,
        warning:
            "Meant for AI-run projects, putting speed over code quality: for internal tools and experiments.",
    },
} as const satisfies Record<TicketSize, { title: string; summary: string; warning: string | null }>;
