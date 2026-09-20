import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { defineComponent, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Page from "./index.vue";
import type { DecisionReport } from "#shared/decisionReports.ts";

const state = vi.hoisted(() => ({ reports: null as unknown }));
mockNuxtImport("useSnapshot", () => () => ({ data: ref({ manifest: {} }) }));
mockNuxtImport("useDecisionReports", () => () => state.reports);

const ControlStub = defineComponent({
    props: {
        modelValue: { type: String, default: "" },
        items: { type: Array, default: () => [] },
    },
    emits: ["update:modelValue"],
    template: "<input v-if='items.length === 0' :value='modelValue' @input='$emit(\"update:modelValue\", $event.target.value)' /><select v-else :value='modelValue' @change='$emit(\"update:modelValue\", $event.target.value)'><option v-for='item in items' :value='item.value'>{{ item.label }}</option></select>",
});
const global = { stubs: {
    UDashboardPanel: { template: "<section><slot name='header' /><slot name='body' /></section>" }, UDashboardNavbar: { template: "<header><slot name='right' /></header>" }, UDashboardSidebarCollapse: true, UDashboardToolbar: { template: "<div><slot name='left' /><slot name='right' /></div>" },
    UInput: ControlStub, USelect: ControlStub, SnapshotAge: true, StatTile: { props: { label: String, value: [String, Number] }, template: "<div>{{ label }} {{ value }}</div>" }, UCard: { template: "<article><slot name='header' /><slot /></article>" }, StatusPill: { props: { label: String, hint: String }, template: "<span>{{ label }} {{ hint }}</span>" }, UIcon: true,
} };

const report = (id: string, status: DecisionReport["status"], decision: DecisionReport["decision"], title: string, updatedAt: string, supersededBy: string | null = null): DecisionReport => ({ path: `docs/decisions/${id}.md`, id, number: id.slice(0, 4), title, status, decision, supersededBy, updatedAt, words: 10 });
beforeEach(() => {
    state.reports = ref([report("0002-new", "implemented", "accepted", "New", "2026-09-20"), report("0001-old", "to-implement", "superseded", "Old", "2026-09-19")]);
});

describe("decisions index page", () => {
    it("counts every report even when the visible filter narrows the list", async () => {
        const wrapper = await mountSuspended(Page, { global });
        await wrapper.find("input").setValue("New");
        expect(wrapper.text()).toContain("Implemented 1");
        expect(wrapper.text()).toContain("To implement 1");
        expect(wrapper.text()).toContain("New");
        expect(wrapper.find("a[href='/decisions/0001-old']").exists()).toBe(false);
    });

    it("wires status, outcome, text and sort controls to the visible reports", async () => {
        const wrapper = await mountSuspended(Page, { global });
        const selects = wrapper.findAll("select");
        await selects[0]!.setValue("to-implement");
        expect(wrapper.find("a[href='/decisions/0001-old']").exists()).toBe(true);
        expect(wrapper.find("a[href='/decisions/0002-new']").exists()).toBe(false);
        await selects[2]!.setValue("oldest");
        expect(wrapper.findAll("a[href^='/decisions/']").map((link) => link.attributes("href"))).toEqual([
            "/decisions/0001-old",
        ]);
    });

    it("filters by decision outcome and keeps a superseded replacement visible in its pill hint", async () => {
        state.reports = ref([
            report("0002-new", "implemented", "accepted", "New", "2026-09-20"),
            report("0001-old", "to-implement", "superseded", "Old", "2026-09-19", "0002-new.md"),
        ]);
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("Superseded by 0002-new.md");
        const decision = wrapper.findAll("select")[1]!;
        await decision.setValue("superseded");
        expect(wrapper.find("a[href='/decisions/0001-old']").exists()).toBe(true);
        await decision.setValue("accepted");
        expect(wrapper.find("a[href='/decisions/0002-new']").exists()).toBe(true);
        expect(wrapper.find("a[href='/decisions/0001-old']").exists()).toBe(false);
    });

    it("shows an honest empty state when no report matches", async () => {
        const wrapper = await mountSuspended(Page, { global });
        await wrapper.find("input").setValue("missing");
        expect(wrapper.text()).toContain("Nothing matches that filter.");
    });
});
