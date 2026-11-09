import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { assembleWorkflows } from "#shared/workflows.ts";
import Page from "./index.vue";

const state = vi.hoisted(() => ({
    data: null as unknown,
    editable: false,
    edit: vi.fn(),
}));
mockNuxtImport("useWorkflows", () => () => ({ data: state.data }));
mockNuxtImport("useWorkflowEdit", () => () => ({ editable: state.editable, edit: state.edit }));

const TEMPLATE = {
    id: "website-rebuild",
    title: "Website rebuild",
    stages: [
        { id: "discovery", title: "Discovery" },
        { id: "build", title: "Build" },
    ],
    capabilities: [
        { id: "content-audit", stage: "discovery", title: "Content audit" },
        { id: "comments", stage: "build", title: "Comments", optional: true },
    ],
};

const workflows = (projects: object[], snapshots = {}) =>
    assembleWorkflows(
        [{ file: "website-rebuild.yaml", ok: true, value: TEMPLATE }],
        projects.map((value, index) => ({ file: `p${index}.yaml`, ok: true, value })),
        snapshots,
    );

const global = {
    stubs: {
        UDashboardPanel: {
            template: "<section><slot name='header' /><slot name='body' /></section>",
        },
        UDashboardNavbar: { template: "<header><slot name='right' /></header>" },
        UDashboardSidebarCollapse: true,
        UButton: {
            props: { label: String, to: String },
            template: "<a :href='to'>{{ label }}</a>",
        },
        UModal: true,
        UIcon: true,
    },
};

beforeEach(() => {
    vi.clearAllMocks();
    state.editable = false;
});

describe("workflows page", () => {
    it("shows each project's progress and what can be taken now", async () => {
        state.data = ref(
            workflows([
                { id: "p0", title: "Blog", template: "website-rebuild", milestone: "Blog" },
            ]),
        );

        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("Blog");
        expect(wrapper.text()).toContain("0%");
        expect(wrapper.text()).toContain(
            "Now: 0 waiting on you · 0 ready · 0 in flight · 0 blocked",
        );
        expect(wrapper.text()).toContain("Content audit");
    });

    it("hides project creation on the static site, which has no server to write through", async () => {
        state.data = ref(workflows([]));

        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).not.toContain("New project");

        state.editable = true;
        expect((await mountSuspended(Page, { global })).text()).toContain("New project");
    });

    it("lists file problems so a broken project never just disappears", async () => {
        state.data = ref(
            workflows([{ id: "p0", title: "Blog", template: "missing", milestone: "Blog" }]),
        );

        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("`template: missing` names no template");
    });
});
