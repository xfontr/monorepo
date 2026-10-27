import { MAX_PER_PAGE } from "@monorepo/content";
import type { H3Event } from "h3";
import type { ArticleSummary } from "../../shared/types/ArticleSummary";
import { toArticleSummary } from "../mappers/articleSummary";
import { readAllPages } from "../utils/readAllPages";

const { cache } = useRuntimeConfig().articles;

const newestFirst = (a: ArticleSummary, b: ArticleSummary): number =>
    (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");

export const getArticleIndex = defineCachedFunction(
    async (event: H3Event): Promise<ArticleSummary[]> => {
        const content = useContent(event);
        const entries = await readAllPages((page) =>
            content.listEntries("posts", { page, perPage: MAX_PER_PAGE }),
        );

        return entries.map(toArticleSummary).sort(newestFirst);
    },
    {
        name: "article-index",
        group: "articles",
        ...cache,
        getKey: () => "posts",
    },
);
