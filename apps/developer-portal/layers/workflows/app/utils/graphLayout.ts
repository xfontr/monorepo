import { Graph, layout as runLayout, type EdgeLabel, type NodeLabel } from "@dagrejs/dagre";
import type { CapabilityView } from "#layers/workflows/shared/workflows.ts";
import { blockKindIcon } from "./format.ts";

export const NODE_WIDTH = 208;
export const NODE_HEIGHT = 54;
export const PADDING = 48;

/** Through the midpoints, so a link bends round the blocks dagre routed it past. */
const smooth = (points: { x: number; y: number }[]): string => {
    const [first, ...rest] = points;
    const last = rest.at(-1);
    if (!first || !last) return "";

    let path = `M${first.x},${first.y}`;
    for (let index = 0; index < rest.length - 1; index++) {
        const point = rest[index]!;
        const next = rest[index + 1]!;
        path += ` Q${point.x},${point.y} ${(point.x + next.x) / 2},${(point.y + next.y) / 2}`;
    }

    return `${path} L${last.x},${last.y}`;
};

export const graphLayout = (shown: CapabilityView[]) => {
    const graph = new Graph<object, NodeLabel, EdgeLabel>();
    graph.setGraph({ rankdir: "LR", nodesep: 16, ranksep: 64, marginx: PADDING, marginy: PADDING });
    graph.setDefaultEdgeLabel(() => ({}));

    const needs = new Map(shown.map(({ id }) => [id, [] as string[]]));
    for (const { id, needs: list } of shown)
        needs.get(id)!.push(...list.filter((need) => needs.has(need)));
    for (const { id } of shown) graph.setNode(id, { width: NODE_WIDTH, height: NODE_HEIGHT });

    const reaches = (from: string, target: string, seen = new Set<string>()): boolean =>
        (needs.get(from) ?? []).some(
            (need) =>
                need === target ||
                (!seen.has(need) && (seen.add(need), reaches(need, target, seen))),
        );

    // A link a block already reaches through another of its needs adds a line, not information.
    const links = shown.flatMap(({ id }) => {
        const own = needs.get(id)!;
        return own
            .filter((need) => !own.some((other) => other !== need && reaches(other, need)))
            .map((need) => [need, id] as const);
    });
    for (const [from, to] of links) graph.setEdge(from, to);

    runLayout(graph);

    const label = graph.graph() as { width?: number; height?: number };

    return {
        width: label.width ?? 0,
        height: label.height ?? 0,
        nodes: shown.map((capability) => {
            const node = graph.node(capability.id);
            return {
                id: capability.id,
                capability,
                icon: blockKindIcon(capability.kind),
                x: (node.x ?? 0) - NODE_WIDTH / 2,
                y: (node.y ?? 0) - NODE_HEIGHT / 2,
            };
        }),
        edges: links.map(([from, to]) => ({
            key: `${from}>${to}`,
            from,
            to,
            path: smooth(graph.edge(from, to).points ?? []),
        })),
    };
};
