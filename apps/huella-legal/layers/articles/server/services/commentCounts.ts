import type { H3Event } from "h3";
import type { ArticleSummary } from "../../shared/types/ArticleSummary";
import { listCommentedPosts } from "../adapters/wordpress";

const { cache } = useRuntimeConfig().articles;

export const getCommentCounts = defineCachedFunction(
    async (event: H3Event): Promise<Record<string, number>> => {
        const counts: Record<string, number> = {};

        for (const post of await listCommentedPosts(event)) counts[post] = (counts[post] ?? 0) + 1;

        return counts;
    },
    {
        name: "comment-counts",
        group: "articles",
        ...cache,
        getKey: () => "comments",
    },
);

/** Puts each post's comment count on its summary; a failed count leaves the cards without one. */
export const withCommentCounts = async (
    event: H3Event,
    summaries: ArticleSummary[],
): Promise<ArticleSummary[]> => {
    const counts = await getCommentCounts(event).catch((): Record<string, number> => ({}));

    return summaries.map((summary) => {
        const commentCount = counts[summary.id];

        return commentCount ? { ...summary, commentCount } : summary;
    });
};
