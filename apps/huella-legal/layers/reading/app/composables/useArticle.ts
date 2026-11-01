export const useArticle = async () => {
    const route = useRoute("article");

    const { data: related } = useCachedFetch<ArticleSummary[]>(
        `/api/articles/${route.params.slug}/related`,
        {
            lazy: true,
            default: () => [],
        },
    );

    const { data: comments } = useArticleComments(route.params.slug);

    const { data: authorCounts } = useCachedFetch("/api/authors", {
        key: "author-counts",
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
        ogType: "article",
        ogImage: () => article.value?.image?.url,
        ogImageAlt: () => article.value?.image?.alt,
        articlePublishedTime: () => article.value?.publishedAt,
        articleModifiedTime: () => article.value?.updatedAt,
        robots: () => (article.value?.seo?.noindex ? "noindex" : undefined),
    });

    useSeoTitleTemplate(() => article.value?.seo?.title);

    await useFailOnError(request);

    return { article, related, authorCounts, comments };
};
