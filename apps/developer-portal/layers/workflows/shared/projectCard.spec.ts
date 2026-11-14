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
    it("counts done blocks over the blocks that are on, so a switched-off one isn't owed", () => {
        const { template } = readTemplate({
            id: "t",
            title: "T",
            stages: [{ id: "build", title: "Build" }],
            capabilities: [
                { id: "scaffold", stage: "build", title: "Scaffold" },
                { id: "pages", stage: "build", title: "Pages", dependsOn: ["scaffold"] },
                { id: "extra", stage: "build", title: "Extra", optional: true, default: false },
            ],
        });
        const { project } = readProject({
            id: "p",
            title: "P",
            template: "t",
            milestone: "P",
            settled: { scaffold: { status: "done", note: "Shipped." } },
        });

        expect(projectCard(projectView(project, template, null)).done).toBe("1 of 2 done");
    });
});
