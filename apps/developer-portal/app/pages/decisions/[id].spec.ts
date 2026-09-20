import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { reactive, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Page from "./[id].vue";

const state = vi.hoisted(() => ({ reports: null as unknown, route: null as { params: { id: string } } | null, page: null as { value: unknown } | null }));
mockNuxtImport("useDecisionReports", () => () => state.reports);
mockNuxtImport("useRoute", () => () => state.route);
mockNuxtImport("useAsyncData", () => () => ({ data: state.page }));

const global = { stubs: {
    UDashboardPanel: { template: "<section><slot name='header' /><slot name='body' /></section>" }, UDashboardNavbar: { template: "<header><slot name='right' /></header>" }, UDashboardSidebarCollapse: true, UBreadcrumb: { props: { items: Array }, template: "<nav>{{ items?.map(item => item.label).join(' / ') }}</nav>" },
    StatusPill: { props: { label: String, to: String }, template: "<a :href='to'>{{ label }}</a>" }, UPageBody: { template: "<div><slot /></div>" }, ContentRenderer: { props: { value: Object }, template: "<div>{{ value?.title }}</div>" }, USeparator: true, UContentToc: { template: "<aside>toc</aside>" }, NuxtLink: { props: { to: String }, template: "<a :href='to'><slot /></a>" },
} };

const report = (id: string, status: "implemented" | "to-implement", decision: "accepted" | "superseded", supersededBy: string | null) => ({ id, path: `docs/decisions/${id}.md`, number: id.slice(0, 4), title: id, status, decision, supersededBy, updatedAt: "2026-09-20", words: 10 });
beforeEach(() => {
    state.reports = ref([report("0001-first", "implemented", "accepted", null), report("0002-second", "to-implement", "superseded", "0003-third.md"), report("0003-third", "implemented", "accepted", null)]);
    state.route = reactive({ params: { id: "0002-second" } });
    state.page = ref({ title: "Decision page", body: { toc: { links: [{ id: "one" }] } } });
});

describe("decision detail page", () => {
    it("renders status, superseded replacement and both neighbours in decision order", async () => {
        const wrapper = await mountSuspended(Page, { global });
        expect(wrapper.text()).toContain("Decision page");
        expect(wrapper.text()).toContain("To implement");
        expect(wrapper.text()).toContain("toc");
        expect(wrapper.find("a[href='/decisions/0003-third']").exists()).toBe(true);
        expect(wrapper.find("a[href='/decisions/0001-first']").exists()).toBe(true);
        expect(wrapper.find("a[href='/decisions/0003-third']").exists()).toBe(true);
    });

    it("omits the previous link for the first report and the next link for the last report", async () => {
        state.route = reactive({ params: { id: "0001-first" } });
        const first = await mountSuspended(Page, { global });

        expect(first.find("a[href='/decisions/0001-first']").exists()).toBe(false);
        expect(first.find("a[href='/decisions/0002-second']").exists()).toBe(true);

        state.route!.params.id = "0003-third";
        await first.vm.$nextTick();

        expect(first.find("a[href='/decisions/0002-second']").exists()).toBe(true);
        expect(first.find("a[href='/decisions/0003-third']").exists()).toBe(false);
    });

    it("shows the not-found state and updates the selected content when the route changes", async () => {
        state.route = reactive({ params: { id: "missing" } });
        state.page = ref(null);
        const wrapper = await mountSuspended(Page, { global });
        expect(wrapper.text()).toContain("No such report");
        state.route!.params.id = "0001-first";
        state.page!.value = { title: "First page" };
        await wrapper.vm.$nextTick();
        expect(wrapper.text()).toContain("First page");
    });
});
