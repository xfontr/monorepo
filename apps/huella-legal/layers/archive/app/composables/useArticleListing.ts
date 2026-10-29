import type { RouteLocationRaw } from "vue-router";
import type { FilterPill } from "~/components/listing/FilterPills.vue";

type Sort = ListingQuery["sort"];

export const useArticleListing = async (
    scope: Pick<ListingQuery, "category" | "tag" | "author"> = {},
) => {
    const { t } = useI18n();
    const route = useRoute();
    const { link, navigate } = useListingQuery({ page: "1", sort: "newest" });

    const request = useCachedFetch<ArticleListing>("/api/articles", {
        query: computed(() => ({
            ...scope,
            page: route.query.page,
            sort: route.query.sort,
            format: route.query.format,
        })),
    });
    const { data: listing, status } = request;

    const sort = computed<Sort>({
        get: () => (route.query.sort === "oldest" ? "oldest" : "newest"),
        set: (value) => navigate({ sort: value }),
    });

    const pageLink = (page: number): RouteLocationRaw => link({ page: String(page) });

    const archiveTotal = computed<number>(
        () => listing.value?.formats.reduce((sum, { count }) => sum + count, 0) ?? 0,
    );

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

    await useFailOnError(request, { refetches: true });

    return { listing, status, sort, archiveTotal, formatPills, pageLink };
};
