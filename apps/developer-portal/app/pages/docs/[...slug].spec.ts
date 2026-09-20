import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { reactive, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Page from "./[...slug].vue";

const state = vi.hoisted(() => ({ route: null as { params: { slug: string[] } } | null, sections: null as unknown, snapshot: null as unknown, page: null as { value: unknown } | null }));
mockNuxtImport("useRoute", () => () => state.route);
mockNuxtImport("useWiki", () => () => ({ data: state.sections }));
mockNuxtImport("useSnapshot", () => () => ({ data: state.snapshot }));
mockNuxtImport("useAsyncData", () => () => ({ data: state.page }));

const global = { stubs: {
    UDashboardPanel: { template: "<section><slot name='header' /><slot name='body' /></section>" }, UDashboardNavbar: { template: "<header><slot name='right' /></header>" }, UDashboardSidebarCollapse: true, WikiNav: true,
    UBreadcrumb: { props: { items: Array }, template: "<nav>{{ items?.map(item => item.label).join(' / ') }}</nav>" }, UAlert: { props: { title: String, description: String }, template: "<div class='alert'>{{ title }} {{ description }}</div>" }, UPageBody: { template: "<div><slot /></div>" }, ContentRenderer: { props: { value: Object }, template: "<div>{{ value?.title }}</div>" }, USeparator: true, UContentToc: { template: "<aside>toc</aside>" }, NuxtLink: { props: { to: String }, template: "<a :href='to'><slot /></a>" },
} };

beforeEach(() => {
    state.route = reactive({ params: { slug: ["docs", "guides", "first-hour"] } });
    state.sections = ref([{ id: "docs", label: "Docs", icon: "", groups: [{ key: "guides", label: "Guides", entries: [
        { path: "/docs/guides/first-hour", label: "First hour", kind: "doc" }, { path: "/docs/guides/next", label: "Next", kind: "doc" },
    ] }] }]);
    state.snapshot = ref({ docs: { pages: [{ path: "docs/guides/first-hour.md", words: 10, updatedAt: "2026-09-20", brokenLinks: [{ href: "./missing" }] }] } });
    state.page = ref({ title: "First hour", body: { toc: { links: [{ id: "intro" }] } } });
});

describe("doc detail page", () => {
    it("renders breadcrumbs, broken links, table of contents and in-group neighbours", async () => {
        const wrapper = await mountSuspended(Page, { global });
        expect(wrapper.text()).toContain("Docs");
        expect(wrapper.text()).toContain("This page links to something that is not there");
        expect(wrapper.text()).toContain("toc");
        expect(wrapper.find("a[href='/docs/docs/guides/next']").exists()).toBe(true);
    });

    it("renders not found and tracks a changed route parameter", async () => {
        state.page = ref(null);
        const wrapper = await mountSuspended(Page, { global });
        expect(wrapper.text()).toContain("No such page");
        state.route!.params.slug = ["docs", "guides", "next"];
        state.page!.value = { title: "Next" };
        await wrapper.vm.$nextTick();
        expect(wrapper.text()).toContain("Next");
    });
});
