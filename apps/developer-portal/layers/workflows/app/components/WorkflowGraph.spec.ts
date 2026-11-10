import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { projectView, readProject, readTemplate } from "#layers/workflows/shared/workflows.ts";
import WorkflowGraph from "./WorkflowGraph.vue";

const { template } = readTemplate({
    id: "t",
    title: "T",
    stages: [{ id: "build", title: "Build" }],
    capabilities: [
        { id: "kit", stage: "build", title: "Kit" },
        { id: "page", stage: "build", title: "Page", dependsOn: ["kit"] },
        { id: "search", stage: "build", title: "Search" },
        { id: "comments", stage: "build", title: "Comments", optional: true, default: false },
    ],
});
const { project } = readProject({ id: "p", title: "P", template: "t", milestone: "P" });
const view = projectView(project, template, null);

const mount = (selected: string | null) =>
    mountSuspended(WorkflowGraph, {
        props: { capabilities: view.capabilities, stages: view.stages, selected },
        global: { stubs: { UIcon: true } },
    });

describe("WorkflowGraph", () => {
    it("shows every block but greys out the ones off the selected path", async () => {
        const wrapper = await mount("page");

        expect(wrapper.find("[data-node='kit']").text()).toContain("needed");
        const block = (id: string) => wrapper.find(`[data-node='${id}']`).element.parentElement!;
        expect(block("kit").classList).not.toContain("opacity-25");
        expect(block("search").classList).toContain("opacity-25");
    });

    it("leaves a switched-off block off the map instead of greying it", async () => {
        const wrapper = await mount(null);

        expect(wrapper.find("[data-node='comments']").exists()).toBe(false);
    });

    it("selects a block on a plain click but not at the end of a drag across it", async () => {
        const wrapper = await mount(null);
        const node = wrapper.find("[data-node='search']");
        const viewport = wrapper.find("div");

        await node.trigger("click");
        expect(wrapper.emitted("select")).toEqual([["search"]]);

        await viewport.trigger("pointerdown", {
            button: 0,
            clientX: 10,
            clientY: 10,
            pointerId: 1,
        });
        await viewport.trigger("pointermove", { clientX: 60, clientY: 40, pointerId: 1 });
        await node.trigger("click");
        await viewport.trigger("pointerup", { pointerId: 1 });

        expect(wrapper.emitted("select")).toEqual([["search"]]);
    });

    it("asks for a block's details from its info button but not at the end of a drag", async () => {
        const wrapper = await mount(null);
        const info = wrapper.find("button[aria-label='Details for Search']");
        const viewport = wrapper.find("div");

        await info.trigger("click");
        expect(wrapper.emitted("details")).toEqual([["search"]]);

        await viewport.trigger("pointerdown", {
            button: 0,
            clientX: 10,
            clientY: 10,
            pointerId: 1,
        });
        await viewport.trigger("pointermove", { clientX: 60, clientY: 40, pointerId: 1 });
        await info.trigger("click");

        expect(wrapper.emitted("details")).toEqual([["search"]]);
    });

    // A plain wheel has to reach the page, or the map would trap anyone scrolling past it.
    it("zooms on a pinch or ctrl-wheel and lets a plain wheel scroll the page", async () => {
        const wrapper = await mount(null);
        const viewport = wrapper.find("div");
        const layer = () =>
            wrapper.find("[data-node]").element.parentElement?.parentElement?.style.transform;

        const plain = new WheelEvent("wheel", { deltaY: -100, cancelable: true });
        viewport.element.dispatchEvent(plain);
        const before = layer();

        const pinch = new WheelEvent("wheel", { deltaY: -100, cancelable: true });
        // happy-dom's WheelEvent drops modifier keys from its init dictionary.
        Object.defineProperty(pinch, "ctrlKey", { value: true });
        viewport.element.dispatchEvent(pinch);
        await wrapper.vm.$nextTick();

        expect(plain.defaultPrevented).toBe(false);
        expect(pinch.defaultPrevented).toBe(true);
        expect(layer()).not.toBe(before);
    });
});
