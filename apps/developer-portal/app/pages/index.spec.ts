import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Page from "./index.vue";

const state = vi.hoisted(() => ({ snapshots: {} as Record<string, { value: unknown }>, issues: null as { value: unknown } | null, reviews: null as unknown }));
mockNuxtImport("useSnapshot", () => (name: string) => ({ data: state.snapshots[name] }));
mockNuxtImport("useIssues", () => () => ({ data: state.issues }));
mockNuxtImport("useReviewPages", () => () => ({ data: state.reviews }));

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
    IssueRow: Issue, SnapshotAge: Snapshot, UIcon: true, NuxtLink: Button,
} };

beforeEach(() => {
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
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("82%");
        expect(wrapper.text()).toContain("Drift");
        expect(wrapper.text()).toContain("GitHub could not be read");
        expect(wrapper.text()).toContain("Open issue");
    });
});
