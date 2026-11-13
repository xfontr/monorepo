import { describe, expect, it } from "vitest";
import { projectView, readProject, readTemplate } from "../../shared/workflows.ts";
import { graphLayout } from "./graphLayout.ts";

const { template } = readTemplate({
    id: "t",
    title: "T",
    stages: [{ id: "build", title: "Build" }],
    capabilities: [
        { id: "kit", stage: "build", title: "Kit" },
        { id: "page", stage: "build", title: "Page", dependsOn: ["kit"] },
        { id: "share", stage: "build", title: "Share", dependsOn: ["page"] },
    ],
});
const { project } = readProject({ id: "p", title: "P", template: "t", milestone: "P" });
const { capabilities } = projectView(project, template, null);

describe("graphLayout", () => {
    it("leaves out a link to a block that isn't on the map but keeps the rest", () => {
        const { nodes, edges } = graphLayout(capabilities.filter(({ id }) => id !== "kit"));

        expect(nodes.map(({ id }) => id)).toEqual(["page", "share"]);
        expect(edges.map(({ from, to }) => [from, to])).toEqual([["page", "share"]]);
    });

    it("draws no shortcut link to a block already reached through another need", () => {
        const { capabilities: withShortcut } = projectView(
            project,
            readTemplate({
                id: "t",
                title: "T",
                stages: [{ id: "build", title: "Build" }],
                capabilities: [
                    { id: "kit", stage: "build", title: "Kit" },
                    { id: "page", stage: "build", title: "Page", dependsOn: ["kit"] },
                    { id: "share", stage: "build", title: "Share", dependsOn: ["kit", "page"] },
                ],
            }).template,
            null,
        );

        const { edges } = graphLayout(withShortcut);

        expect(edges.map(({ from, to }) => [from, to])).toEqual([
            ["kit", "page"],
            ["page", "share"],
        ]);
    });
});
