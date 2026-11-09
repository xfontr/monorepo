import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import type { CapabilityView, StageView } from "#shared/workflows.ts";
import WorkflowSkyline from "./WorkflowSkyline.vue";

const capability = (id: string, state: CapabilityView["state"] = "done"): CapabilityView => ({
    id,
    stage: "s",
    group: null,
    title: `Title of ${id}`,
    summary: "",
    optional: false,
    default: true,
    dependsOn: [],
    doneWhen: [],
    reuse: null,
    lessons: [],
    tickets: [],
    state,
    enabled: true,
    extra: false,
    note: null,
    issues: [],
});

const stage = (id: string, overrides: Partial<StageView> = {}): StageView => ({
    id,
    title: id,
    goal: "",
    gate: "",
    state: "done",
    approvedOn: null,
    capabilities: [capability(`${id}-a`), capability(`${id}-b`, "in-progress")],
    progress: { done: 1, total: 2, percent: 50 },
    ...overrides,
});

const STAGES = [stage("discovery"), stage("build", { state: "current" })];
const global = { stubs: { UIcon: true } };

describe("WorkflowSkyline", () => {
    it("presses only the selected stage, so the skyline and the cards below agree", async () => {
        const wrapper = await mountSuspended(WorkflowSkyline, {
            props: { stages: STAGES, selected: "build" },
            global,
        });

        expect(
            wrapper
                .findAll("button[aria-pressed]")
                .map((button) => button.attributes("aria-pressed")),
        ).toEqual(["false", "true"]);
    });

    it("selects a stage from its name", async () => {
        const wrapper = await mountSuspended(WorkflowSkyline, {
            props: { stages: STAGES, selected: "build" },
            global,
        });

        await wrapper.findAll("button[aria-pressed]")[0]?.trigger("click");

        expect(wrapper.emitted("select-stage")).toEqual([["discovery"]]);
    });

    it("opens a capability from its square without the tower click swallowing it", async () => {
        const wrapper = await mountSuspended(WorkflowSkyline, {
            props: { stages: STAGES, selected: "discovery" },
            global,
        });

        await wrapper.find("[aria-label='Title of build-a, Done']").trigger("click");

        expect(wrapper.emitted("select")).toEqual([["build-a"]]);
        expect(wrapper.emitted("select-stage")).toEqual([["build"]]);
    });

    it("names each square and its state, since colour alone can't", async () => {
        const wrapper = await mountSuspended(WorkflowSkyline, {
            props: { stages: STAGES, selected: "build" },
            global,
        });

        expect(wrapper.find("[aria-label='Title of build-b, In progress']").exists()).toBe(true);
    });

    it("enlarges only the highlighted capability's square", async () => {
        const wrapper = await mountSuspended(WorkflowSkyline, {
            props: { stages: STAGES, selected: "build", highlight: "build-b" },
            global,
        });

        expect(wrapper.findAll(".is-highlighted")).toHaveLength(1);
        expect(wrapper.find("[aria-label='Title of build-b, In progress']").classes()).toContain(
            "is-highlighted",
        );
    });

    it("marks the current stage as now and leaves the others unmarked", async () => {
        const wrapper = await mountSuspended(WorkflowSkyline, {
            props: { stages: STAGES, selected: "discovery" },
            global,
        });
        const [discovery, build] = wrapper.findAll("button[aria-pressed]");

        expect(discovery?.text()).not.toContain("Now");
        expect(build?.text()).toContain("Now");
    });
});
