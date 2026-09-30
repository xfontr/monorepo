import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Layout from "./default.vue";

const head = vi.hoisted(() => ({ useHead: vi.fn(), useSeoMeta: vi.fn() }));

mockNuxtImport("useI18n", () => () => ({ t: (key: string) => `t(${key})`, localeProperties: ref({ language: "es" }) }));
mockNuxtImport("useHead", () => head.useHead);
mockNuxtImport("useSeoMeta", () => head.useSeoMeta);

beforeEach(() => {
    vi.clearAllMocks();
});

describe("default layout", () => {
    it("renders the page it wraps", async () => {
        const wrapper = await mountSuspended(Layout, { slots: { default: () => "Article body" } });

        expect(wrapper.text()).toBe("Article body");
    });

    it("tags the document with the active locale, so screen readers pick the right voice", async () => {
        await mountSuspended(Layout);

        const [{ htmlAttrs }] = head.useHead.mock.calls[0] as [{ htmlAttrs: { lang: () => string } }];

        expect(htmlAttrs.lang()).toBe("es");
    });

    it("takes the title and description from translations rather than hard-coded copy", async () => {
        await mountSuspended(Layout);

        expect(head.useSeoMeta).toHaveBeenCalledWith({
            title: "t(app.title)",
            description: "t(app.description)",
            ogTitle: "t(app.title)",
            ogDescription: "t(app.description)",
        });
    });
});
