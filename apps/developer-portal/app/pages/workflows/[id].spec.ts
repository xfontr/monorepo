import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
        { id: "build", title: "Build" },
        { id: "launch", title: "Launch" },
    ],
    capabilities: [
        { id: "comments", stage: "build", title: "Comments", optional: true },
        {
            id: "cutover",
            stage: "launch",
            title: "Cutover",
            optional: false,
            dependsOn: ["comments"],
        },
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

const ISSUES = [
    { ...issue, caps: [] },
    { ...issue, number: 13, title: "Moderate comments", caps: ["comments"] },
];

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

const workflows = (project: object, issues: object[] = ISSUES) =>
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
                        issues,
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

describe("workflow page", () => {
    it("puts a ticket with no capability label under To organise", async () => {
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("1 to organise");
        expect(wrapper.text()).toContain("Stray ticket");
        expect(wrapper.text()).toContain("no cap: label");
    });

    it("opens a block's details from its card on the map", async () => {
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.find("aside").exists()).toBe(false);

        await wrapper.find("[data-capability='comments']").trigger("click");

        expect(wrapper.find("aside").text()).toContain("Planned");
        expect(wrapper.find("aside").text()).toContain("Moderate comments");
    });

    it("puts a block one column right of the block it needs, whatever its stage", async () => {
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.find("[data-wave='0'] [data-capability='comments']").exists()).toBe(true);
        expect(wrapper.find("[data-wave='1'] [data-capability='cutover']").exists()).toBe(true);
    });

    it("lists an unblocked open ticket as ready and opens its block from there", async () => {
        const wrapper = await mountSuspended(Page, { global });
        const ready = wrapper.find("[data-column='ready']");

        expect(ready.text()).toContain("Moderate comments");

        await ready
            .findAll("button")
            .find((button) => button.text() === "Comments")
            ?.trigger("click");

        expect(wrapper.find("aside").text()).toContain("Moderate comments");
    });

    it("says how to file a block when nothing in the milestone is open", async () => {
        state.data = workflows(PROJECT, []);
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("pnpm workflow:file blog");
        expect(wrapper.text()).not.toContain("Approve");
    });

    it("says so when the project doesn't exist instead of rendering an empty pipeline", async () => {
        state.id = "nope";
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("No project nope");
    });
});
