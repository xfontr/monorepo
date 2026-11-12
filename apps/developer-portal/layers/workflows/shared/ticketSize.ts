import { complexityOf } from "./complexity.ts";
import { isEnabled } from "./project.ts";
import {
    TICKET_SIZES,
    type Capability,
    type Project,
    type Template,
    type TicketSize,
} from "./types.ts";

/** The points a shared ticket holds before the next block wraps onto a new one. */
export const TICKET_WIDTH = { supervised: 13, fast: 21 } as const;

/** Puts each block after the ones it needs from the same group, keeping template order otherwise. */
const inDependencyOrder = (group: Capability[]): Capability[] => {
    const left = [...group];
    const order: Capability[] = [];

    while (left.length > 0) {
        const ready = left.findIndex(({ dependsOn }) =>
            dependsOn.every((need) => !left.some(({ id }) => id === need)),
        );
        order.push(...left.splice(Math.max(0, ready), 1));
    }

    return order;
};

/** Fills a ticket with blocks until the next one would pass `width`, then starts another. */
const wrap = (group: Capability[], width: number): Capability[][] => {
    const lines: Capability[][] = [];
    let points = 0;

    for (const capability of inDependencyOrder(group)) {
        const weight = capability.complexity ?? 0;
        const line = lines.at(-1);

        if (line && points + weight <= width) {
            line.push(capability);
            points += weight;
        } else {
            lines.push([capability]);
            points = weight;
        }
    }

    return lines;
};

/** Mirrors `bundlesOf` in the scripts' `domain/filing.ts`; change both together. */
export const bundlesOf = (capabilities: Capability[], size: TicketSize): Capability[][] => {
    if (size === "block") return capabilities.map((capability) => [capability]);

    const byId = new Map(capabilities.map((capability) => [capability.id, capability]));
    const levels = new Map<string, number>();

    const levelOf = (capability: Capability, walking: Set<string>): number => {
        const known = levels.get(capability.id);
        if (known !== undefined) return known;

        const level = Math.max(
            0,
            ...capability.dependsOn.flatMap((need) => {
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

    const bundles = new Map<string, Capability[]>();
    for (const capability of capabilities) {
        const key = keyOf(capability);
        bundles.set(key, [...(bundles.get(key) ?? []), capability]);
    }

    return [...bundles.values()].flatMap((group) => wrap(group, TICKET_WIDTH[size]));
};

/** A block filed alone becomes its suggested tickets; a bundle becomes one. */
export const ticketsToFile = (capabilities: Capability[]): Record<TicketSize, number> =>
    Object.fromEntries(
        TICKET_SIZES.map((size) => [
            size,
            bundlesOf(capabilities, size).reduce(
                (sum, bundle) =>
                    sum + (bundle.length === 1 ? Math.max(1, bundle[0]?.tickets.length ?? 1) : 1),
                0,
            ),
        ]),
    ) as Record<TicketSize, number>;

/** A project not yet written, so a template's features and counts can be shown before it exists. */
export const draftProject = (
    template: Template,
    switches: Record<string, boolean> = {},
    ticketSize: TicketSize = "block",
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
    extras: [],
});

/** The blocks a template turns on under these switches, its defaults where a switch is unset. */
export const blocksOn = (
    template: Template,
    switches: Record<string, boolean> = {},
): Capability[] =>
    template.capabilities.filter((capability) =>
        isEnabled(capability, draftProject(template, switches), template),
    );

/** What a template files with its defaults on: blocks, tickets at each size, and points. */
export const templateEstimate = (template: Template) => {
    const blocks = blocksOn(template);
    return { blocks: blocks.length, tickets: ticketsToFile(blocks), points: complexityOf(blocks) };
};

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
