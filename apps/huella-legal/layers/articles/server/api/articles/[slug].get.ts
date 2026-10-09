import type { Article } from "../../../shared/types/Article";
import { toArticle } from "../../mappers/article";

export default defineEventHandler(async (event): Promise<Article> => {
    const {
        public: { site },
    } = useRuntimeConfig(event);

    if (!site.url)
        throw createError({
            statusCode: 500,
            statusMessage: "Site is misconfigured: NUXT_PUBLIC_SITE_URL is not set",
        });

    const entry = await useContent(event).getEntry(
        "posts",
        getRouterParam(event, "slug", { decode: true }) ?? "",
    );

    return toArticle(entry, { siteUrl: site.url, journal: useAppConfig().journal });
});
