import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Page from "./[[id]].vue";

const state = vi.hoisted(() => ({ reviews: null as unknown, route: null as unknown, page: null as unknown }));
mockNuxtImport("useReviewPages", () => () => ({ data: state.reviews }));
mockNuxtImport("useRoute", () => () => state.route);
mockNuxtImport("useAsyncData", () => () => ({ data: state.page }));
const global = { stubs: {
    UDashboardPanel: { template: "<section><slot name='header' /><slot name='body' /></section>" }, UDashboardNavbar: { template: "<header><slot name='right' /></header>" }, UDashboardSidebarCollapse: true, UCard: { template: "<article><slot /></article>" }, UAlert: { props: { title: String }, template: "<div>{{ title }}</div>" }, ContentRenderer: { props: { value: Object }, template: "<div>{{ value?.title }}</div>" }, UButton: { props: { label: String }, template: "<button>{{ label }}</button>" },
} };

beforeEach(() => {
    state.reviews = ref([]);
    state.route = { params: {} };
    state.page = ref(null);
});

describe("reviews page", () => {
    it("shows the empty list when no dated reviews exist", async () => {
        const wrapper = await mountSuspended(Page, { global });
        expect(wrapper.text()).toContain("No review under");
    });

    it("orders review links newest first and reports an unknown selected review", async () => {
        state.reviews = ref([{ path: "/docs/reviews/2026-09-20-b.md" }, { path: "/docs/reviews/2026-09-19-a.md" }]);
        state.route = { params: { id: "missing" } };
        const wrapper = await mountSuspended(Page, { global });
        expect(wrapper.findAll("a").map((link) => link.text())).toEqual(["2026-09-20-b.md", "2026-09-19-a.md"]);
        expect(wrapper.text()).toContain("No such review");
    });

    it("renders the selected review only when its dated id is known", async () => {
        state.reviews = ref([{ path: "/docs/reviews/2026-09-20-b.md" }]);
        state.route = { params: { id: "2026-09-20-b.md" } };
        state.page = ref({ title: "September review" });

        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("September review");
        expect(wrapper.text()).toContain("A review is a dated assessment");
        expect(wrapper.text()).not.toContain("No such review");
    });
});
