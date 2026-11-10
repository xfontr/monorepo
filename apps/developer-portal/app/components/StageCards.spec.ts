import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { projectView, readProject, readTemplate } from "#shared/workflows.ts";
import StageCards from "./StageCards.vue";

const { template } = readTemplate({
    id: "t",
    title: "T",
    stages: [{ id: "build", title: "Build" }],
    capabilities: [
        { id: "kit", stage: "build", title: "Kit" },
        { id: "page", stage: "build", title: "Page", dependsOn: ["kit"] },
        { id: "comments", stage: "build", title: "Comments", optional: true, default: false },
    ],
});
const { project } = readProject({ id: "p", title: "P", template: "t", milestone: "P" });
const ticket = (number: number, caps: string[]) => ({
    number,
    title: `#${number}`,
    url: "",
    state: "open" as const,
    reason: null,
    caps,
    createdAt: null,
    closedAt: null,
    activity: [],
    blockedBy: [],
    branch: false,
    owner: false,
});
const view = projectView(project, template, {
    syncedAt: "2026-11-09T00:00:00Z",
    milestone: "P",
    issues: [ticket(1, ["kit"]), ticket(2, ["page"])],
    noMilestone: [],
});

const mount = (selected: string | null = null) =>
    mountSuspended(StageCards, {
        props: { stage: view.stages[0]!, index: 0, selected, titles: { kit: "Kit" } },
        global: { stubs: { UIcon: true } },
    });

describe("StageCards", () => {
    it("says what a blocked block waits on and how much a ready one unblocks", async () => {
        const wrapper = await mount();
        const [kit, page] = wrapper.findAll("li button");

        expect(page!.text()).toContain("waits on Kit");
        expect(kit!.text()).toContain("unblocks 1");
    });

    it("gives a switched-off block no card, since it isn't part of the project", async () => {
        const wrapper = await mount();

        expect(wrapper.text()).not.toContain("Comments");
    });

    it("marks the selected block and emits a pick, so the graph can follow", async () => {
        const wrapper = await mount("page");
        const [kit, page] = wrapper.findAll("li button");

        expect(page!.attributes("aria-pressed")).toBe("true");
        await kit!.trigger("click");
        expect(wrapper.emitted("select")).toEqual([["kit"]]);
    });
});
