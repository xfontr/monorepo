import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { projectView, readProject, readTemplate } from "#layers/workflows/shared/workflows.ts";
import WorkflowSkyline from "./WorkflowSkyline.vue";

const { template } = readTemplate({
    id: "t",
    title: "T",
    stages: [
        { id: "build", title: "Build" },
        { id: "launch", title: "Launch" },
    ],
    capabilities: [
        { id: "kit", stage: "build", title: "Kit" },
        { id: "cutover", stage: "launch", title: "Cutover" },
    ],
});
const { project } = readProject({ id: "p", title: "P", template: "t", milestone: "P" });
const { stages } = projectView(project, template, null);

describe("WorkflowSkyline", () => {
    it("picks a block from its square and opens that block's stage", async () => {
        const wrapper = await mountSuspended(WorkflowSkyline, {
            props: { stages, selected: "build", highlight: null },
        });

        await wrapper.find("[aria-label^='Cutover']").trigger("click");

        expect(wrapper.emitted("select-stage")).toEqual([["launch"]]);
        expect(wrapper.emitted("select")).toEqual([["cutover"]]);
    });

    it("rings the selected block's square so it can be found among the rest", async () => {
        const wrapper = await mountSuspended(WorkflowSkyline, {
            props: { stages, selected: "build", highlight: "kit" },
        });

        expect(wrapper.find("[aria-label^='Kit']").classes()).toContain("is-highlighted");
        expect(wrapper.find("[aria-label^='Cutover']").classes()).not.toContain("is-highlighted");
    });
});
