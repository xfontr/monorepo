import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Page from "./index.vue";

const state = vi.hoisted(() => ({
    snapshots: {} as Record<string, { value: unknown }>,
    issues: null as { value: unknown } | null,
    reviews: null as unknown,
    readmes: [] as unknown[],
    asyncData: vi.fn(),
    query: vi.fn(),
}));
mockNuxtImport("useSnapshot", () => (name: string) => ({ data: state.snapshots[name] }));
mockNuxtImport("useIssues", () => () => ({ data: state.issues }));
mockNuxtImport("useReviewPages", () => () => ({ data: state.reviews }));
mockNuxtImport("useAsyncData", () => state.asyncData);
mockNuxtImport("queryCollection", () => state.query);

const Panel = { template: "<section><slot name='header' /><slot name='body' /></section>" };
const Card = { template: "<article><slot name='header' /><slot /></article>" };
const Alert = { props: { title: String, description: String }, template: "<div class='alert'>{{ title }} {{ description }}<slot /></div>" };
const Tile = { props: { label: String, value: [String, Number], hint: String }, template: "<div class='tile'>{{ label }} {{ value }} {{ hint }}</div>" };
const Button = { props: { to: String, label: String }, template: "<a :href='to'>{{ label }}</a>" };
const Issue = { props: { issue: Object }, template: "<div class='issue'>{{ issue.title }}</div>" };
const Snapshot = { props: { manifest: Object }, template: "<div class='age'>{{ manifest?.commit }}</div>" };

const global = { stubs: {
    UDashboardPanel: Panel, UDashboardNavbar: { props: { title: String }, template: "<header>{{ title }}<slot name='right' /></header>" },
    UDashboardSidebarCollapse: true, UCard: Card, UAlert: Alert, StatTile: Tile, UButton: Button,
    IssueRow: Issue, SnapshotAge: Snapshot, UIcon: true, UBadge: { props: { label: String }, template: "<span>{{ label }}</span>" }, NuxtLink: Button,
} };

beforeEach(() => {
    vi.clearAllMocks();
    const query = { select: vi.fn(), all: vi.fn().mockImplementation(() => state.readmes) };
    query.select.mockReturnValue(query);
    state.query.mockReturnValue(query);
    state.asyncData.mockImplementation((_key: string, handler: () => unknown) => ({ data: ref(handler()) }));
    state.readmes = [];
    state.snapshots = {
        projects: ref({ projects: { projects: [] } }),
        coverage: ref({ coverage: { totals: { lines: 82 } } }),
        docs: ref({ docs: { pages: [], brokenLinkCount: 0 } }),
        deps: ref({ deps: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 }, advisories: [] } }),
        metrics: ref({ metrics: { invariantFindings: [] } }),
    };
    state.issues = ref({ issues: [], error: null, fetchedAt: "" });
    state.reviews = ref([]);
});

describe("overview page", () => {
    it("loads repository metadata, features applications, and links newcomer routes", async () => {
        state.readmes = [
            { path: "/readme", title: "Repository overview", description: "What this repository contains." },
            { path: "/apps/huella-legal/readme", title: "Huella Legal", description: "The legal app." },
        ];
        state.snapshots.projects!.value = { projects: { projects: [
            { name: "@monorepo/huella-legal", root: "apps/huella-legal", tags: [], dependsOn: [], dependedOnBy: [] },
            { name: "@monorepo/ui", root: "packages/ui", tags: [], dependsOn: [], dependedOnBy: [] },
        ] } };
        const wrapper = await mountSuspended(Page, { global });

        expect(state.query).toHaveBeenCalledWith("docs");
        expect(wrapper.text()).toContain("Repository overview");
        expect(wrapper.text()).toContain("What this repository contains.");
        expect(wrapper.text()).toContain("Huella Legal");
        expect(wrapper.text()).not.toContain("@monorepo/ui");
        expect(wrapper.find("a[href='/projects']").exists()).toBe(true);
        expect(wrapper.find("a[href='/graph']").exists()).toBe(true);
        expect(wrapper.find("a[href='/docs/docs/guides/first-hour']").exists()).toBe(true);
        expect(wrapper.find("a[href='/docs/apps/huella-legal/readme']").exists()).toBe(true);
    });

    it("uses honest repository and project fallbacks when README metadata is absent", async () => {
        state.snapshots.projects!.value = { projects: { projects: [
            { name: "@monorepo/huella-legal", root: "apps/huella-legal", tags: [], dependsOn: [], dependedOnBy: [] },
        ] } };
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("Monorepo");
        expect(wrapper.text()).toContain("The repository summary is not available yet.");
        expect(wrapper.text()).toContain("No project description is available yet.");
    });

    it("uses absent markers for missing collected sections instead of inventing values", async () => {
        state.snapshots.coverage!.value = {};
        state.snapshots.docs!.value = {};
        state.snapshots.deps!.value = {};
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("—");
        expect(wrapper.text()).toContain("not collected");
    });

    it("feeds collected artifacts into overview tiles and surfaces findings and live issue failures", async () => {
        state.snapshots.docs!.value = { docs: { pages: [{ path: "docs/a.md", brokenLinks: [{ href: "./missing" }] }], brokenLinkCount: 1 } };
        state.snapshots.metrics!.value = { metrics: { invariantFindings: [{ id: "drift", title: "Drift", detail: "Fix it" }] } };
        state.issues!.value = { issues: [{ number: 4, title: "Open issue" }], error: "GitHub offline", fetchedAt: "" };
        state.reviews = ref([{ path: "/docs/reviews/2026.md" }]);
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("82%");
        expect(wrapper.text()).toContain("Drift");
        expect(wrapper.text()).toContain("GitHub could not be read");
        expect(wrapper.text()).toContain("Open issue");
        expect(wrapper.find("a[href='/docs/docs/a']").exists()).toBe(true);
        expect(wrapper.find("a[href='/reviews/2026.md']").exists()).toBe(true);
    });
});
