import type { RouteLocationRaw } from "vue-router";

export const useArticleSearch = async () => {
    const route = useRoute();
    const { link, navigate } = useListingQuery({ page: "1", query: "" });

    const term = computed<string>({
        get: () => (typeof route.query.query === "string" ? route.query.query.trim() : ""),
        set: (value) => navigate({ query: value.trim() }),
    });

    const request = useCachedFetch<ArticleSearch>("/api/search", {
        query: computed(() => ({ query: term.value, page: route.query.page })),
        enabled: () => term.value !== "",
    });
    const { data: search, status } = request;

    const pageLink = (page: number): RouteLocationRaw =>
        link({ query: term.value, page: String(page) });

    await useFailOnError(request, { refetches: true });

    return { search, term, status, pageLink };
};
