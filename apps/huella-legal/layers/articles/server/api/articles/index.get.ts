import type { Page } from "@monorepo/content";
import type { ArticleSummary } from "../../../shared/types/ArticleSummary";
import { toArticleSummary } from "../../mappers/articleSummary";

const PER_PAGE = 6;

// Only the page is forwarded, so a reader can't mint a cache entry per page size
export default defineEventHandler(async (event): Promise<Page<ArticleSummary>> => {
    const { page } = getQuery(event);
    const posts = await useContent(event).listEntries("posts", { page: page ? Number(page) : undefined, perPage: PER_PAGE });

    return { ...posts, items: posts.items.map(toArticleSummary) };
});
