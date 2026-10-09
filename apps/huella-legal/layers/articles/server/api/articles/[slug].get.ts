import type { Entry } from "@monorepo/content";
import type { Article } from "../../../shared/types/Article";
import { articleCacheOptions } from "../../cache";
import { toArticle } from "../../mappers/article";
import { fetchContent } from "../../utils/fetchContent";

export default defineCachedEventHandler(async (event): Promise<Article> => {
    const { public: { site } } = useRuntimeConfig(event);

    if (!site.url) throw createError({ statusCode: 500, statusMessage: "Site is misconfigured: NUXT_PUBLIC_SITE_URL is not set" });

    const entry = await fetchContent<Entry>(`/api/content/posts/${getRouterParam(event, "slug")}`);

    return toArticle(entry, { siteUrl: site.url, journal: useAppConfig().journal });
}, articleCacheOptions("article"));
