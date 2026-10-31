import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick, ref, type Ref } from "vue";
import { useRouter, type RouteLocationRaw, type Router } from "vue-router";
import { useArticleListing } from "./useArticleListing";

const LISTING: ArticleListing = {
    items: [],
    page: 1,
    perPage: 20,
    total: 30,
    totalPages: 2,
    formats: [
        { value: "articulo", count: 25 },
        { value: "comentario", count: 5 },
    ],
    subjects: [],
};

const fetching = vi.hoisted(() => ({
    listing: undefined as ArticleListing | undefined,
    query: undefined as Ref<Record<string, unknown>> | undefined,
    error: undefined as { cause: { response: { status: number } } } | undefined,
    errorRef: undefined as Ref<{ cause: { response: { status: number } } } | undefined> | undefined,
}));

const errors = vi.hoisted(() => ({ show: vi.fn() }));

mockNuxtImport(
    "useCachedFetch",
    () => (_url: string, options: { query: Ref<Record<string, unknown>> }) => {
        fetching.query = options.query;
        fetching.errorRef = ref(fetching.error);

        const result = {
            data: ref(fetching.listing),
            error: fetching.errorRef,
            status: ref("success"),
        };

        return Object.assign(Promise.resolve(result), result);
    },
);
mockNuxtImport("showError", () => errors.show);

const listingAt = async (route: string, scope?: Parameters<typeof useArticleListing>[0]) => {
    let listing!: Awaited<ReturnType<typeof useArticleListing>>;
    let router!: Router;
    let failure: unknown;

    const wrapper = await mountSuspended(
        defineComponent({
            setup: async () => {
                // Before the await, which ends the component's injection context
                router = useRouter();
                listing = await useArticleListing(scope).catch((error: unknown) => {
                    failure = error;

                    return listing;
                });

                return () => null;
            },
        }),
        { route },
    );

    if (failure) throw failure;

    return Object.assign(listing, {
        router,
        unmount: () => wrapper.unmount(),
        href: (to: RouteLocationRaw) => router.resolve(to).href,
    });
};

// Navigating there imports the page's whole graph, ~2 s cold locally and past 5 s on CI
beforeAll(() => import("../pages/articles/index.vue"));

beforeEach(() => {
    vi.clearAllMocks();
    fetching.listing = LISTING;
    fetching.error = undefined;
});

describe("useArticleListing", () => {
    it("reads page, sort, format and query from the URL and sends them to the route with the scope", async () => {
        const listing = await listingAt(
            "/publicaciones/?page=2&sort=oldest&format=comentario&query=culpa",
            { category: "derecho-civil" },
        );

        expect(fetching.query?.value).toEqual({
            category: "derecho-civil",
            page: "2",
            sort: "oldest",
            format: "comentario",
            query: "culpa",
        });
        expect(listing.sort.value).toBe("oldest");
        expect(listing.search.value).toBe("culpa");
    });

    it("keeps the query while paging or switching format, so neither drops the search", async () => {
        const listing = await listingAt("/publicaciones/?query=culpa&page=2");

        expect(listing.href(listing.pageLink(3))).toBe("/publicaciones/?query=culpa&page=3");
        expect(listing.formatPills.value.map(({ to }) => listing.href(to))).toEqual([
            "/publicaciones/?query=culpa",
            "/publicaciones/?query=culpa&format=articulo",
            "/publicaciones/?query=culpa&format=comentario",
        ]);
    });

    it("writes a new query back to the URL from page one, dropping it again when blank", async () => {
        const listing = await listingAt("/publicaciones/?page=2&format=comentario");
        const { router } = listing;

        listing.search.value = "  culpa ";
        await vi.waitFor(() =>
            expect(router.currentRoute.value.fullPath).toBe(
                "/publicaciones/?format=comentario&query=culpa",
            ),
        );

        listing.search.value = " ";
        await vi.waitFor(() =>
            expect(router.currentRoute.value.fullPath).toBe("/publicaciones/?format=comentario"),
        );
    });

    it("leaves the defaults out of every link, so each listing keeps one canonical address", async () => {
        const listing = await listingAt("/publicaciones/?page=2");

        expect(listing.href(listing.pageLink(1))).toBe("/publicaciones/");
        expect(listing.href(listing.pageLink(3))).toBe("/publicaciones/?page=3");
        expect(listing.formatPills.value.map(({ to }) => listing.href(to))).toEqual([
            "/publicaciones/",
            "/publicaciones/?format=articulo",
            "/publicaciones/?format=comentario",
        ]);
    });

    it("keeps sort and format while paging, but restarts at page one when either changes", async () => {
        const listing = await listingAt("/publicaciones/?page=2&sort=oldest&format=comentario");

        expect(listing.href(listing.pageLink(3))).toBe(
            "/publicaciones/?page=3&sort=oldest&format=comentario",
        );
        expect(listing.href(listing.formatPills.value[0]!.to)).toBe("/publicaciones/?sort=oldest");
    });

    it("writes a new sort back to the URL, dropping it again for the default", async () => {
        const listing = await listingAt("/publicaciones/?page=2");
        const { router } = listing;

        listing.sort.value = "oldest";
        await vi.waitFor(() =>
            expect(router.currentRoute.value.fullPath).toBe("/publicaciones/?sort=oldest"),
        );

        listing.sort.value = "newest";
        await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe("/publicaciones/"));
    });

    it("totals every format in the first pill and marks the one the URL selects", async () => {
        const listing = await listingAt("/publicaciones/?format=comentario");

        expect(listing.archiveTotal.value).toBe(30);
        expect(listing.formatPills.value.map(({ count, active }) => [count, active])).toEqual([
            [30, false],
            [25, false],
            [5, true],
        ]);
    });

    it("drops the pills when the listing has a single format to choose from", async () => {
        fetching.listing = { ...LISTING, formats: [{ value: "articulo", count: 30 }] };

        const listing = await listingAt("/publicaciones/");

        expect(listing.formatPills.value).toEqual([]);
    });

    it("shows the route's 404 when a later page or sort is rejected", async () => {
        await listingAt("/publicaciones/");

        fetching.errorRef!.value = { cause: { response: { status: 404 } } };

        await vi.waitFor(() =>
            expect(errors.show).toHaveBeenCalledWith(expect.objectContaining({ status: 404 })),
        );
    });

    it("stops watching for errors once the page is gone", async () => {
        const listing = await listingAt("/publicaciones/");

        listing.unmount();
        fetching.errorRef!.value = { cause: { response: { status: 404 } } };
        await nextTick();

        expect(errors.show).not.toHaveBeenCalled();
    });

    it("fails the first render with a 404 when the URL holds a page past the end", async () => {
        fetching.error = { cause: { response: { status: 404 } } };

        await expect(listingAt("/publicaciones/?page=99")).rejects.toMatchObject({
            status: 404,
        });
    });
});
