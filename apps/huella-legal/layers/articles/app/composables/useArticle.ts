export async function useArticle() {
    const route = useRoute("article");

    // Not awaited, so a failing list only hides its band instead of failing the article
    const { data: related } = useFetch<ArticleSummary[]>(`/api/articles/${route.params.slug}/related`, {
        lazy: true,
        default: () => [],
    });

    const request = useFetch<Article>(`/api/articles/${route.params.slug}`);
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
        robots: () => article.value?.seo?.noindex ? "noindex" : undefined,
    });

    const { error } = await request;

    if (error.value) throw createPageError(error.value);

    return { article, related };
}
