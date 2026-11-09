import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import type { CapabilityView, SnapshotIssue, StageView } from "#shared/workflows.ts";
import StageCards from "./StageCards.vue";

const issue = (number: number, overrides: Partial<SnapshotIssue> = {}): SnapshotIssue => ({
    number,
    title: `Ticket ${number}`,
    url: "",
    state: "closed",
    reason: "completed",
    caps: [],
    closedAt: null,
    activity: [],
    ...overrides,
});

const capability = (id: string, overrides: Partial<CapabilityView> = {}): CapabilityView => ({
    id,
    stage: "build",
    group: null,
    title: id,
    summary: "",
    optional: false,
    default: true,
    dependsOn: [],
    doneWhen: [],
    reuse: null,
    lessons: [],
    tickets: [],
    state: "done",
    enabled: true,
    extra: false,
    note: null,
    issues: [],
    ...overrides,
});

const stage = (overrides: Partial<StageView> = {}): StageView => ({
    id: "build",
    title: "Build",
    goal: "",
    gate: "Everything is reachable.",
    state: "current",
    approvedOn: null,
    capabilities: [capability("search")],
    progress: { done: 0, total: 1, percent: 0 },
    ...overrides,
});

const stubs = { UIcon: true };

describe("StageCards", () => {
    it("emits the capability's id when its card is clicked, so the page can open its details", async () => {
        const wrapper = await mountSuspended(StageCards, {
            props: { stage: stage(), index: 0 },
            global: { stubs },
        });

        await wrapper.find("li button").trigger("click");

        expect(wrapper.emitted("select")).toEqual([["search"]]);
    });

    it("tells hovering and leaving apart, so the constellation dot doesn't stay enlarged", async () => {
        const wrapper = await mountSuspended(StageCards, {
            props: { stage: stage(), index: 0 },
            global: { stubs },
        });

        await wrapper.find("li button").trigger("mouseenter");
        await wrapper.find("li button").trigger("mouseleave");

        expect(wrapper.emitted("hover")).toEqual([["search"], [null]]);
    });

    it("draws open tickets amber, delivered ones green and not-planned ones neither", async () => {
        const wrapper = await mountSuspended(StageCards, {
            props: {
                stage: stage({
                    capabilities: [
                        capability("search", {
                            issues: [
                                issue(1, { state: "open", reason: null }),
                                issue(2),
                                issue(3, { reason: "not_planned" }),
                            ],
                        }),
                    ],
                }),
                index: 0,
            },
            global: { stubs },
        });
        const dots = wrapper.findAll("[title^='#']").map((dot) => dot.classes().join(" "));

        expect(dots[0]).toContain("--tone-warn");
        expect(dots[1]).toContain("--tone-good");
        expect(dots[2]).not.toMatch(/--tone-(warn|good)/);
    });

    it("says a to-do capability has no ticket, and stays quiet once it has one", async () => {
        const wrapper = await mountSuspended(StageCards, {
            props: {
                stage: stage({
                    capabilities: [
                        capability("a", { state: "todo" }),
                        capability("b", { state: "in-progress", issues: [issue(2)] }),
                    ],
                }),
                index: 0,
            },
            global: { stubs },
        });
        const [bare, ticketed] = wrapper.findAll("li");

        expect(bare?.text()).toContain("No ticket yet");
        expect(ticketed?.text()).not.toContain("No ticket yet");
    });

    it("shows the approved date instead of a prompt once the gate is approved", async () => {
        const wrapper = await mountSuspended(StageCards, {
            props: { stage: stage({ state: "done", approvedOn: "2026-09-30" }), index: 0 },
            global: { stubs },
        });

        expect(wrapper.text()).toContain("Gate approved 2026-09-30");
        expect(wrapper.text()).not.toContain("Ready for its gate");
    });

    it("flags a current stage with every capability settled as ready for its gate", async () => {
        const wrapper = await mountSuspended(StageCards, {
            props: { stage: stage({ progress: { done: 1, total: 1, percent: 100 } }), index: 0 },
            global: { stubs },
        });

        expect(wrapper.text()).toContain("Ready for its gate");
    });

    it("offers gate approval only when editing locally, and reopening only once approved", async () => {
        const stubsWithButton = {
            ...stubs,
            UButton: {
                props: { label: String },
                emits: ["click"],
                template: "<button data-gate @click=\"$emit('click')\">{{ label }}</button>",
            },
        };
        const readOnly = await mountSuspended(StageCards, {
            props: { stage: stage(), index: 0 },
            global: { stubs: stubsWithButton },
        });
        const open = await mountSuspended(StageCards, {
            props: { stage: stage(), index: 0, editable: true },
            global: { stubs: stubsWithButton },
        });
        const approved = await mountSuspended(StageCards, {
            props: { stage: stage({ approvedOn: "2026-09-30" }), index: 0, editable: true },
            global: { stubs: stubsWithButton },
        });

        await open.find("[data-gate]").trigger("click");
        await approved.find("[data-gate]").trigger("click");

        expect(readOnly.find("[data-gate]").exists()).toBe(false);
        expect(open.emitted("approve")).toEqual([["build", true]]);
        expect(approved.emitted("approve")).toEqual([["build", false]]);
    });

    it("puts a group's capabilities under its heading, and its switch turns the whole group", async () => {
        const blog = {
            id: "blog",
            title: "Blog",
            summary: "",
            optional: true,
            default: true,
            enabled: false,
        };
        const wrapper = await mountSuspended(StageCards, {
            props: {
                stage: stage({
                    capabilities: [
                        capability("search"),
                        capability("article-page", { group: "blog", state: "off" }),
                    ],
                }),
                index: 0,
                editable: true,
                groups: [blog],
            },
            global: { stubs },
        });
        const [loose, grouped] = wrapper.findAll("ul");

        expect(loose?.text()).toContain("search");
        expect(grouped?.text()).toContain("article-page");
        expect(wrapper.find("h3").text()).toBe("Blog");
        expect(wrapper.text()).toContain("Off for this project");

        await wrapper.find("[role='switch']").trigger("click");

        expect(wrapper.emitted("toggle-group")).toEqual([["blog", true]]);
    });
});
