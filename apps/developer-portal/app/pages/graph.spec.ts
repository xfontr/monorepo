import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Page from "./graph.vue";

const state = vi.hoisted(() => ({ projects: null as { value: unknown } | null, metrics: null as { value: unknown } | null }));
mockNuxtImport("useSnapshot", () => (name: string) => ({ data: name === "projects" ? state.projects : state.metrics }));

const global = { stubs: {
    UDashboardPanel: { template: "<section><slot name='header' /><slot name='body' /></section>" }, UDashboardNavbar: { template: "<header><slot name='right' /></header>" }, UDashboardSidebarCollapse: true, SnapshotAge: { props: { manifest: Object }, template: "<div>{{ manifest?.commit }}</div>" },
    UCard: { template: "<article><slot name='header' /><slot /></article>" }, UAlert: { props: { title: String }, template: "<div>{{ title }}</div>" }, UBadge: { props: { label: String }, template: "<span>{{ label }}</span>" },
} };

beforeEach(() => {
    state.projects = ref({ projects: { projects: [{ name: "app", root: "apps/app", tags: ["type:app"], dependsOn: [], dependedOnBy: [] }] }, manifest: { commit: "abc" } });
    state.metrics = ref({ metrics: { invariantFindings: [] } });
});

describe("graph page", () => {
    it("uses the base-aware embedded graph URL and the same resolved action target", async () => {
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.find("iframe").attributes("src")).toContain("/embed/graph/index.html");
        expect(wrapper.text()).toContain("app");
    });

    it("passes the projects manifest to snapshot age and surfaces invariant findings", async () => {
        state.metrics!.value = { metrics: { invariantFindings: [{ id: "x", title: "Drift" }] } };
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("Drift");
        expect(wrapper.text()).toContain("abc");
    });
});
