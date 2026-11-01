import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NuxtError } from "#app";
import { defineComponent, ref, type Ref } from "vue";
import { usePage } from "./usePage";

const PAGE: Page = {
    id: "1",
    slug: "aviso-legal",
    title: "Aviso legal",
    body: { lead: "<p>Uno</p>", html: "", toc: [], notes: [], bibliography: [] },
    permalink: "https://revista.test/aviso-legal/",
};

const nuxt = vi.hoisted(() => ({
    url: "",
    page: undefined as unknown as Ref<Page | undefined>,
    error: undefined as unknown as Ref<NuxtError | undefined>,
    seo: {} as Record<string, unknown>,
    signedTitle: undefined as unknown as () => string | undefined,
}));

mockNuxtImport("useCachedFetch", () => (url: string) => {
    nuxt.url = url;

    const result = { data: nuxt.page, error: nuxt.error };

    return Object.assign(Promise.resolve(result), result);
});

mockNuxtImport("useSeoMeta", () => (input: Record<string, unknown>) => {
    nuxt.seo = input;
});

mockNuxtImport("useSeoTitleTemplate", () => (seoTitle: () => string | undefined) => {
    nuxt.signedTitle = seoTitle;
});

const setUp = async (route = "/aviso-legal/") => {
    let failure: unknown;

    await mountSuspended(
        defineComponent({
            setup: async () => {
                try {
                    await usePage();
                } catch (error) {
                    failure = error;
                }

                return () => null;
            },
        }),
        { route },
    );

    return { failure };
};

const seo = (field: string) => (nuxt.seo[field] as () => unknown)();

beforeEach(() => {
    nuxt.url = "";
    nuxt.page = ref(PAGE);
    nuxt.error = ref();
    nuxt.seo = {};
});

describe("usePage", () => {
    it("reads the page named by the route", async () => {
        await setUp();

        expect(nuxt.url).toBe("/api/pages/aviso-legal");
    });

    // Thrown during setup, so server rendering answers with the route's own status
    it("throws a fatal 404 when WordPress has no page by the slug", async () => {
        nuxt.error.value = createError(
            Object.assign(new Error("Not found"), {
                statusCode: 404,
                statusMessage: "Not found",
                response: { status: 404 },
            }),
        );

        expect((await setUp()).failure).toMatchObject({ status: 404, fatal: true });
    });

    it("prefers the CMS's SEO title and description over the page's own", async () => {
        nuxt.page.value = { ...PAGE, seo: { title: "Aviso | Huella", description: "Resumen" } };

        await setUp();

        expect([seo("title"), seo("description")]).toEqual(["Aviso | Huella", "Resumen"]);
    });

    it("tells the title template which title the CMS wrote", async () => {
        nuxt.page.value = { ...PAGE, seo: { title: "Aviso | Huella" } };

        await setUp();

        expect(nuxt.signedTitle()).toBe("Aviso | Huella");
    });

    it("falls back to the title, and indexes the page unless the CMS says noindex", async () => {
        await setUp();

        expect([seo("title"), seo("robots")]).toEqual(["Aviso legal", undefined]);

        nuxt.page.value = { ...PAGE, seo: { noindex: true } };

        expect(seo("robots")).toBe("noindex");
    });
});
