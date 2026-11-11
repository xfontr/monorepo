import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import type { VueWrapper } from "@vue/test-utils";
import { nextTick, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { assembleWorkflows } from "#layers/workflows/shared/workflows.ts";
import Page from "./settings.vue";

const state = vi.hoisted(() => ({
    data: null as unknown,
    editable: true,
    edit: vi.fn(),
    navigateTo: vi.fn(),
    leaveGuard: null as null | ((to: { fullPath: string }) => boolean),
}));
mockNuxtImport("useWorkflows", () => () => ({ data: state.data }));
mockNuxtImport("useWorkflowEdit", () => () => ({ editable: state.editable, edit: state.edit }));
mockNuxtImport("useRoute", () => () => ({ params: { id: "blog" } }));
mockNuxtImport("navigateTo", () => state.navigateTo);
mockNuxtImport("onBeforeRouteLeave", () => (guard: typeof state.leaveGuard) => {
    state.leaveGuard = guard;
});

const TEMPLATE = {
    id: "site",
    title: "Site",
    stages: [{ id: "build", title: "Build" }],
    capabilities: [
        { id: "search", stage: "build", title: "Search", optional: true, default: false },
    ],
};

const global = {
    stubs: {
        UDashboardPanel: {
            template: "<section><slot name='header' /><slot name='body' /></section>",
        },
        UDashboardNavbar: { template: "<header><slot name='right' /></header>" },
        UDashboardSidebarCollapse: true,
        UButton: {
            props: { label: String, disabled: Boolean },
            emits: ["click"],
            template: "<button :disabled='disabled' @click=\"$emit('click')\">{{ label }}</button>",
        },
        UModal: {
            props: { open: Boolean },
            template:
                "<dialog v-if='open' open><slot name='body' /><slot name='footer' /></dialog>",
        },
        UIcon: true,
    },
};

const button = (wrapper: VueWrapper, label: string) =>
    wrapper.findAll("button").find((candidate) => candidate.text() === label);

const withIssues = (issues: object[]) =>
    ref(
        assembleWorkflows(
            [{ file: "site.yaml", ok: true, value: TEMPLATE }],
            [
                {
                    file: "blog.yaml",
                    ok: true,
                    value: { id: "blog", title: "Blog", template: "site", milestone: "Blog" },
                },
            ],
            {
                blog: {
                    file: "blog.snapshot.json",
                    ok: true,
                    value: { syncedAt: "2026-11-09T00:00:00Z", milestone: "Blog", issues },
                },
            },
        ),
    );

beforeEach(() => {
    vi.clearAllMocks();
    state.leaveGuard = null;
    state.editable = true;
    state.edit.mockResolvedValue(true);
    state.data = ref(
        assembleWorkflows(
            [{ file: "site.yaml", ok: true, value: TEMPLATE }],
            [
                {
                    file: "blog.yaml",
                    ok: true,
                    value: { id: "blog", title: "Blog", template: "site", milestone: "Blog" },
                },
            ],
            {},
        ),
    );
});

describe("project settings", () => {
    it("deletes only once the project's id is typed back", async () => {
        const wrapper = await mountSuspended(Page, { global });

        await button(wrapper, "Delete project…")?.trigger("click");
        expect(button(wrapper, "Delete project")?.attributes("disabled")).toBeDefined();

        await wrapper.find("dialog input").setValue("blog");
        await button(wrapper, "Delete project")?.trigger("click");

        expect(state.edit).toHaveBeenCalledWith({ action: "delete", project: "blog" });
        expect(state.navigateTo).toHaveBeenCalledWith("/workflows");
    });

    it("writes nothing until Save, then sends every setting in one edit", async () => {
        const wrapper = await mountSuspended(Page, { global });
        await wrapper.find("[role='switch']").trigger("click");
        expect(state.edit).not.toHaveBeenCalled();

        await button(wrapper, "Save")?.trigger("click");

        expect(state.edit).toHaveBeenCalledWith({
            action: "settings",
            project: "blog",
            title: "Blog",
            summary: "",
            milestone: "Blog",
            area: "",
            switches: { search: true },
            ticketSize: "block",
        });
    });

    it("holds a navigation away from unsaved changes until the user leaves anyway", async () => {
        const wrapper = await mountSuspended(Page, { global });
        expect(state.leaveGuard?.({ fullPath: "/workflows" })).toBe(true);

        await wrapper.find("[role='switch']").trigger("click");
        expect(state.leaveGuard?.({ fullPath: "/workflows" })).toBe(false);
        await nextTick();

        await button(wrapper, "Leave without saving")?.trigger("click");

        expect(state.navigateTo).toHaveBeenCalledWith("/workflows");
        expect(state.edit).not.toHaveBeenCalled();
        expect(state.leaveGuard?.({ fullPath: "/workflows" })).toBe(true);
    });

    it("locks every ticket size once a labelled ticket is in the milestone", async () => {
        state.data = withIssues([{ number: 1, state: "open", caps: ["search"] }]);
        const wrapper = await mountSuspended(Page, { global });
        const sizes = wrapper.find("[aria-label='Ticket size']").findAll("[role='radio']");

        expect(sizes).toHaveLength(3);
        expect(sizes.every((size) => size.attributes("disabled") !== undefined)).toBe(true);
    });

    it("points at workflow:drop before deleting, since the drop needs the project file", async () => {
        state.data = withIssues([
            { number: 1, state: "open" },
            { number: 2, state: "open", blockedBy: [{ number: 1, open: true }] },
            { number: 3, state: "open", owner: true },
            { number: 4, state: "open", branch: true },
            { number: 5, state: "open", pr: true },
            { number: 6, state: "closed", reason: "completed" },
            { number: 7, state: "closed", reason: "not_planned" },
        ]);
        const wrapper = await mountSuspended(Page, { global });

        await button(wrapper, "Delete project…")?.trigger("click");

        expect(wrapper.find("dialog").text()).toContain(
            "3 tickets are untouched and 4 already started or closed",
        );
        expect(wrapper.find("dialog").text()).toContain("pnpm workflow:drop blog --yes");
    });

    it("offers no delete on the static site", async () => {
        state.editable = false;
        const wrapper = await mountSuspended(Page, { global });

        expect(button(wrapper, "Delete project…")).toBeUndefined();
    });
});
