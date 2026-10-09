export async function useArticle() {
    const route = useRoute("article");

    const { data: related } = useFetch<ArticleSummary[]>(`/api/articles/${route.params.slug}/related`, {
        lazy: true,
        server: false,
        default: () => [],
    });

    const { data: article, error } = await useFetch<Article>(`/api/articles/${route.params.slug}`);

    if (error.value) throw createPageError(error.value);

    return { article, related };
}
