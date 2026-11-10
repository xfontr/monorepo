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
        UModal: {
            props: { open: Boolean, title: String },
            template: "<dialog v-if='open' open><h2>{{ title }}</h2><slot name='body' /></dialog>",
        },
        USlider: {
            props: { modelValue: Number, max: Number },
            emits: ["update:modelValue"],
            template:
                "<input type='range' data-replay :max='max' :value='modelValue' @input=\"$emit('update:modelValue', Number($event.target.value))\" />",
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

    it("lights a block picked from What's left on its stage cards and on the graph", async () => {
        const wrapper = await mountSuspended(Page, { global });

        await wrapper
            .findAll("button")
            .find((button) => button.text().startsWith("Cutover"))
            ?.trigger("click");

        expect(wrapper.find("#stage-launch button[aria-pressed='true']").text()).toContain(
            "Cutover",
        );
        expect(wrapper.find("[data-node='cutover']").attributes("aria-pressed")).toBe("true");
        expect(wrapper.find("[data-node='comments']").text()).toContain("needed");
    });

    it("opens the selected block's details only when asked", async () => {
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.find("aside").exists()).toBe(false);

        await wrapper
            .findAll("button")
            .find((button) => button.text() === "Details")
            ?.trigger("click");

        expect(wrapper.find("aside").text()).toContain("Moderate comments");
    });

    it("replays an earlier day, showing work in flight that is done today", async () => {
        state.data = workflows(PROJECT, [
            {
                ...issue,
                number: 13,
                title: "Moderate comments",
                caps: ["comments"],
                state: "closed",
                reason: "completed",
                createdAt: "2026-11-01T09:00:00Z",
                closedAt: "2026-11-05T09:00:00Z",
                activity: ["2026-11-02"],
            },
        ]);
        const wrapper = await mountSuspended(Page, { global });
        const comments = () => wrapper.find("[data-node='comments']").text();

        expect(comments()).toContain("Done");

        await wrapper.find("[data-replay]").setValue("0");

        expect(comments()).toContain("In flight");
        expect(wrapper.text()).toContain("2 Nov");
    });

    it("keeps features in a modal, switching one only under pnpm dev", async () => {
        state.editable = true;
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.find("dialog").exists()).toBe(false);

        await wrapper
            .findAll("button")
            .find((button) => button.text() === "Features")
            ?.trigger("click");
        await wrapper.find("dialog [role='switch']").trigger("click");

        expect(state.edit).toHaveBeenCalledWith({
            action: "switch",
            project: "blog",
            capability: "comments",
            on: false,
        });
    });

    it("says so when the project doesn't exist instead of rendering an empty pipeline", async () => {
        state.id = "nope";
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("No project nope");
    });
});
