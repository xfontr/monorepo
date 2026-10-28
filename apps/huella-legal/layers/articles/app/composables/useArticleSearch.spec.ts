import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, ref, type Ref } from "vue";
import { useRouter, type RouteLocationRaw, type Router } from "vue-router";
import type { ArticleSearch } from "../../shared/types/ArticleSearch";
import { useArticleSearch } from "./useArticleSearch";

const SEARCH: ArticleSearch = {
    items: [],
    page: 1,
    perPage: 20,
    total: 30,
    totalPages: 2,
    query: "culpa",
    subjects: [],
};

const fetching = vi.hoisted(() => ({
    query: undefined as Ref<Record<string, unknown>> | undefined,
    enabled: undefined as (() => boolean) | undefined,
    error: undefined as { cause: { response: { status: number } } } | undefined,
    errorRef: undefined as Ref<{ cause: { response: { status: number } } } | undefined> | undefined,
}));

const errors = vi.hoisted(() => ({ show: vi.fn() }));

mockNuxtImport(
    "useCachedFetch",
    () =>
        (
            _url: string,
            options: { query: Ref<Record<string, unknown>>; enabled: () => boolean },
        ) => {
            fetching.query = options.query;
            fetching.enabled = options.enabled;
            fetching.errorRef = ref(fetching.error);

            const result = { data: ref(SEARCH), error: fetching.errorRef, status: ref("success") };

            return Object.assign(Promise.resolve(result), result);
        },
);
mockNuxtImport("showError", () => errors.show);

const searchAt = async (route: string) => {
    let search!: Awaited<ReturnType<typeof useArticleSearch>>;
    let router!: Router;
    let failure: unknown;

    await mountSuspended(
        defineComponent({
            setup: async () => {
                // Before the await, which ends the component's injection context
                router = useRouter();
                search = await useArticleSearch().catch((error: unknown) => {
                    failure = error;

                    return search;
                });

                return () => null;
            },
        }),
        { route },
    );

    if (failure) throw failure;

    return Object.assign(search, {
        router,
        href: (to: RouteLocationRaw) => router.resolve(to).href,
    });
};

// Navigating there imports the page's whole graph, which is slow cold
beforeAll(() => import("../pages/search.vue"));

beforeEach(() => {
    vi.clearAllMocks();
    fetching.error = undefined;
});

describe("useArticleSearch", () => {
    it("sends the trimmed query and the page from the URL to the route", async () => {
        await searchAt("/buscar/?query=%20culpa%20&page=2");

        expect(fetching.query?.value).toEqual({ query: "culpa", page: "2" });
        expect(fetching.enabled?.()).toBe(true);
    });

    it.each(["/buscar/", "/buscar/?query=%20%20", "/buscar/?query=a&query=b"])(
        "treats %s as the empty state and never asks the route",
        async (route) => {
            const search = await searchAt(route);

            expect(fetching.enabled?.()).toBe(false);
            expect(search.term.value).toBe("");
        },
    );

    it("keeps the query in every page link and leaves page one out of it", async () => {
        const search = await searchAt("/buscar/?query=culpa&page=2");

        expect(search.href(search.pageLink(1))).toBe("/buscar/?query=culpa");
        expect(search.href(search.pageLink(3))).toBe("/buscar/?query=culpa&page=3");
    });

    it("starts a new query from its first page, and clears the URL for a blank one", async () => {
        const search = await searchAt("/buscar/?query=culpa&page=2");
        const { router } = search;

        search.term.value = "  dolo ";
        await vi.waitFor(() =>
            expect(router.currentRoute.value.fullPath).toBe("/buscar/?query=dolo"),
        );

        search.term.value = " ";
        await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe("/buscar/"));
    });

    it("shows the route's 404 when a later page is rejected", async () => {
        await searchAt("/buscar/?query=culpa");

        fetching.errorRef!.value = { cause: { response: { status: 404 } } };

        await vi.waitFor(() =>
            expect(errors.show).toHaveBeenCalledWith(expect.objectContaining({ status: 404 })),
        );
    });

    it("fails the first render with a 404 when the URL holds a page past the end", async () => {
        fetching.error = { cause: { response: { status: 404 } } };

        await expect(searchAt("/buscar/?query=culpa&page=99")).rejects.toMatchObject({
            status: 404,
        });
    });
});
