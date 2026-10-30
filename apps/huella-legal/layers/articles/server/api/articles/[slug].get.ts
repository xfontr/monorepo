import type { Article } from "../../../shared/types/Article";
import { toArticle } from "../../mappers/article";

defineRouteMeta({
    openAPI: {
        tags: ["Articles"],
        summary: "Read one article with its table of contents and citations",
        responses: {
            200: { description: "OK" },
            404: { description: "No article has this slug" },
        },
    },
});

export default defineEventHandler(async (event): Promise<Article> => {
    const {
        public: { site },
    } = useRuntimeConfig(event);

    const entry = await useContent(event).getEntry(
        "posts",
        getRouterParam(event, "slug", { decode: true }) ?? "",
    );

    return toArticle(entry, { siteUrl: site.url, journal: useAppConfig().journal });
});
