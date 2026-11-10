import { describe, expect, it } from "vitest";
import { projectView, readProject, readTemplate } from "../../shared/workflows.ts";
import { pathRelation } from "./pathRelation.ts";

const { template } = readTemplate({
    id: "t",
    title: "T",
    stages: [{ id: "build", title: "Build" }],
    capabilities: [
        { id: "kit", stage: "build", title: "Kit" },
        { id: "page", stage: "build", title: "Page", dependsOn: ["kit"] },
        { id: "share", stage: "build", title: "Share", dependsOn: ["page"] },
        { id: "search", stage: "build", title: "Search" },
    ],
});
const { project } = readProject({ id: "p", title: "P", template: "t", milestone: "P" });
const { capabilities } = projectView(project, template, null);

describe("pathRelation", () => {
    it("marks what the selection needs and what waits on it, and leaves an unrelated block out", () => {
        expect(pathRelation(capabilities, "page")).toEqual({
            kit: "needed",
            page: "",
            share: "waits on it",
        });
    });
});
