import type { Entry } from "@monorepo/content";
import type { Article } from "../../../shared/types/Article";
import { toArticle } from "../../mappers/article";
import { MisconfiguredSiteError, rethrowAsHttpError } from "../../errors";
import { fetchContent } from "../../utils/fetchContent";

const MAX_AGE = 60 * 60 * 6;
const STALE_MAX_AGE = 60 * 60 * 24 * 7;

export default defineCachedEventHandler(async (event): Promise<Article> => {
    const { public: { site } } = useRuntimeConfig(event);
    const { journal } = useAppConfig();

    if (!site.url) throw createError(new MisconfiguredSiteError(["NUXT_PUBLIC_SITE_URL is not set"]));

    const entry = await fetchContent<Entry>(`/api/content/posts/${getRouterParam(event, "slug")}`)
        .catch(rethrowAsHttpError);

    return toArticle(entry, {
        url: site.url,
        name: journal.name,
        issn: journal.issn,
    });
}, {
    name: "article",
    group: "articles",
    maxAge: MAX_AGE,
    staleMaxAge: STALE_MAX_AGE,
    getKey: (event) => getRouterParam(event, "slug") ?? "",
    shouldBypassCache: () => import.meta.dev === true,
});
