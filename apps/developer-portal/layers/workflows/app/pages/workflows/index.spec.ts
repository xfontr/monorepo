import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { assembleWorkflows } from "#layers/workflows/shared/workflows.ts";
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
    it("puts the project's own done count on its card, never another's", async () => {
        const ticket = { title: "T", url: "", reason: null, closedAt: null, activity: [] };
        state.data = ref(
            workflows(
                [
                    {
                        id: "p0",
                        title: "Blog",
                        template: "website-rebuild",
                        milestone: "Blog",
                        ticketSize: "fast",
                        switches: { comments: true },
                    },
                ],
                {
                    p0: {
                        file: "p0.snapshot.json",
                        ok: true,
                        value: {
                            syncedAt: "2026-11-09T00:00:00Z",
                            milestone: "Blog",
                            issues: [
                                { ...ticket, number: 1, state: "open", caps: ["content-audit"] },
                                {
                                    ...ticket,
                                    number: 2,
                                    state: "open",
                                    caps: ["comments"],
                                    branch: true,
                                },
                            ],
                        },
                    },
                },
            ),
        );

        const card = (await mountSuspended(Page, { global })).find("a[href='/workflows/p0']");

        expect(card.text()).toContain("0 of 2 done");
    });

    it("offers a new project on the static site too, where the wizard ends in a download", async () => {
        state.data = ref(workflows([]));

        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.find("a[href='/workflows/new']").attributes("aria-label")).toBe(
            "New project",
        );
    });

    it("lists file problems so a broken project never just disappears", async () => {
        state.data = ref(
            workflows([{ id: "p0", title: "Blog", template: "missing", milestone: "Blog" }]),
        );

        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("`template: missing` names no template");
    });
});
