import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { ref } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assembleWorkflows } from "#shared/workflows.ts";
import Page from "./[id].vue";

const state = vi.hoisted(() => ({
    data: null as unknown,
    editable: false,
    edit: vi.fn(),
    id: "blog",
}));
mockNuxtImport("useWorkflows", () => () => ({ data: state.data }));
mockNuxtImport("useWorkflowEdit", () => () => ({ editable: state.editable, edit: state.edit }));
mockNuxtImport("useRoute", () => () => ({ params: { id: state.id } }));

const TEMPLATE = {
    id: "website-rebuild",
    title: "Website rebuild",
    stages: [
        { id: "build", title: "Build", gate: "Everything is reachable." },
        { id: "launch", title: "Launch", gate: "Traffic is on the new site." },
    ],
    capabilities: [
        { id: "comments", stage: "build", title: "Comments", optional: true },
        { id: "cutover", stage: "launch", title: "Cutover", optional: false },
    ],
};

const PROJECT = {
    id: "blog",
    title: "Blog",
    template: "website-rebuild",
    milestone: "Blog",
    switches: { comments: true },
};

const issue = {
    number: 12,
    title: "Stray ticket",
    url: "",
    state: "open" as const,
    reason: null,
    closedAt: null,
};

const global = {
    stubs: {
        UDashboardPanel: {
            template: "<section><slot name='header' /><slot name='body' /></section>",
        },
        UDashboardNavbar: { template: "<header><slot name='right' /></header>" },
        UDashboardSidebarCollapse: true,
        UButton: {
            props: { label: String },
            emits: ["click"],
            template: "<button @click=\"$emit('click')\">{{ label }}</button>",
        },
        USlideover: {
            props: { open: Boolean, title: String },
            template: "<aside v-if='open'><h2>{{ title }}</h2><slot name='body' /></aside>",
        },
        UIcon: true,
    },
};

const workflows = (project: object) =>
    ref(
        assembleWorkflows(
            [{ file: "website-rebuild.yaml", ok: true, value: TEMPLATE }],
            [{ file: "blog.yaml", ok: true, value: project }],
            {
                blog: {
                    file: "blog.snapshot.json",
                    ok: true,
                    value: {
                        syncedAt: "2026-11-09T00:00:00Z",
                        milestone: "Blog",
                        issues: [
                            { ...issue, caps: [] },
                            {
                                ...issue,
                                number: 13,
                                title: "Moderate comments",
                                caps: ["comments"],
                            },
                        ],
                    },
                },
            },
        ),
    );

beforeEach(() => {
    vi.clearAllMocks();
    state.editable = false;
    state.id = "blog";
    state.data = workflows(PROJECT);
});

afterEach(() => {
    vi.useRealTimers();
});

describe("workflow page", () => {
    it("puts a ticket with no capability label under To organise", async () => {
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("1 to organise");
        expect(wrapper.text()).toContain("Stray ticket");
        expect(wrapper.text()).toContain("no cap: label");
    });

    it("opens a capability's details from its card in the active stage", async () => {
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.find("aside").exists()).toBe(false);

        await wrapper
            .findAll("#stage-build button")
            .find((card) => card.text().startsWith("Comments"))
            ?.trigger("click");

        expect(wrapper.find("aside").text()).toContain("Planned");
        expect(wrapper.find("aside").text()).toContain("Moderate comments");
    });

    it("keeps work left behind an approved gate on the page, opening it from there", async () => {
        state.data = workflows({ ...PROJECT, gates: { build: "2026-11-01" } });
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.find("#stage-build").exists()).toBe(false);

        await wrapper
            .findAll("li button")
            .find((button) => button.text().startsWith("Comments"))
            ?.trigger("click");

        expect(wrapper.find("aside").text()).toContain("Moderate comments");
    });

    it("shows the stage that is in progress first and swaps cards when another stage is chosen", async () => {
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.find("#stage-build").exists()).toBe(true);
        expect(wrapper.find("#stage-launch").exists()).toBe(false);

        await wrapper
            .findAll("button[aria-pressed]")
            .find((stage) => stage.text().includes("Launch"))
            ?.trigger("click");

        expect(wrapper.find("#stage-build").exists()).toBe(false);
        expect(wrapper.find("#stage-launch").text()).toContain("Cutover");
    });

    // Just past midnight local time is still the previous day in UTC east of Greenwich.
    it("approves a gate with today's local date when editing locally", async () => {
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date(2026, 10, 9, 0, 30));
        state.editable = true;
        const wrapper = await mountSuspended(Page, { global });

        await wrapper
            .findAll("button")
            .find((button) => button.text() === "Approve today")
            ?.trigger("click");

        expect(state.edit).toHaveBeenCalledWith({
            action: "gate",
            project: "blog",
            stage: "build",
            approvedOn: "2026-11-09",
        });
    });

    it("says so when the project doesn't exist instead of rendering an empty pipeline", async () => {
        state.id = "nope";
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("No project nope");
    });
});
