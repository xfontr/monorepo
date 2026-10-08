import type { Entry } from "@monorepo/content";
import type { Article } from "../../../shared/types/Article";
import { toArticle } from "../../mappers/article";

interface Cause {
    statusCode?: number
    statusMessage?: string
}

const MAX_AGE = 60 * 60 * 6;
const STALE_MAX_AGE = 60 * 60 * 24 * 7;

export default defineCachedEventHandler(async (event): Promise<Article> => {
    const entry = await $fetch<Entry>(`/api/content/posts/${getRouterParam(event, "slug")}`)
        .catch(({ statusCode, statusMessage }: Cause) => {
            throw createError({ statusCode, statusMessage });
        });

    return toArticle(entry);
}, {
    name: "article",
    group: "articles",
    maxAge: MAX_AGE,
    staleMaxAge: STALE_MAX_AGE,
    getKey: (event) => getRouterParam(event, "slug") ?? "",
    shouldBypassCache: () => import.meta.dev === true,
});
