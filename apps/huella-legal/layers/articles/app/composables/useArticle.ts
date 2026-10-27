export const useArticle = async () => {
    const route = useRoute("article");

    // Not awaited, so a failing list only hides its band instead of failing the article
    const { data: related } = useCachedFetch<ArticleSummary[]>(
        `/api/articles/${route.params.slug}/related`,
        {
            lazy: true,
            default: () => [],
        },
    );

    // Keyed apart from the directory's read of the same route, which keeps the whole list
    const { data: authorCounts } = useCachedFetch("/api/authors", {
        key: "author-counts",
        // A cold index fill would otherwise hold back every article's server render
        server: false,
        lazy: true,
        default: () => ({}),
        transform: (authors): Record<string, number> =>
            Object.fromEntries(authors.map(({ value, count }) => [value.id, count])),
    });

    const request = useCachedFetch<Article>(`/api/articles/${route.params.slug}`);
    const { data: article } = request;

    useSeoMeta({
        title: () => article.value?.seo?.title ?? article.value?.title,
        description: () => article.value?.seo?.description ?? article.value?.excerpt,
        ogTitle: () => article.value?.seo?.title ?? article.value?.title,
        ogDescription: () => article.value?.seo?.description ?? article.value?.excerpt,
        ogType: "article",
        ogUrl: () => article.value?.permalink,
        ogImage: () => article.value?.image?.url,
        ogImageAlt: () => article.value?.image?.alt,
        articlePublishedTime: () => article.value?.publishedAt,
        articleModifiedTime: () => article.value?.updatedAt,
        robots: () => (article.value?.seo?.noindex ? "noindex" : undefined),
    });

    const { error } = await request;

    if (error.value) throw createPageError(error.value);

    return { article, related, authorCounts };
};
