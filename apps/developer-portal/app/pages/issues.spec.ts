import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { defineComponent, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Page from "./issues.vue";

const state = vi.hoisted(() => ({ read: null as { value: unknown } | null }));
const reload = vi.fn().mockResolvedValue(undefined);
mockNuxtImport("useIssues", () => () => ({ data: state.read, reload }));
const Input = defineComponent({ props: { modelValue: String }, emits: ["update:modelValue"], template: "<input :value='modelValue' @input='$emit(\"update:modelValue\", $event.target.value)' />" });
const Select = defineComponent({ props: { modelValue: String, items: Array }, emits: ["update:modelValue"], template: "<select :value='modelValue' @change='$emit(\"update:modelValue\", $event.target.value)'><option v-for='item in items' :value='item.value'>{{ item.label }}</option></select>" });
const global = { stubs: {
    UDashboardPanel: { template: "<section><slot name='header' /><slot name='body' /></section>" }, UDashboardNavbar: { template: "<header><slot name='right' /></header>" }, UDashboardSidebarCollapse: true, UDashboardToolbar: { template: "<div><slot name='left' /><slot name='right' /></div>" }, UInput: Input, USelect: Select,
    UButton: { emits: ["click"], template: "<button @click='$emit(\"click\")' />" }, UCard: { template: "<article><slot name='header' /><slot /></article>" }, UAlert: { props: { title: String, description: String }, template: "<div>{{ title }} {{ description }}</div>" }, IssueRow: { props: { issue: Object }, template: "<div class='row'>{{ issue.title }}</div>" }, UIcon: true,
} };

beforeEach(() => {
    reload.mockClear();
    state.read = ref({ fetchedAt: "2026-09-20", error: null, issues: [
        { number: 1, title: "Fix portal", body: "Alpha", labels: ["bug"], updatedAt: "2026-09-20", url: "" },
        { number: 2, title: "Add docs", body: "Beta", labels: ["docs"], updatedAt: "2026-09-19", url: "" },
    ] });
});

describe("issues page", () => {
    it("filters by search and label, offers labels from the live data, and sorts newest first", async () => {
        const wrapper = await mountSuspended(Page, { global });
        expect(wrapper.text().indexOf("Fix portal")).toBeLessThan(wrapper.text().indexOf("Add docs"));
        expect(wrapper.findAll("select").at(0)?.text()).toContain("bug");
        await wrapper.find("input").setValue("docs");
        expect(wrapper.text()).toContain("Add docs");
        expect(wrapper.text()).not.toContain("Fix portal");
    });

    it("renders live failures and delegates refresh to the composable", async () => {
        state.read = ref({ fetchedAt: "", error: "rate limited", issues: [] });
        const wrapper = await mountSuspended(Page, { global });
        expect(wrapper.text()).toContain("GitHub could not be reached");
        state.read!.value = { fetchedAt: "", error: null, issues: [] };
        await wrapper.vm.$nextTick();
        expect(wrapper.text()).toContain("No open issues.");
        await wrapper.find("button").trigger("click");
        expect(reload).toHaveBeenCalledOnce();
    });
});
