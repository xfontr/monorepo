import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { projectView, readProject, readTemplate } from "#shared/workflows.ts";
import WorkflowMap from "./WorkflowMap.vue";

const { template } = readTemplate({
    id: "t",
    title: "T",
    stages: [{ id: "build", title: "Build" }],
    capabilities: [
        { id: "design-approval", stage: "build", title: "Design approval", kind: "owner" },
        { id: "kit", stage: "build", title: "Kit", dependsOn: ["design-approval"] },
        { id: "article", stage: "build", title: "Article", dependsOn: ["kit"] },
        { id: "search", stage: "build", title: "Search" },
    ],
});
const { project } = readProject({ id: "p", title: "P", template: "t", milestone: "P" });
const view = projectView(project, template, null);

const stubs = { UIcon: true, ActivitySpark: true };

const mount = (focus: string | null = null) =>
    mountSuspended(WorkflowMap, {
        props: { waves: view.waves, stages: view.stages, focus },
        global: { stubs },
    });

describe("WorkflowMap", () => {
    it("lights what the focused block needs and what it unblocks, and dims the rest", async () => {
        const wrapper = await mount("kit");

        expect(
            wrapper.find("[data-capability='design-approval']").attributes("data-relation"),
        ).toBe("needed");
        expect(wrapper.find("[data-capability='article']").attributes("data-relation")).toBe(
            "unblocked by it",
        );
        expect(wrapper.find("[data-capability='search']").classes()).toContain("opacity-40");
    });

    it("names the decision an unfiled block waits on, on its card", async () => {
        const wrapper = await mount();

        expect(wrapper.find("[data-capability='kit']").text()).toContain("on Design approval");
    });

    it("reports hover and leave so the page can keep one block in focus", async () => {
        const wrapper = await mount();
        const card = wrapper.find("[data-capability='search']");

        await card.trigger("mouseenter");
        await card.trigger("mouseleave");

        expect(wrapper.emitted("hover")).toEqual([["search"], [null]]);
    });
});
