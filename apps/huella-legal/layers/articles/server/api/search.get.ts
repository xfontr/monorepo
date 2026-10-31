import { MAX_SEARCH_LENGTH } from "@monorepo/content";
import type { H3Event } from "h3";
import * as v from "valibot";
import type { ArticleSearch } from "../../shared/types/ArticleSearch";
import { toArticleSearch, toSuggestedSubjects } from "../mappers/articleSearch";
import { getArticleIndex } from "../services/articleIndex";
import { withCommentCounts } from "../services/commentCounts";

const PER_PAGE = 20;

const searchQuerySchema = v.object({
    query: v.pipe(v.string(), v.trim(), v.nonEmpty(), v.maxLength(MAX_SEARCH_LENGTH)),
    page: v.optional(v.pipe(v.string(), v.toNumber(), v.integer(), v.minValue(1)), "1"),
});

defineRouteMeta({
    openAPI: {
        tags: ["Articles"],
        summary: "Search articles, suggesting subjects when nothing matches",
        parameters: [
            {
                name: "query",
                in: "query",
                required: true,
                // `MAX_SEARCH_LENGTH` from `@monorepo/content`, since route meta only takes literals
                description: "1 to 100 characters, trimmed",
                schema: { type: "string" },
            },
            { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
        ],
        responses: {
            200: { description: "Twenty results per page" },
            404: { description: "The query is invalid or the page is past the end" },
        },
    },
});

const notFound = (message: string) =>
    createError({ statusCode: 404, statusMessage: "Search not found", message });

const parseSearchQuery = (event: H3Event) => {
    const result = v.safeParse(searchQuerySchema, getQuery(event));

    if (!result.success) throw notFound(v.summarize(result.issues));

    return result.output;
};

// WP answers a page past the end with a 400, which useContent passes through
const isRefused = (error: unknown): boolean =>
    (error as { statusCode?: unknown } | undefined)?.statusCode === 400;

export default defineEventHandler(async (event): Promise<ArticleSearch> => {
    const { query, page } = parseSearchQuery(event);

    const results = await useContent(event)
        .listEntries("posts", { search: query, page, perPage: PER_PAGE })
        .catch((error: unknown) => {
            throw isRefused(error) ? notFound(`No page ${page} of results for "${query}"`) : error;
        });

    const found = toArticleSearch(query, results);
    const search = { ...found, items: await withCommentCounts(event, found.items) };

    // WP only refuses a page past the end when something matched
    if (page > search.totalPages) throw notFound(`"page" is past the end for "${query}"`);

    if (search.total) return search;

    return { ...search, subjects: toSuggestedSubjects(await getArticleIndex(event)) };
});
