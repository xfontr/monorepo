import { describe, expect, it } from "vitest";
import { normalizeGraph } from "./graph.ts";

describe("normalizeGraph", () => {
    it("sorts projects by name and keeps only declared tags", () => {
        const result = normalizeGraph({
            graph: {
                nodes: {
                    z: { name: "zeta", data: { root: "z", tags: ["scope:internal", "npm:private", "other"] } },
                    a: { name: "alpha", data: { root: "a", tags: ["type:lib", "npm:private"] } },
                },
                dependencies: {},
            },
        }, "now");

        expect(result.projects.map((project) => project.name)).toEqual(["alpha", "zeta"]);
        expect(result.projects[0]?.tags).toEqual(["type:lib"]);
        expect(result.projects[1]?.tags).toEqual(["scope:internal"]);
    });

    it("sorts forward and reverse dependency edges while dropping missing targets", () => {
        const result = normalizeGraph({
            graph: {
                nodes: {
                    app: { name: "app", data: { root: "apps/app" } },
                    docs: { name: "docs", data: { root: "apps/docs" } },
                    ui: { name: "ui", data: { root: "packages/ui" } },
                },
                dependencies: {
                    app: [
                        { source: "app", target: "ui", type: "static" },
                        { source: "app", target: "docs", type: "static" },
                        { source: "app", target: "missing", type: "static" },
                    ],
                    ui: [{ source: "ui", target: "app", type: "static" }],
                },
            },
        }, "now");

        expect(result.projects).toEqual([
            {
                name: "app",
                root: "apps/app",
                tags: [],
                dependsOn: ["docs", "ui"],
                dependedOnBy: ["ui"],
            },
            {
                name: "docs",
                root: "apps/docs",
                tags: [],
                dependsOn: [],
                dependedOnBy: ["app"],
            },
            {
                name: "ui",
                root: "packages/ui",
                tags: [],
                dependsOn: ["app"],
                dependedOnBy: ["app"],
            },
        ]);
    });
});
