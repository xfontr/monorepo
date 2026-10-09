import type { BreadcrumbItem } from "@nuxt/ui";

const FORMAT_KEYS = {
    "articulo": "article.formats.article",
    "comentario": "article.formats.comment",
    "ensayo": "article.formats.essay",
    "tfg-tfm": "article.formats.thesis",
} as const satisfies Record<ArticleSummary["format"], string>;

export async function useArticle() {
    const route = useRoute("article");
    const { t } = useI18n();

    // Not awaited, so a failing list only hides its band instead of failing the article
    const { data: related } = useFetch<ArticleSummary[]>(`/api/articles/${route.params.slug}/related`, {
        lazy: true,
        default: () => [],
    });

    const request = useFetch<Article>(`/api/articles/${route.params.slug}`);
    const { data: article } = request;

    const breadcrumb = computed<BreadcrumbItem[]>(() => {
        const category = article.value?.category;
        const items: BreadcrumbItem[] = [
            { label: t("article.breadcrumb.home"), to: { name: "index" } },
            { label: t("article.breadcrumb.publications"), to: { name: "publications" } },
        ];

        return category ? [...items, { label: category.name, to: { name: "category", params: { slug: category.slug } } }] : items;
    });

    const formatLabel = computed(() => article.value && t(FORMAT_KEYS[article.value.format]));

    const tagNames = computed(() => article.value?.tags.map(({ name }) => name).join(" · "));

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

    // Every composable above runs before this await, which a custom composable's context doesn't survive
    const { error } = await request;

    if (error.value) throw createPageError(error.value);

    return { article, related, breadcrumb, formatLabel, tagNames };
}
