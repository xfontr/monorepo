import type { Entry, Page } from "@monorepo/content";
import type { ArticleSummary } from "../../../../shared/types/ArticleSummary";
import { toArticleSummary } from "../../../mappers/articleSummary";
import { rethrowAsHttpError } from "../../../errors";
import { fetchContent } from "../../../utils/fetchContent";

const MAX_AGE = 60 * 60 * 6;
const STALE_MAX_AGE = 60 * 60 * 24 * 7;

const RELATED = 3;

export default defineCachedEventHandler(async (event): Promise<ArticleSummary[]> => {
    const entry = await fetchContent<Entry>(`/api/content/posts/${getRouterParam(event, "slug")}`)
        .catch(rethrowAsHttpError);

    const category = entry.terms.find(({ resource }) => resource === "categories");

    if (!category) return [];

    // One extra, because the article is usually among its own category's newest
    const page = await fetchContent<Page<Entry>>("/api/content/posts", { query: { term: `categories:${category.id}`, perPage: RELATED + 1 } })
        .catch(rethrowAsHttpError);

    return page.items.filter(({ id }) => id !== entry.id).slice(0, RELATED).map(toArticleSummary);
}, {
    name: "related",
    group: "articles",
    maxAge: MAX_AGE,
    staleMaxAge: STALE_MAX_AGE,
    getKey: (event) => getRouterParam(event, "slug") ?? "",
    shouldBypassCache: () => import.meta.dev === true,
});
