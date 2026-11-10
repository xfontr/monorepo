import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Layout from "./default.vue";

const head = vi.hoisted(() => ({
    useHead: vi.fn(),
    useSeoMeta: vi.fn(),
}));

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
}));
mockNuxtImport("useCookiePreferences", () => () => ({ enabled: false, open: vi.fn() }));

const global = {
    mocks: { $t: (key: string) => `t(${key})` },
    stubs: {
        ShellSiteHeader: {
            props: ["issn"],
            template: "<header data-shell='header' :data-issn='issn' />",
        },
        ShellSiteFooter: {
            props: ["issn"],
            template: "<footer data-shell='footer' :data-issn='issn' />",
        },
    },
};

const mountLayout = () => mount(Layout, { slots: { default: () => "Article body" }, global });

beforeEach(() => {
    vi.clearAllMocks();
});

describe("default layout", () => {
    it("puts the page inside the one main landmark, between the header and the footer", async () => {
        const wrapper = mountLayout();
        await vi.dynamicImportSettled();

        const order = wrapper
            .findAll("[data-shell], main")
            .map((node) => node.attributes("data-shell") ?? "main");

        expect(order).toEqual(["header", "main", "footer"]);
        expect(wrapper.findAll("main")).toHaveLength(1);
        expect(wrapper.find("main").text()).toBe("Article body");
    });

    it("hands the header and the footer the same ISSN, the journal's own", async () => {
        const wrapper = mountLayout();
        await vi.dynamicImportSettled();

        const printed = wrapper.findAll("[data-shell]").map((node) => node.attributes("data-issn"));

        expect(printed).toEqual(["2696-7618", "2696-7618"]);
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
            ogImage: "https://www.huellalegal.com/og-image.png",
            ogImageWidth: 1200,
            ogImageHeight: 630,
        });
    });

    it("points feed readers at the RSS feed from every page", () => {
        mountLayout();

        const [{ link }] = head.useHead.mock.calls[0] as [{ link: object[] }];

        expect(link).toContainEqual(
            expect.objectContaining({
                rel: "alternate",
                type: "application/rss+xml",
                title: "Huella Legal",
                href: "https://www.huellalegal.com/feed/",
            }),
        );
    });
});
