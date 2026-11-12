import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Layout from "./default.vue";

const state = vi.hoisted(() => ({
    issues: null as unknown,
    badges: null as unknown,
    menus: {} as Record<string, unknown>,
    sections: null as unknown,
    execute: vi.fn(),
}));
mockNuxtImport("useIssues", () => () => ({ data: state.issues }));
mockNuxtImport("useFetch", () => (url: string) => ({
    data: url === "/api/badges" ? state.badges : ref(state.menus[url] ?? []),
}));
mockNuxtImport("useAsyncData", () => () => ({
    data: state.sections,
    status: ref("idle"),
    execute: state.execute,
}));

const Search = {
    name: "UDashboardSearch",
    props: { groups: Array },
    emits: ["update:open"],
    template:
        "<div class='search'><a v-for='item in groups?.[0]?.items' :href='item.to'>{{ item.label }}</a></div>",
};
const global = {
    stubs: {
        UDashboardGroup: { template: "<main><slot /></main>" },
        UDashboardSidebar: {
            template:
                "<aside><slot name='default' :collapsed='false' /><slot name='footer' :collapsed='false' /></aside>",
        },
        UDashboardSearchButton: { template: "<button aria-label='search'>search</button>" },
        UNavigationMenu: {
            props: { items: Array },
            template:
                "<nav><template v-for='item in items'><a :href='item.to'>{{ item.label }} {{ item.badge }}</a><a v-for='child in item.children' class='child' :href='child.to'>{{ child.label }}</a></template></nav>",
        },
        UDashboardSearch: Search,
        NuxtLink: { props: { to: String }, template: "<a :href='to'><slot /></a>" },
        UIcon: true,
        UColorModeButton: true,
        UButton: {
            inheritAttrs: false,
            props: { to: String },
            template: "<a :href='to' v-bind='$attrs'><slot /></a>",
        },
    },
};

beforeEach(() => {
    state.issues = ref({ issues: [], error: null });
    state.badges = ref({ advisories: 0 });
    state.menus = {};
    state.sections = ref([]);
    state.execute.mockClear();
});

describe("default layout", () => {
    it("groups navigation by purpose and points renamed entries to their routes", async () => {
        const wrapper = await mountSuspended(Layout, { global });
        expect(wrapper.text()).toContain("Overview");
        expect(wrapper.text()).toContain("Dependencies");
        expect(wrapper.text()).toContain("Explore");
        expect(wrapper.text()).toContain("Build");
        expect(wrapper.text()).toContain("Engineering health");
        expect(wrapper.text()).not.toContain("undefined");
        expect(
            wrapper.findAll("nav a").map((link) => [link.text().trim(), link.attributes("href")]),
        ).toEqual([
            ["Overview", "/"],
            ["Projects", "/projects"],
            ["What's new", "/changelog"],
            ["Documentation", "/docs"],
            ["Architecture", "/graph"],
            ["Decisions", "/decisions"],
            ["Audits", "/audits"],
            ["Workflows", "/workflows"],
            ["Work in progress", "/issues"],
            ["Coverage", "/coverage"],
            ["Tooling usage", "/telemetry"],
            ["Dependencies", "/deps"],
        ]);
    });

    it("unfolds an entry into the rows its menu route answers, and leaves an empty one a plain link", async () => {
        state.menus = {
            "/api/decisions/menu": [{ label: "0036 Drop the UI kit", to: "/decisions/0036-ui" }],
        };
        const wrapper = await mountSuspended(Layout, { global });
        expect(
            wrapper.findAll("nav a.child").map((link) => [link.text(), link.attributes("href")]),
        ).toEqual([["0036 Drop the UI kit", "/decisions/0036-ui"]]);
    });

    it("renders non-zero badges, uses the repository source link, and defers search data", async () => {
        state.issues = ref({ issues: [{ number: 1 }], error: null });
        state.badges = ref({ advisories: 3 });
        const wrapper = await mountSuspended(Layout, { global });
        expect(wrapper.text()).toContain("3");
        expect(wrapper.text()).toContain("1");
        expect(state.execute).not.toHaveBeenCalled();
        expect(wrapper.find("a[aria-label='View source on GitHub']").attributes("target")).toBe(
            "_blank",
        );
        await wrapper.findComponent(Search).vm.$emit("update:open", true);
        expect(state.execute).toHaveBeenCalledOnce();
    });
});
