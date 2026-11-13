import { describe, expect, it } from "vitest";
import { activeProjects, projectCard } from "./projectCard.ts";
import { projectView, readProject, readTemplate } from "./workflows.ts";
import type { ProjectView } from "./types.ts";

const at = (percent: number) => ({ progress: { done: 0, total: 1, percent } }) as ProjectView;

describe("activeProjects", () => {
    it("keeps only projects with blocks left, so a shipped one drops off the Overview", () => {
        expect(
            activeProjects([at(0), at(99), at(100)]).map(({ progress }) => progress.percent),
        ).toEqual([0, 99]);
    });
});

describe("projectCard", () => {
    it("counts the blocks to file, so a project with nothing filed doesn't read as idle", () => {
        const { template } = readTemplate({
            id: "t",
            title: "T",
            stages: [{ id: "build", title: "Build" }],
            capabilities: [
                { id: "scaffold", stage: "build", title: "Scaffold" },
                { id: "pages", stage: "build", title: "Pages", dependsOn: ["scaffold"] },
            ],
        });
        const { project } = readProject({ id: "p", title: "P", template: "t", milestone: "P" });

        expect(projectCard(projectView(project, template, null)).now).toBe("1 to file");
    });

    it("says a project has no blocks yet rather than nothing left, so a fresh map isn't read as done", () => {
        const { template } = readTemplate({
            id: "custom",
            title: "Custom",
            stages: [{ id: "build", title: "Build" }],
            capabilities: [],
        });
        const { project } = readProject({
            id: "p",
            title: "P",
            template: "custom",
            milestone: "P",
        });

        expect(projectCard(projectView(project, template, null)).now).toBe("no blocks yet");
    });
});
