import type { CapabilityView } from "#layers/workflows/shared/workflows.ts";

/** Whether a block sits on the selected block's path, and how; everything else is greyed out. */
export const pathRelation = (
    shown: CapabilityView[],
    selected: string | null,
): Record<string, string> => {
    if (!selected) return Object.fromEntries(shown.map(({ id }) => [id, ""]));

    const byId = new Map(shown.map((capability) => [capability.id, capability]));
    const walk = (from: string, next: (capability: CapabilityView) => string[]) => {
        const seen = new Set<string>();
        const queue = [from];

        for (let id = queue.pop(); id !== undefined; id = queue.pop()) {
            for (const other of next(byId.get(id)!) ?? []) {
                if (!seen.has(other) && byId.has(other)) {
                    seen.add(other);
                    queue.push(other);
                }
            }
        }

        return seen;
    };

    if (!byId.has(selected)) return {};

    return {
        ...Object.fromEntries([...walk(selected, (c) => c.needs)].map((id) => [id, "needed"])),
        ...Object.fromEntries(
            [...walk(selected, (c) => c.unblocks)].map((id) => [id, "waits on it"]),
        ),
        [selected]: "",
    };
};
