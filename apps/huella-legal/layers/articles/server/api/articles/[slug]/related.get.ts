import type { Entry, Page } from "@monorepo/content";
import type { ArticleSummary } from "../../../../shared/types/ArticleSummary";
import { articleCacheOptions } from "../../../cache";
import { toArticleSummary } from "../../../mappers/articleSummary";
import { fetchContent } from "../../../utils/fetchContent";

const RELATED = 3;

export default defineCachedEventHandler(async (event): Promise<ArticleSummary[]> => {
    const entry = await fetchContent<Entry>(`/api/content/posts/${getRouterParam(event, "slug")}`);
    const category = entry.terms.find(({ resource }) => resource === "categories");

    if (!category) return [];

    // One extra, because the article is usually among its own category's newest
    const { items } = await fetchContent<Page<Entry>>("/api/content/posts", { term: `categories:${category.id}`, perPage: RELATED + 1 });

    return items.filter(({ id }) => id !== entry.id).slice(0, RELATED).map(toArticleSummary);
}, articleCacheOptions("related"));
