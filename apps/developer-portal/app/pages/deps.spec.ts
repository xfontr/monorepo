import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Page from "./deps.vue";

const state = vi.hoisted(() => ({ snapshot: null as { value: unknown } | null }));
mockNuxtImport("useSnapshot", () => () => ({ data: state.snapshot }));

const global = {
    stubs: {
        UDashboardPanel: { template: "<section><slot name='header' /><slot name='body' /></section>" }, UDashboardNavbar: { template: "<header><slot name='right' /></header>" }, UDashboardSidebarCollapse: true,
        SnapshotAge: true, StatTile: { props: { label: String, value: [String, Number] }, template: "<div class='tile'>{{ label }} {{ value }}</div>" },
        UCard: { template: "<article><slot name='header' /><slot /></article>" }, UIcon: true,
    },
};

beforeEach(() => {
    state.snapshot = ref(null);
});

describe("dependencies page", () => {
    it("keeps an unavailable audit distinct from zero vulnerabilities", async () => {
        state.snapshot!.value = { deps: { vulnerabilities: null, totalDependencies: null, advisories: [], outdated: null }, manifest: {} };
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("Not collected.");
        expect(wrapper.text()).not.toContain("No known vulnerabilities.");
    });

    it("renders advisory severity and outdated package details from populated data", async () => {
        state.snapshot!.value = {
            deps: {
                vulnerabilities: { info: 0, low: 1, moderate: 2, high: 3, critical: 4 }, totalDependencies: 99,
                advisories: [{ id: 1, moduleName: "vue", severity: "high", title: "Security issue", patchedVersions: ">=3", url: "https://example.test", paths: ["app > vue"] }],
                outdated: [{ name: "vue", current: "3.5.0", wanted: "3.5.1", latest: "3.6.0", isDeprecated: true, dependents: ["apps/site"] }],
            }, manifest: {},
        };
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("Security issue");
        expect(wrapper.text()).toContain("vue");
        expect(wrapper.text()).toContain("3.5.0");
        expect(wrapper.text()).toContain("3.6.0");
        expect(wrapper.text()).toContain("apps/site");
    });

    it("labels empty and failed outdated reads separately", async () => {
        state.snapshot!.value = { deps: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 }, advisories: [], outdated: [] }, manifest: {} };
        let wrapper = await mountSuspended(Page, { global });
        expect(wrapper.text()).toContain("Everything is on its wanted version.");

        state.snapshot!.value = { deps: { vulnerabilities: null, advisories: [], outdated: null }, manifest: {} };
        wrapper = await mountSuspended(Page, { global });
        expect(wrapper.text()).toContain("Not collected.");
    });
});
