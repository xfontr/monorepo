import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Page from "./projects.vue";

const state = vi.hoisted(() => ({
    projects: null as unknown,
    metrics: null as unknown,
    deployments: null as unknown,
    readmes: [] as unknown[],
    asyncData: vi.fn(),
    query: vi.fn(),
}));
mockNuxtImport("useSnapshot", () => (name: string) => ({ data: name === "projects" ? state.projects : state.metrics }));
mockNuxtImport("useDeployments", () => () => state.deployments);
mockNuxtImport("useAsyncData", () => state.asyncData);
mockNuxtImport("queryCollection", () => state.query);
const global = {
    stubs: {
        UDashboardPanel: { template: "<section><slot name='header' /><slot name='body' /></section>" }, UDashboardNavbar: { template: "<header><slot name='right' /></header>" }, UDashboardSidebarCollapse: true, SnapshotAge: true,
        UAlert: { props: { title: String, description: String }, template: "<div>{{ title }} {{ description }}</div>" }, UCard: { template: "<article><slot name='header' /><slot /></article>" }, UButton: { props: { label: String, to: String }, template: "<a :href='to'>{{ label }}</a>" }, UBadge: { props: { label: String }, template: "<span>{{ label }}</span>" },
    },
};

beforeEach(() => {
    vi.clearAllMocks();
    const query = { select: vi.fn(), all: vi.fn().mockImplementation(() => state.readmes) };
    query.select.mockReturnValue(query);
    state.query.mockReturnValue(query);
    state.asyncData.mockImplementation((_key: string, handler: () => unknown) => ({ data: ref(handler()) }));
    state.readmes = [{ path: "/packages/ui/readme", title: "UI kit", description: "Shared interface pieces." }];
    state.projects = ref({
        projects: {
            projects: [
                { name: "@monorepo/ui", root: "packages/UI", tags: [], dependsOn: ["@monorepo/configs"], dependedOnBy: ["@monorepo/developer-portal"] },
                { name: "@monorepo/huella-legal", root: "apps/huella-legal", tags: [], dependsOn: [], dependedOnBy: [] },
                { name: "@monorepo/scripts", root: "infrastructure/scripts", tags: [], dependsOn: [], dependedOnBy: [] },
            ],
        }, manifest: {},
    });
    state.metrics = ref({ metrics: { projects: [{ name: "@monorepo/ui", commits: 4, commitsPerWeek: 1, specs: 2, coverageLinesPct: 90 }] }, manifest: {} });
    state.deployments = { data: ref({ deployments: [{ environment: "huella-legal", state: "success", url: "https://site.example", updatedAt: "2026-09-20" }], error: null }) };
});

describe("projects page", () => {
    it("keeps card metrics paired with their units and leaves missing values visible", async () => {
        const wrapper = await mountSuspended(Page, { global });
        expect(wrapper.text().indexOf("@monorepo/huella-legal")).toBeLessThan(wrapper.text().indexOf("UI kit"));
        expect(wrapper.text()).toContain("UI kit");
        expect(wrapper.text()).toContain("Shared building block");
        expect(wrapper.text()).toContain("Application");
        expect(wrapper.text()).toContain("Repository tooling");
        expect(wrapper.find("a[href='/docs/packages/ui/readme']").exists()).toBe(true);
        const uiCard = wrapper.findAll("article").find((card) => card.text().includes("UI kit"));
        const uiCardText = uiCard?.text().replace(/\s+/g, " ").trim();
        expect(uiCardText).toContain("Commits");
        expect(uiCardText).toContain("4 (1 / week)");
        expect(uiCardText).toContain("Tests");
        expect(uiCardText).toContain("2 (90% coverage)");
        expect(uiCardText).not.toContain("Commits / week (last 90 days)");
        expect(uiCardText).not.toContain("Line coverage");

        const toolingCard = wrapper.findAll("article").find((card) => card.text().includes("@monorepo/scripts"));
        const toolingCardText = toolingCard?.text().replace(/\s+/g, " ").trim();
        expect(toolingCardText).toContain("Commits —");
        expect(toolingCardText).toContain("Tests —");
    });

    it("renders relationships and data-backed site actions while keeping isolated projects explicit", async () => {
        const wrapper = await mountSuspended(Page, { global });
        expect(wrapper.text()).toContain("Uses: @monorepo/configs");
        expect(wrapper.text()).toContain("Used by: @monorepo/developer-portal");
        expect(wrapper.find("a[href='https://site.example']").exists()).toBe(true);
        expect(wrapper.find("a[href$='/storybook/']").exists()).toBe(true);
        expect(wrapper.find("a[href$='/actions/workflows/netlify-deployment.yml']").exists()).toBe(true);
        const tooling = wrapper.findAll("article").find((card) => card.text().includes("@monorepo/scripts"));
        expect(tooling?.text()).toContain("No project relationships recorded.");
        expect(tooling?.text()).not.toContain("Storybook");
        expect(tooling?.text()).not.toContain("Deploys");
        state.deployments = { data: ref({ deployments: [], error: "GitHub unavailable" }) };
        const failed = await mountSuspended(Page, { global });
        expect(failed.text()).toContain("Live deployment status is unavailable");
        expect(failed.text()).toContain("@monorepo/huella-legal");
        void wrapper;
    });

    it("renders no misleading cards when the collected project groups are empty", async () => {
        state.projects = ref({ projects: { projects: [] }, manifest: {} });
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.findAll("article")).toHaveLength(0);
    });
});
