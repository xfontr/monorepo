import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Page from "./coverage.vue";

const state = vi.hoisted(() => ({ snapshot: null as { value: unknown } | null }));
mockNuxtImport("useSnapshot", () => () => ({ data: state.snapshot }));

const global = { stubs: {
    UDashboardPanel: { template: "<section><slot name='header' /><slot name='body' /></section>" },
    UDashboardNavbar: { template: "<header><slot name='right' /></header>" }, UDashboardSidebarCollapse: true,
    SnapshotAge: true, StatTile: { props: { label: String, value: [String, Number] }, template: "<div class='tile'>{{ label }} {{ value }}</div>" },
    UCard: { template: "<article><slot name='header' /><slot /></article>" }, UAlert: { props: { title: String, description: String }, template: "<div>{{ title }} {{ description }}</div>" },
    UButton: { props: { to: String }, template: "<a :href='to'><slot />Open full</a>" }, UIcon: true,
} };

beforeEach(() => {
    state.snapshot = ref(null);
});

describe("coverage page", () => {
    it("renders all weighted totals and distinguishes collected from uncollected projects", async () => {
        state.snapshot!.value = { coverage: { totals: { lines: 80, statements: 81, functions: 82, branches: 83 }, projects: [
            { name: "tested", collected: true, files: 3, lines: { pct: 91 }, statements: { pct: 90 }, functions: { pct: 89 }, branches: { pct: 88 } },
            { name: "missing", collected: false, files: 0 },
        ] }, manifest: {} };
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("80%");
        expect(wrapper.text()).toContain("83%");
        expect(wrapper.text()).toContain("91%");
        expect(wrapper.text()).toContain("3");
        expect(wrapper.text()).toContain("not collected");
    });

    it("shows the collection instruction without a report and embeds the base-aware report when present", async () => {
        state.snapshot!.value = { coverage: { totals: null, projects: [], report: false }, manifest: {} };
        let wrapper = await mountSuspended(Page, { global });
        expect(wrapper.text()).toContain("No HTML report copied in");

        state.snapshot!.value = { coverage: { totals: null, projects: [], report: true }, manifest: {} };
        wrapper = await mountSuspended(Page, { global });
        expect(wrapper.find("iframe").attributes("src")).toContain("/embed/coverage/index.html");
        expect(wrapper.find("a").attributes("href")).toContain("/embed/coverage/index.html");
    });
});
