import { fakeAsset, fakeAuthor } from "@monorepo/content/testing";
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NuxtError } from "#app";
import { defineComponent, ref, type Ref } from "vue";
import type { Article } from "../../shared/types/Article";
import { useArticle } from "./useArticle";

const ARTICLE: Article = {
    id: "1",
    slug: "la-culpa",
    title: "La culpa",
    excerpt: "El deber de cuidado.",
    publishedAt: "2024-03-12T09:00:00Z",
    image: fakeAsset(),
    authors: [fakeAuthor()],
    category: { id: "2", slug: "derecho-penal", name: "Derecho penal" },
    tags: [
        { id: "3", slug: "dolo", name: "Dolo" },
        { id: "4", slug: "imprudencia", name: "Imprudencia" },
    ],
    format: "ensayo",
    readingMinutes: 12,
    body: { lead: "", html: "", toc: [], notes: [], bibliography: [] },
    permalink: "https://revista.test/la-culpa/",
    citations: [],
};

const nuxt = vi.hoisted(() => ({
    fetches: new Map<string, Record<string, unknown> | undefined>(),
    article: undefined as unknown as Ref<Article | undefined>,
    error: undefined as unknown as Ref<NuxtError | undefined>,
    seo: {} as Record<string, unknown>,
}));

mockNuxtImport("useFetch", () => (url: string, options?: Record<string, unknown>) => {
    nuxt.fetches.set(url, options);

    if (url.endsWith("/related")) return { data: ref([]), error: ref(new Error("related failed")) };

    const result = { data: nuxt.article, error: nuxt.error };

    return Object.assign(Promise.resolve(result), result);
});

mockNuxtImport("useSeoMeta", () => (input: Record<string, unknown>) => {
    nuxt.seo = input;
});

async function setUp(route = "/la-culpa/") {
    let controller: Awaited<ReturnType<typeof useArticle>> | undefined;
    let failure: unknown;

    await mountSuspended(
        defineComponent({
            async setup() {
                try {
                    controller = await useArticle();
                } catch (error) {
                    failure = error;
                }

                return () => null;
            },
        }),
        { route },
    );

    return { controller, failure };
}

const seo = (field: string) => (nuxt.seo[field] as () => unknown)();

beforeEach(() => {
    nuxt.fetches.clear();
    nuxt.article = ref(ARTICLE);
    nuxt.error = ref();
    nuxt.seo = {};
});

describe("useArticle", () => {
    it("reads the article named by the route, and its related posts", async () => {
        await setUp("/la-culpa/");

        expect([...nuxt.fetches.keys()].sort()).toEqual([
            "/api/articles/la-culpa",
            "/api/articles/la-culpa/related",
        ]);
    });

    // Rendered on the server, so crawlers follow the links and the band never shifts the page in
    it("server-renders the related posts without blocking navigation on them", async () => {
        await setUp();

        expect(nuxt.fetches.get("/api/articles/la-culpa/related")).toMatchObject({ lazy: true });
        expect(nuxt.fetches.get("/api/articles/la-culpa/related")).not.toHaveProperty("server");
    });

    it("still serves the article when the related list fails", async () => {
        expect((await setUp()).failure).toBeUndefined();
    });

    // Thrown during setup, so server rendering answers with the route's own status
    it("throws a fatal 404 when the post doesn't exist", async () => {
        nuxt.error.value = createError(
            Object.assign(new Error("Not found"), {
                statusCode: 404,
                statusMessage: "Not found",
                response: { status: 404 },
            }),
        );

        expect((await setUp()).failure).toMatchObject({ status: 404, fatal: true });
    });

    describe("SEO", () => {
        it("prefers the CMS's SEO title and description over the article's own", async () => {
            nuxt.article.value = {
                ...ARTICLE,
                seo: { title: "La culpa | Huella", description: "Resumen SEO" },
            };

            await setUp();

            expect([
                seo("title"),
                seo("ogTitle"),
                seo("description"),
                seo("ogDescription"),
            ]).toEqual(["La culpa | Huella", "La culpa | Huella", "Resumen SEO", "Resumen SEO"]);
        });

        it("falls back to the title and excerpt, and points og:url at the permalink", async () => {
            await setUp();

            expect([seo("title"), seo("description"), seo("ogUrl")]).toEqual([
                "La culpa",
                "El deber de cuidado.",
                "https://revista.test/la-culpa/",
            ]);
            expect(seo("robots")).toBeUndefined();
        });

        it("keeps a post the CMS marks noindex out of search", async () => {
            nuxt.article.value = { ...ARTICLE, seo: { noindex: true } };

            await setUp();

            expect(seo("robots")).toBe("noindex");
        });
    });
});
