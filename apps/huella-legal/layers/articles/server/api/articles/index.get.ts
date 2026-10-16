import type { TermResource } from "@monorepo/content";
import type { H3Event } from "h3";
import * as v from "valibot";
import type { ArticleListing } from "../../../shared/types/ArticleListing";
import type { ArticleSummary } from "../../../shared/types/ArticleSummary";
import type { ListingQuery } from "../../../shared/types/ListingQuery";
import type { ListingScope } from "../../../shared/types/ListingScope";
import { FORMATS, toArticleListing } from "../../mappers/articleListing";
import { toCategory } from "../../mappers/articleSummary";
import { getArticleIndex } from "../../services/articleIndex";

const listingQuerySchema = v.object({
    page: v.optional(v.pipe(v.string(), v.toNumber(), v.integer(), v.minValue(1)), "1"),
    sort: v.optional(v.picklist(["newest", "oldest"]), "newest"),
    format: v.optional(v.picklist(FORMATS)),
    category: v.optional(v.string()),
    tag: v.optional(v.string()),
    author: v.optional(v.string()),
});

const notFound = (message: string) =>
    createError({ statusCode: 404, statusMessage: "Listing not found", message });

const parseListingQuery = (event: H3Event): ListingQuery => {
    const result = v.safeParse(listingQuerySchema, getQuery(event));

    if (!result.success) throw notFound(v.summarize(result.issues));

    return result.output;
};

const fetchTerm = async (event: H3Event, resource: TermResource, slug: string) =>
    toCategory(await useContent(event).getTerm(resource, slug));

const toAuthorScope = (slug: string, index: ArticleSummary[]): ListingScope => {
    const articles = index.filter(({ authors }) => authors.some((author) => author.slug === slug));
    const author = articles[0]?.authors.find((candidate) => candidate.slug === slug);

    if (!author) throw notFound(`No author "${slug}"`);

    return { kind: "author", author, since: articles.at(-1)?.publishedAt };
};

const toScope = async (
    event: H3Event,
    { category, tag, author }: ListingQuery,
    index: ArticleSummary[],
): Promise<ListingScope | undefined> => {
    if (category) return { kind: "category", term: await fetchTerm(event, "categories", category) };
    if (tag) return { kind: "tag", term: await fetchTerm(event, "tags", tag) };
    if (author) return toAuthorScope(author, index);

    return undefined;
};

export default defineEventHandler(async (event): Promise<ArticleListing> => {
    const query = parseListingQuery(event);
    const index = await getArticleIndex(event);
    const listing = toArticleListing(index, query, await toScope(event, query, index));

    if (query.page > listing.totalPages)
        throw notFound(`"page" must be between 1 and ${listing.totalPages}`);

    return listing;
});
