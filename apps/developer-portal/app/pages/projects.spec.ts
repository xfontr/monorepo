import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Page from "./projects.vue";

const state = vi.hoisted(() => ({ projects: null as unknown, metrics: null as unknown, deployments: null as unknown }));
mockNuxtImport("useSnapshot", () => (name: string) => ({ data: name === "projects" ? state.projects : state.metrics }));
mockNuxtImport("useDeployments", () => () => state.deployments);
const global = { stubs: {
    UDashboardPanel: { template: "<section><slot name='header' /><slot name='body' /></section>" }, UDashboardNavbar: { template: "<header><slot name='right' /></header>" }, UDashboardSidebarCollapse: true, SnapshotAge: true,
    UAlert: { props: { title: String, description: String }, template: "<div>{{ title }} {{ description }}</div>" }, UCard: { template: "<article><slot name='header' /><slot /></article>" }, UButton: { props: { label: String, to: String }, template: "<a :href='to'>{{ label }}</a>" },
} };

beforeEach(() => {
    state.projects = ref({ projects: { projects: [
        { name: "@monorepo/ui", root: "packages/ui", tags: [], dependsOn: [], dependedOnBy: [] },
        { name: "@monorepo/huella-legal", root: "apps/huella-legal", tags: [], dependsOn: [], dependedOnBy: [] },
    ] }, manifest: {} });
    state.metrics = ref({ metrics: { projects: [{ name: "@monorepo/ui", commits: 4, commitsPerWeek: 1, specs: 2, coverageLinesPct: 90 }] }, manifest: {} });
    state.deployments = { data: ref({ deployments: [{ environment: "netlify-huella-legal", state: "success", url: "https://site.example", updatedAt: "2026-09-20" }], error: null }) };
});

describe("projects page", () => {
    it("joins metrics, orders app projects before packages, and shows absent metric values", async () => {
        const wrapper = await mountSuspended(Page, { global });
        expect(wrapper.text().indexOf("@monorepo/huella-legal")).toBeLessThan(wrapper.text().indexOf("@monorepo/ui"));
        expect(wrapper.text()).toContain("4");
        expect(wrapper.text()).toContain("90");
        expect(wrapper.text()).toContain("—");
    });

    it("uses deployment URLs and reports live deployment failures without hiding cards", async () => {
        const wrapper = await mountSuspended(Page, { global });
        expect(wrapper.find("a[href='https://site.example']").exists()).toBe(true);
        state.deployments = { data: ref({ deployments: [], error: "GitHub unavailable" }) };
        const failed = await mountSuspended(Page, { global });
        expect(failed.text()).toContain("Live deployment status is unavailable");
        expect(failed.text()).toContain("@monorepo/huella-legal");
        void wrapper;
    });
});
