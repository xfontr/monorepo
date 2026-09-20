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
    it("groups current projects and keeps the embedded graph URL base-aware", async () => {
        state.projects = ref({ projects: { projects: [
            { name: "app", root: "apps/app", tags: ["type:app"], dependsOn: ["@monorepo/ui"], dependedOnBy: [] },
            { name: "ui", root: "packages/ui", tags: ["type:ui"], dependsOn: [], dependedOnBy: ["app"] },
            { name: "scripts", root: "infrastructure/scripts", tags: ["type:tooling"], dependsOn: [], dependedOnBy: [] },
        ] }, manifest: { commit: "abc" } });
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.find("iframe").attributes("src")).toContain("/embed/graph/index.html");
        expect(wrapper.text()).toContain("Applications");
        expect(wrapper.text()).toContain("Shared building blocks");
        expect(wrapper.text()).toContain("Repository tooling");
        expect(wrapper.text()).toContain("app");
        expect(wrapper.text()).toContain("ui");
        expect(wrapper.text()).toContain("scripts");
        expect(wrapper.text()).toContain("Uses: @monorepo/ui");
        expect(wrapper.text()).toContain("Used by: app");
    });

    it("marks empty project groups instead of inventing graph entries", async () => {
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("No projects in this group.");
        expect(wrapper.findAll("article").filter((card) => card.text().includes("Shared building blocks"))).toHaveLength(1);
    });

    it("passes the projects manifest to snapshot age and surfaces invariant findings", async () => {
        state.metrics!.value = { metrics: { invariantFindings: [{ id: "x", title: "Drift" }] } };
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("Drift");
        expect(wrapper.text()).toContain("abc");
    });
});
