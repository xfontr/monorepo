import type { Ref } from "vue";

/** The `citation_*` tags and the `ScholarlyArticle` graph, from an article that has loaded. */
export const useScholarlyMeta = (article: Ref<Article | undefined>) => {
    const { journal } = useAppConfig();

    useHead({
        meta: () =>
            article.value
                ? toCitationMeta(article.value, journal).map((tag, index) => ({
                      ...tag,
                      key: `citation-${index}`,
                      "data-hid": `citation-${index}`,
                  }))
                : [],
    });

    useSchemaOrg(
        computed(() => {
            if (!article.value) return [];

            const { title, excerpt, image, publishedAt, updatedAt, authors, permalink } =
                article.value;
            const periodical = new URL("/#periodical", permalink).href;

            return [
                { "@type": "Periodical", "@id": periodical, ...journal },
                defineArticle({
                    "@type": "ScholarlyArticle",
                    headline: title,
                    description: excerpt,
                    image: image?.url,
                    datePublished: publishedAt,
                    dateModified: updatedAt,
                    isPartOf: { "@id": periodical },
                    author: authors.map(({ name, slug }) =>
                        definePerson({
                            name,
                            url: new URL(`/colaboradores/${slug}/`, permalink).href,
                        }),
                    ),
                }),
            ];
        }),
    );
};
