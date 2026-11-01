import { getArticleIndex } from "../../services/articleIndex";
import { getCategories } from "../../services/categories";

defineRouteMeta({
    openAPI: {
        tags: ["SEO"],
        summary: "The content URLs the sitemap lists beside the app's own pages",
    },
});

export default defineSitemapEventHandler(async (event) => {
    const {
        public: { pageSlugs },
    } = useRuntimeConfig(event);

    const content = useContent(event);
    const [articles, categories, pageReads] = await Promise.all([
        getArticleIndex(event),
        getCategories(event),
        Promise.allSettled(pageSlugs.map((slug) => content.getEntry("pages", slug))),
    ]);

    const pages = pageReads.flatMap((read) => (read.status === "fulfilled" ? [read.value] : []));

    const authorSlugs = new Set(articles.flatMap(({ authors }) => authors.map(({ slug }) => slug)));

    return [
        ...articles
            .filter(({ noindex }) => !noindex)
            .map(({ slug, updatedAt, publishedAt }) => ({
                loc: `/${slug}/`,
                lastmod: updatedAt ?? publishedAt,
            })),
        ...pages
            .filter(({ seo }) => !seo?.noindex)
            .map(({ slug, updatedAt }) => ({ loc: `/${slug}/`, lastmod: updatedAt })),
        // Yoast marked these archives noindex for WordPress's theme; the app's áreas are indexed
        ...categories.map(({ slug }) => ({ loc: `/areas/${slug}/` })),
        ...[...authorSlugs].map((slug) => ({ loc: `/colaboradores/${slug}/` })),
    ];
});
