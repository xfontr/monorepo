import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Layout from "./default.vue";

const head = vi.hoisted(() => ({ useHead: vi.fn(), useSeoMeta: vi.fn() }));

mockNuxtImport("useI18n", () => () => ({
    t: (key: string) => `t(${key})`,
    localeProperties: ref({ language: "es" }),
}));
mockNuxtImport("useHead", () => head.useHead);
mockNuxtImport("useSeoMeta", () => head.useSeoMeta);
mockNuxtImport("useSiteNav", () => () => ({
    sections: ref([]),
    columns: ref([]),
    social: ref([]),
    issn: "2696-7618",
}));

const global = {
    mocks: { $t: (key: string) => `t(${key})` },
    stubs: {
        ShellSiteHeader: { template: "<header data-shell='header' />" },
        ShellSiteFooter: { template: "<footer data-shell='footer' />" },
    },
};

const mountLayout = () => mount(Layout, { slots: { default: () => "Article body" }, global });

beforeEach(() => {
    vi.clearAllMocks();
});

describe("default layout", () => {
    it("puts the page inside the one main landmark, between the header and the footer", () => {
        const wrapper = mountLayout();

        const order = wrapper
            .findAll("[data-shell], main")
            .map((node) => node.attributes("data-shell") ?? "main");

        expect(order).toEqual(["header", "main", "footer"]);
        expect(wrapper.findAll("main")).toHaveLength(1);
        expect(wrapper.find("main").text()).toBe("Article body");
    });

    it("starts with a skip link that lands on the main landmark", () => {
        const wrapper = mountLayout();

        const first = wrapper.find("a");

        expect(first.text()).toBe("t(app.skipLink)");
        expect(first.attributes("href")).toBe(`#${wrapper.find("main").attributes("id")}`);
    });

    it("lets the main landmark take focus, so Safari moves the caret when the skip link is used", () => {
        const wrapper = mountLayout();

        expect(wrapper.find("main").attributes("tabindex")).toBe("-1");
    });

    it("tags the document with the active locale, so screen readers pick the right voice", () => {
        mountLayout();

        const [{ htmlAttrs }] = head.useHead.mock.calls[0] as [
            { htmlAttrs: { lang: () => string } },
        ];

        expect(htmlAttrs.lang()).toBe("es");
    });

    it("takes the title and description from translations rather than hard-coded copy", () => {
        mountLayout();

        expect(head.useSeoMeta).toHaveBeenCalledWith({
            title: "t(app.title)",
            description: "t(app.description)",
            ogTitle: "t(app.title)",
            ogDescription: "t(app.description)",
        });
    });
});
