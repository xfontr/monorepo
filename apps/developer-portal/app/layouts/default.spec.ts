import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Layout from "./default.vue";

const state = vi.hoisted(() => ({ issues: null as unknown, reviews: null as unknown, badges: null as unknown, sections: null as unknown, execute: vi.fn() }));
mockNuxtImport("useIssues", () => () => ({ data: state.issues }));
mockNuxtImport("useReviewPages", () => () => ({ data: state.reviews }));
mockNuxtImport("useFetch", () => () => ({ data: state.badges }));
mockNuxtImport("useAsyncData", () => () => ({ data: state.sections, status: ref("idle"), execute: state.execute }));

const Search = { name: "UDashboardSearch", props: { groups: Array }, emits: ["update:open"], template: "<div class='search'><a v-for='item in groups?.[0]?.items' :href='item.to'>{{ item.label }}</a></div>" };
const global = { stubs: {
    UDashboardGroup: { template: "<main><slot /></main>" }, UDashboardSidebar: { template: "<aside><slot name='default' :collapsed='false' /><slot name='footer' :collapsed='false' /></aside>" },
    UDashboardSearchButton: { template: "<button aria-label='search'>search</button>" }, UNavigationMenu: { props: { items: Array }, template: "<nav><a v-for='item in items' :href='item.to'>{{ item.label }} {{ item.badge }}</a></nav>" }, UDashboardSearch: Search,
    NuxtLink: { props: { to: String }, template: "<a :href='to'><slot /></a>" }, UIcon: true, UColorModeButton: true, UButton: { inheritAttrs: false, props: { to: String }, template: "<a :href='to' v-bind='$attrs'><slot /></a>" },
} };

beforeEach(() => {
    state.issues = ref({ issues: [], error: null });
    state.reviews = ref([]);
    state.badges = ref({ advisories: 0 });
    state.sections = ref([]);
    state.execute.mockClear();
});

describe("default layout", () => {
    it("keeps every primary section in navigation and omits zero badges", async () => {
        const wrapper = await mountSuspended(Layout, { global });
        expect(wrapper.text()).toContain("Overview");
        expect(wrapper.text()).toContain("Dependencies");
        expect(wrapper.text()).not.toContain("undefined");
        expect(wrapper.findAll("nav a").map((link) => link.text())).toEqual(expect.arrayContaining(["Issues", "Reviews"]));
    });

    it("renders non-zero badges, uses the repository source link, and defers search data", async () => {
        state.issues = ref({ issues: [{ number: 1 }], error: null });
        state.reviews = ref([{ path: "docs/reviews/2026.md" }]);
        state.badges = ref({ advisories: 3 });
        const wrapper = await mountSuspended(Layout, { global });
        expect(wrapper.text()).toContain("3");
        expect(wrapper.text()).toContain("1");
        expect(state.execute).not.toHaveBeenCalled();
        expect(wrapper.find("a[aria-label='View source on GitHub']").attributes("target")).toBe("_blank");
        await wrapper.findComponent(Search).vm.$emit("update:open", true);
        expect(state.execute).toHaveBeenCalledOnce();
    });
});
