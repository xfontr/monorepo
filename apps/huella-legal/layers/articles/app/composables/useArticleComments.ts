/** An article's comments, read in the browser so a prerendered article never shows a stale thread. */
export const useArticleComments = (slug: string) =>
    useCachedFetch<ArticleComments>(`/api/articles/${slug}/comments`, {
        key: `article-comments-${slug}`,
        server: false,
        lazy: true,
    });
