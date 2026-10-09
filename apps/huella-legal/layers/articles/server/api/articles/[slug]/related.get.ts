import type { ArticleSummary } from "../../../../shared/types/ArticleSummary";
import { toArticleSummary } from "../../../mappers/articleSummary";

const RELATED = 3;

export default defineEventHandler(async (event): Promise<ArticleSummary[]> => {
    const content = useContent(event);
    const entry = await content.getEntry("posts", getRouterParam(event, "slug", { decode: true }) ?? "");
    const category = entry.terms.find(({ resource }) => resource === "categories");

    if (!category) return [];

    // One extra, because the article is usually among its own category's newest
    const { items } = await content.listEntries("posts", { term: { resource: "categories", id: category.id }, perPage: RELATED + 1 });

    return items.filter(({ id }) => id !== entry.id).slice(0, RELATED).map(toArticleSummary);
});
