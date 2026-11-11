import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import type { VueWrapper } from "@vue/test-utils";
import { nextTick, ref } from "vue";
import { parse } from "yaml";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { assembleWorkflows } from "#layers/workflows/shared/workflows.ts";
import Page from "./new.vue";

const state = vi.hoisted(() => ({
    data: null as unknown,
    editable: true,
    edit: vi.fn(),
    navigateTo: vi.fn(),
    leaveGuard: null as null | ((to: { fullPath: string }) => boolean),
}));
mockNuxtImport("useWorkflows", () => () => ({ data: state.data }));
mockNuxtImport("useWorkflowEdit", () => () => ({ editable: state.editable, edit: state.edit }));
mockNuxtImport("navigateTo", () => state.navigateTo);
mockNuxtImport("onBeforeRouteLeave", () => (guard: typeof state.leaveGuard) => {
    state.leaveGuard = guard;
});

const TEMPLATE = {
    id: "new-website",
    title: "New website",
    stages: [{ id: "build", title: "Build" }],
    groups: [{ id: "blog", title: "Blog", optional: true, default: true }],
    capabilities: [
        { id: "post-page", stage: "build", group: "blog", title: "Post page" },
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
        UStepper: true,
        UButton: {
            props: { label: String, disabled: Boolean },
            emits: ["click"],
            template: "<button :disabled='disabled' @click=\"$emit('click')\">{{ label }}</button>",
        },
        UIcon: true,
        UTooltip: { template: "<span><slot /></span>" },
        UModal: {
            props: { open: Boolean },
            template:
                "<dialog v-if='open' open><slot name='body' /><slot name='footer' /></dialog>",
        },
    },
};

const button = (wrapper: VueWrapper, label: string) =>
    wrapper.findAll("button").find((candidate) => candidate.text() === label);

beforeEach(() => {
    vi.clearAllMocks();
    state.editable = true;
    state.edit.mockResolvedValue(true);
    state.data = ref(
        assembleWorkflows([{ file: "new-website.yaml", ok: true, value: TEMPLATE }], [], {}),
    );
});

