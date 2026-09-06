import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ProjectNode, ProjectsArtifact } from "../../shared/types.ts";
import { GRAPH_DIR, SNAPSHOT_DIR } from "../lib/paths.ts";
import { run } from "../lib/run.ts";

interface RawGraph {
    graph: {
        nodes: Record<string, { name: string, data: { root: string, tags?: string[], targets?: Record<string, unknown> } }>
        dependencies: Record<string, { source: string, target: string, type: string }[]>
    }
}

/** Nx auto-adds `npm:private`; the tag table only ever talks about `type:` and `scope:`. */
function isDeclaredTag(tag: string): boolean {
    return tag.startsWith("type:") || tag.startsWith("scope:");
}

export function normalizeGraph(raw: RawGraph, generatedAt: string): ProjectsArtifact {
    const edges = Object.values(raw.graph.dependencies)
        .flat()
        .filter((edge) => edge.target in raw.graph.nodes);

    const projects: ProjectNode[] = Object.values(raw.graph.nodes)
        .map((node) => ({
            name: node.name,
            root: node.data.root,
            tags: (node.data.tags ?? []).filter(isDeclaredTag),
            targets: Object.keys(node.data.targets ?? {}).sort(),
            private: (node.data.tags ?? []).includes("npm:private"),
            // Derived from the forward edges rather than read from a second field, so a project
            // with no dependencies still appears with two empty lists instead of being dropped.
            dependsOn: edges.filter((edge) => edge.source === node.name).map((edge) => edge.target).sort(),
            dependedOnBy: edges.filter((edge) => edge.target === node.name).map((edge) => edge.source).sort(),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

    return { generatedAt, projects, edges };
}

export async function collectGraph(generatedAt: string): Promise<ProjectsArtifact> {
    const jsonPath = resolve(SNAPSHOT_DIR, "nx-graph.raw.json");

    // `nx graph --file` resolves a relative path against the workspace root, not cwd, and the JSON
    // branch writes the file directly without creating its parent — hence the absolute path and the
    // mkdir. The HTML branch copies Nx's own graph client in and creates its directory itself.
    await mkdir(SNAPSHOT_DIR, { recursive: true });
    await run("pnpm", ["exec", "nx", "graph", "--file", jsonPath]);

    await mkdir(GRAPH_DIR, { recursive: true });
    await run("pnpm", ["exec", "nx", "graph", "--file", resolve(GRAPH_DIR, "index.html")]);

    return normalizeGraph(JSON.parse(await readFile(jsonPath, "utf8")) as RawGraph, generatedAt);
}
