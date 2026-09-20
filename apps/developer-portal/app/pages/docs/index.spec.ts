import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Page from "./index.vue";

const state = vi.hoisted(() => ({ wiki: null as unknown, docs: null as unknown }));
mockNuxtImport("useWiki", () => () => ({ data: state.wiki }));
mockNuxtImport("useSnapshot", () => () => ({ data: state.docs }));
const global = { stubs: {
    UDashboardPanel: { template: "<section><slot name='header' /><slot name='body' /></section>" }, UDashboardNavbar: { template: "<header><slot name='right' /></header>" }, UDashboardSidebarCollapse: true, WikiNav: { props: { sections: Array }, template: "<nav>{{ sections?.length }}</nav>" },
    UCard: { template: "<article><slot name='header' /><slot /></article>" }, UAlert: { props: { title: String }, template: "<div>{{ title }}<slot name='description' /></div>" }, UIcon: true, UKbd: true,
} };
beforeEach(() => {
    state.wiki = ref([]);
    state.docs = ref({ docs: { pages: [], brokenLinkCount: 0 } });
});

describe("docs index page", () => {
    it("renders the wiki sections and routes curated links through /docs", async () => {
        state.wiki = ref([{ id: "workspace", groups: [{ entries: [{ path: "/readme", label: "The repo", kind: "readme" }] }] }]);
        const wrapper = await mountSuspended(Page, { global });
        expect(wrapper.find("a[href='/docs/readme']").exists()).toBe(true);
        expect(wrapper.find("nav").text()).toContain("1");
    });

    it("keeps an empty collected wiki visibly empty", async () => {
        const wrapper = await mountSuspended(Page, { global });
        expect(wrapper.text()).toContain("Nothing collected yet");
    });
});
