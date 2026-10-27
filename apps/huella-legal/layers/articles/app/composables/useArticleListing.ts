import type { LocationQueryRaw, RouteLocationRaw } from "vue-router";
import type { FilterPill } from "~/components/listing/FilterPills.vue";
import { FORMAT_KEYS } from "#layers/articles/app/constants";

type Sort = ListingQuery["sort"];

export const useArticleListing = async (
    scope: Pick<ListingQuery, "category" | "tag" | "author"> = {},
) => {
    const { t } = useI18n();
    const route = useRoute();
    const router = useRouter();

    // Passed through raw: the route answers any value it can't serve with a 404
    const query = computed(() => ({
        ...scope,
        page: route.query.page,
        sort: route.query.sort,
        format: route.query.format,
    }));

    const request = useCachedFetch<ArticleListing>("/api/articles", { query });

    // Watched as well: a new page or sort only changes the query, so setup never runs a second time
    watch(request.error, (value) => value && showError(createPageError(value)));

    const { data: listing, error, status } = await request;

    if (error.value) throw createPageError(error.value);

    // Page one, newest first and no format are the defaults, so they never appear in the URL and each
    // listing keeps a single canonical address
    const link = (patch: LocationQueryRaw): RouteLocationRaw => ({
        query: { ...route.query, page: undefined, ...patch },
    });

    const sort = computed<Sort>({
        get: () => (route.query.sort === "oldest" ? "oldest" : "newest"),
        set: (value) => router.push(link({ sort: value === "oldest" ? value : undefined })),
    });

    const pageLink = (target: number): RouteLocationRaw =>
        link({ page: target > 1 ? String(target) : undefined });

    const archiveTotal = computed<number>(
        () => listing.value?.formats.reduce((sum, { count }) => sum + count, 0) ?? 0,
    );

    // A pill with nothing behind it is noise, and one format alone needs no pills at all
    const formatPills = computed<FilterPill[]>(() => {
        const formats = listing.value?.formats ?? [];

        if (formats.length < 2) return [];

        return [
            {
                label: t("articleListing.formats.all"),
                count: archiveTotal.value,
                to: link({ format: undefined }),
                active: !route.query.format,
            },
            ...formats.map(({ value, count }) => ({
                label: t(`articleListing.formats.${FORMAT_KEYS[value]}`),
                count,
                to: link({ format: value }),
                active: route.query.format === value,
            })),
        ];
    });

    return { listing, status, sort, archiveTotal, formatPills, pageLink };
};
