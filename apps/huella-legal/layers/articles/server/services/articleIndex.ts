import { MAX_PER_PAGE } from "@monorepo/content";
import type { H3Event } from "h3";
import type { ArticleSummary } from "../../shared/types/ArticleSummary";
import { toArticleSummary } from "../mappers/articleSummary";

const MAX_AGE = 60 * 60;
const STALE_MAX_AGE = 60 * 60 * 24;

const newestFirst = (a: ArticleSummary, b: ArticleSummary): number =>
    (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");

export const getArticleIndex = defineCachedFunction(
    async (event: H3Event): Promise<ArticleSummary[]> => {
        const content = useContent(event);
        const fetchPage = (page: number) =>
            content.listEntries("posts", { page, perPage: MAX_PER_PAGE });

        const first = await fetchPage(1);
        const rest = await Promise.all(
            Array.from({ length: first.totalPages - 1 }, (_, index) => fetchPage(index + 2)),
        );

        return [first, ...rest]
            .flatMap(({ items }) => items.map(toArticleSummary))
            .sort(newestFirst);
    },
    {
        name: "article-index",
        group: "articles",
        maxAge: MAX_AGE,
        staleMaxAge: STALE_MAX_AGE,
        getKey: () => "posts",
        shouldBypassCache: () => import.meta.dev === true,
    },
);
