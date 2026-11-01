import { Feed } from "feed";
import { toPermalink } from "../mappers/page";
import { getArticleIndex } from "../services/articleIndex";

const FEED_LENGTH = 20;

defineRouteMeta({
    openAPI: {
        tags: ["SEO"],
        summary: "The newest articles as an RSS 2.0 feed",
    },
});

export default defineEventHandler(async (event): Promise<string> => {
    const {
        public: { site },
    } = useRuntimeConfig(event);
    const { journal } = useAppConfig();

    const feed = new Feed({
        title: journal.name,
        link: toPermalink("", site.url),
        language: "es",
        feedLinks: { rss: new URL("/feed/", site.url).href },
        generator: false,
    });

    const articles = (await getArticleIndex(event))
        .filter(({ noindex, publishedAt }) => !noindex && publishedAt)
        .slice(0, FEED_LENGTH);

    for (const { slug, title, excerpt, publishedAt, authors, category } of articles) {
        feed.addItem({
            title,
            link: toPermalink(slug, site.url),
            date: new Date(publishedAt!),
            description: excerpt,
            author: authors.map(({ name }) => ({ name })),
            category: category ? [{ name: category.name }] : undefined,
        });
    }

    setResponseHeader(event, "content-type", "application/rss+xml; charset=utf-8");

    return feed.rss2();
});
