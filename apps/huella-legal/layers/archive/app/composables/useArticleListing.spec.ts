import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick, reactive, ref, type Ref } from "vue";
import type { LocationQueryRaw } from "vue-router";
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

const routing = vi.hoisted(() => ({
    route: undefined as unknown as { query: Record<string, string> },
    useListingQuery: vi.fn(),
    link: vi.fn((patch: LocationQueryRaw) => ({ query: patch })),
    navigate: vi.fn(),
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
mockNuxtImport("useRoute", () => () => routing.route);
mockNuxtImport("useListingQuery", () => routing.useListingQuery);
mockNuxtImport("showError", () => errors.show);

const listingAt = async (
    query: Record<string, string>,
    scope?: Parameters<typeof useArticleListing>[0],
) => {
    let listing!: Awaited<ReturnType<typeof useArticleListing>>;
    let failure: unknown;

    routing.route = reactive({ query });

    const wrapper = await mountSuspended(
        defineComponent({
            setup: async () => {
                listing = await useArticleListing(scope).catch((error: unknown) => {
                    failure = error;

                    return listing;
                });

                return () => null;
            },
        }),
    );

    if (failure) throw failure;

    return Object.assign(listing, { unmount: () => wrapper.unmount() });
};

beforeEach(() => {
    vi.clearAllMocks();
    routing.useListingQuery.mockReturnValue({ link: routing.link, navigate: routing.navigate });
    fetching.listing = LISTING;
    fetching.error = undefined;
});

describe("useArticleListing", () => {
    it("reads page, sort, format and query from the URL and sends them to the route with the scope", async () => {
        const listing = await listingAt(
            { page: "2", sort: "oldest", format: "comentario", query: "culpa" },
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

    it("builds its links against page one and newest, so the defaults stay out of every address", async () => {
        await listingAt({});

        expect(routing.useListingQuery).toHaveBeenCalledWith({ page: "1", sort: "newest" });
    });

    it("reads an unknown sort as newest and a missing query as blank", async () => {
        const listing = await listingAt({ sort: "sideways" });

        expect(listing.sort.value).toBe("newest");
        expect(listing.search.value).toBe("");
    });

    it("navigates to a new sort", async () => {
        const listing = await listingAt({});

        listing.sort.value = "oldest";

        expect(routing.navigate).toHaveBeenCalledWith({ sort: "oldest" });
    });

    it("navigates to a trimmed query, and drops it when blank", async () => {
        const listing = await listingAt({});

        listing.search.value = "  culpa ";
        listing.search.value = " ";

        expect(routing.navigate.mock.calls).toEqual([[{ query: "culpa" }], [{ query: undefined }]]);
    });

    it("links each page by its number as a string, the way the URL holds it", async () => {
        const listing = await listingAt({});

        expect(listing.pageLink(3)).toEqual({ query: { page: "3" } });
    });

    it("totals every format in the first pill and marks the one the URL selects", async () => {
        const listing = await listingAt({ format: "comentario" });

        expect(listing.archiveTotal.value).toBe(30);
        expect(
            listing.formatPills.value.map(({ count, active, to }) => ({ count, active, to })),
        ).toEqual([
            { count: 30, active: false, to: { query: { format: undefined } } },
            { count: 25, active: false, to: { query: { format: "articulo" } } },
            { count: 5, active: true, to: { query: { format: "comentario" } } },
        ]);
    });

    it("drops the pills when the listing has a single format to choose from", async () => {
        fetching.listing = { ...LISTING, formats: [{ value: "articulo", count: 30 }] };

        const listing = await listingAt({});

        expect(listing.formatPills.value).toEqual([]);
    });

    it("shows the route's 404 when a later page or sort is rejected", async () => {
        await listingAt({});

        fetching.errorRef!.value = { cause: { response: { status: 404 } } };

        await vi.waitFor(() =>
            expect(errors.show).toHaveBeenCalledWith(expect.objectContaining({ status: 404 })),
        );
    });

    it("stops watching for errors once the page is gone", async () => {
        const listing = await listingAt({});

        listing.unmount();
        fetching.errorRef!.value = { cause: { response: { status: 404 } } };
        await nextTick();

        expect(errors.show).not.toHaveBeenCalled();
    });

    it("fails the first render with a 404 when the URL holds a page past the end", async () => {
        fetching.error = { cause: { response: { status: 404 } } };

        await expect(listingAt({ page: "99" })).rejects.toMatchObject({ status: 404 });
    });
});