describe("new project wizard", () => {
    it("writes the features and ticket size picked on the way, and nothing to GitHub", async () => {
        const wrapper = await mountSuspended(Page, { global });

        await button(wrapper, "Next")?.trigger("click");
        await wrapper.find("input").setValue("Harbour Notes");
        await button(wrapper, "Next")?.trigger("click");
        await wrapper
            .findAll("[role='switch']")
            .find((card) => card.text().includes("Search"))
            ?.trigger("click");
        await wrapper
            .find("[aria-label='Ticket size']")
            .findAll("[role='radio']")
            .find((option) => option.text().startsWith("Lean"))
            ?.trigger("click");
        await button(wrapper, "Next")?.trigger("click");
        await button(wrapper, "Create project")?.trigger("click");

        expect(state.edit).toHaveBeenCalledWith({
            action: "create",
            project: "harbour-notes",
            template: "new-website",
            title: "Harbour Notes",
            summary: "",
            milestone: "Harbour Notes",
            area: "app:harbour-notes",
            switches: { search: true },
            ticketSize: "lean",
        });
        expect(state.navigateTo).toHaveBeenCalledWith("/workflows/harbour-notes");
        expect(state.leaveGuard?.({ fullPath: "/workflows/harbour-notes" })).toBe(true);
    });

    it("holds a navigation away from a started wizard until the user leaves anyway", async () => {
        const wrapper = await mountSuspended(Page, { global });
        expect(state.leaveGuard?.({ fullPath: "/workflows" })).toBe(true);

        await button(wrapper, "Next")?.trigger("click");
        expect(state.leaveGuard?.({ fullPath: "/workflows" })).toBe(false);
        await nextTick();

        await button(wrapper, "Leave without creating")?.trigger("click");

        expect(state.navigateTo).toHaveBeenCalledWith("/workflows");
        expect(state.leaveGuard?.({ fullPath: "/workflows" })).toBe(true);
        expect(state.edit).not.toHaveBeenCalled();
    });

    it("keeps the ticket size in view on every step, priced for the features picked so far", async () => {
        const wrapper = await mountSuspended(Page, { global });
        const size = (title: string) =>
            wrapper
                .find("[aria-label='Ticket size']")
                .findAll("[role='radio']")
                .find((option) => option.text().startsWith(title))
                ?.text();

        expect(size("Lean")).toMatch(/\D1$/);

        await button(wrapper, "Next")?.trigger("click");
        await wrapper.find("input").setValue("Harbour Notes");
        await button(wrapper, "Next")?.trigger("click");
        await wrapper
            .findAll("[role='switch']")
            .find((card) => card.text().includes("Search"))
            ?.trigger("click");

        expect(size("Lean")).toMatch(/\D1$/);
        expect(size("One per block")).toMatch(/\D2$/);
    });

    it("maps only the blocks the picked features switch on, on the review step", async () => {
        const wrapper = await mountSuspended(Page, { global });
        const mapped = () =>
            wrapper
                .findAll("button[aria-pressed]")
                .map((block) => block.attributes("aria-label")?.split(",")[0]);

        expect(wrapper.text()).not.toContain("Dependency graph");

        await button(wrapper, "Next")?.trigger("click");
        await wrapper.find("input").setValue("Harbour Notes");
        await button(wrapper, "Next")?.trigger("click");
        await button(wrapper, "Next")?.trigger("click");

        expect(mapped()).toEqual(["Post page"]);
    });

    it("won't move past the details until the project has a title", async () => {
        const wrapper = await mountSuspended(Page, { global });

        await button(wrapper, "Next")?.trigger("click");
        await nextTick();

        expect(button(wrapper, "Next")?.attributes("disabled")).toBeDefined();
    });

    it("runs the whole wizard on the static site but locks Create, which has no server to write through", async () => {
        state.editable = false;
        const wrapper = await mountSuspended(Page, { global });

        await button(wrapper, "Next")?.trigger("click");
        await wrapper.find("input").setValue("Harbour Notes");
        await button(wrapper, "Next")?.trigger("click");
        await button(wrapper, "Next")?.trigger("click");
        await button(wrapper, "Create project")?.trigger("click");

        expect(button(wrapper, "Create project")?.attributes("disabled")).toBeDefined();
        expect(button(wrapper, "Download YAML")).toBeDefined();
        expect(state.edit).not.toHaveBeenCalled();
    });

    it("downloads the project file the dev server would have written", async () => {
        state.editable = false;
        const blobs: Blob[] = [];
        vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
            blobs.push(blob as Blob);
            return "blob:project";
        });
        vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
        const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
        const wrapper = await mountSuspended(Page, { global });

        await button(wrapper, "Next")?.trigger("click");
        await wrapper.find("input").setValue("Harbour Notes");
        await button(wrapper, "Next")?.trigger("click");
        await wrapper
            .findAll("[role='switch']")
            .find((card) => card.text().includes("Search"))
            ?.trigger("click");
        await wrapper
            .find("[aria-label='Ticket size']")
            .findAll("[role='radio']")
            .find((option) => option.text().startsWith("Lean"))
            ?.trigger("click");
        await button(wrapper, "Next")?.trigger("click");
        await button(wrapper, "Download YAML")?.trigger("click");

        expect((click.mock.contexts[0] as HTMLAnchorElement | undefined)?.download).toBe(
            "harbour-notes.yaml",
        );
        expect(parse((await blobs[0]?.text()) ?? "")).toEqual({
            id: "harbour-notes",
            title: "Harbour Notes",
            template: "new-website",
            area: "app:harbour-notes",
            milestone: "Harbour Notes",
            summary: "",
            switches: { search: true },
            ticketSize: "lean",
        });
    });

    it("stays on the wizard when the server refuses the project", async () => {
        state.edit.mockResolvedValue(false);
        const wrapper = await mountSuspended(Page, { global });

        await button(wrapper, "Next")?.trigger("click");
        await wrapper.find("input").setValue("Harbour Notes");
        await button(wrapper, "Next")?.trigger("click");
        await button(wrapper, "Next")?.trigger("click");
        await button(wrapper, "Create project")?.trigger("click");

        expect(state.edit).toHaveBeenCalled();
        expect(state.navigateTo).not.toHaveBeenCalled();
    });
});
