import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref, type Ref } from "vue";
import PageView from "./View.vue";

const PAGE: Page = {
    id: "1",
    slug: "aviso-legal",
    title: "Aviso legal",
    body: {
        lead: "<p>Primero.</p>",
        html: '<h2 id="privacidad">Privacidad</h2><p>Segundo.</p>',
        toc: [{ id: "privacidad", label: "Privacidad", level: 2 }],
        notes: [],
        bibliography: [],
    },
    permalink: "https://revista.test/aviso-legal/",
};

const nuxt = vi.hoisted(() => ({
    page: undefined as unknown as Ref<Page | undefined>,
}));

mockNuxtImport("usePage", () => async () => ({ page: nuxt.page }));

beforeEach(() => {
    nuxt.page = ref(PAGE);
});

describe("page view", () => {
    it("titles the page and renders its body as the mapper's HTML", async () => {
        const wrapper = await mountSuspended(PageView);

        expect(wrapper.find("h1").text()).toBe("Aviso legal");
        expect(wrapper.find("h2#privacidad").exists()).toBe(true);
        expect(wrapper.text()).toContain("Primero.");
    });

    it("leads the breadcrumb home and ends it on the page itself", async () => {
        const wrapper = await mountSuspended(PageView);

        const crumbs = wrapper.find("nav");

        expect(crumbs.find("a").attributes("href")).toBe("/");
        expect(crumbs.text()).toContain("Aviso legal");
    });

    it("names the TOC for a page, not for an article", async () => {
        const wrapper = await mountSuspended(PageView);

        expect(wrapper.findAll("nav").map((nav) => nav.attributes("aria-label"))).toContain(
            "page.toc",
        );
    });

    it("keeps the page's footnotes and references below the text", async () => {
        nuxt.page = ref({
            ...PAGE,
            body: {
                ...PAGE.body,
                notes: [{ id: "1", html: "Una nota" }],
                bibliography: ["Una ley"],
            },
        });

        const wrapper = await mountSuspended(PageView);

        expect(wrapper.text()).toContain("Una nota");
        expect(wrapper.text()).toContain("Una ley");
    });

    it("renders nothing rather than an empty article while there is no page", async () => {
        nuxt.page = ref();

        const wrapper = await mountSuspended(PageView);

        expect(wrapper.find("article").exists()).toBe(false);
    });
});
