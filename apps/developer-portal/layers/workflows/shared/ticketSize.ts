import { isEnabled } from "./project.ts";
import {
    TICKET_SIZES,
    type Capability,
    type Project,
    type Template,
    type TicketSize,
} from "./types.ts";

/**
 * The capabilities a ticket size files as one ticket, in map order. Build blocks share a ticket per
 * stage, split where a spike or owner block inside the stage sits between them; `lean` also puts
 * every spike in one ticket. `workflow:file`'s `domain/filing.ts` groups the same way.
 */
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
            return size === "lean" ? "spike" : `spike:${capability.id}`;
        return `build:${capability.stage}:${levelOf(capability, new Set([capability.id]))}`;
    };

    const bundles = new Map<string, Capability[]>();
    for (const capability of capabilities) {
        const key = keyOf(capability);
        bundles.set(key, [...(bundles.get(key) ?? []), capability]);
    }

    return [...bundles.values()];
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

export const TICKET_SIZE_LABELS = {
    block: {
        title: "One per block",
        summary: "Each block is its own ticket, or its suggested ones",
    },
    stage: {
        title: "One per stage",
        summary: "A stage's build blocks share a ticket; spikes and sign-offs stay apart",
    },
    lean: { title: "Lean", summary: "One per stage, and every spike in one ticket" },
} as const satisfies Record<TicketSize, { title: string; summary: string }>;
