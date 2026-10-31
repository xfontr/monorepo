import type { ArticleListing } from "../../shared/types/ArticleListing";
import type { ArticleSummary } from "../../shared/types/ArticleSummary";
import type { Category } from "../../shared/types/Category";
import type { Facet } from "../../shared/types/Facet";
import type { ListingQuery } from "../../shared/types/ListingQuery";
import type { ListingScope } from "../../shared/types/ListingScope";
import { normalizeText } from "../../shared/utils/normalizeText";
import { byName, toFacets } from "./facet";

const PER_PAGE = 20;

export const FORMATS = [
    "articulo",
    "comentario",
    "tfg-tfm",
] as const satisfies readonly ArticleSummary["format"][];

const oldestFirst = (articles: ArticleSummary[]): ArticleSummary[] => [
    ...articles.filter(({ publishedAt }) => publishedAt).reverse(),
    ...articles.filter(({ publishedAt }) => !publishedAt),
];

const isInScope = (article: ArticleSummary, scope?: ListingScope): boolean => {
    switch (scope?.kind) {
        case "category":
            return article.category?.id === scope.term.id;
        case "tag":
            return article.tags.some(({ id }) => id === scope.term.id);
        case "author":
            return article.authors.some(({ id }) => id === scope.author.id);
        default:
            return true;
    }
};

const toSearchText = ({ title, excerpt, category, tags, authors }: ArticleSummary): string =>
    normalizeText(
        [title, excerpt, category?.name, ...[...tags, ...authors].map(({ name }) => name)].join(
            " ",
        ),
    );

const isMatch = (article: ArticleSummary, words: string[]): boolean => {
    const text = toSearchText(article);

    return words.every((word) => text.includes(word));
};

export const toSubjects = (articles: ArticleSummary[]): Facet<Category>[] =>
    toFacets(articles.flatMap(({ category }) => category ?? [])).sort(byName);

export const toFormats = (articles: ArticleSummary[]): Facet<ArticleSummary["format"]>[] =>
    FORMATS.map((value) => ({
        value,
        count: articles.filter(({ format }) => format === value).length,
    }));

export const toArticleListing = (
    index: ArticleSummary[],
    query: ListingQuery,
    scope?: ListingScope,
): ArticleListing => {
    const words = normalizeText(query.query ?? "")
        .split(/\s+/)
        .filter(Boolean);
    const scoped = index.filter(
        (article) => isInScope(article, scope) && (!words.length || isMatch(article, words)),
    );
    const matches = query.format ? scoped.filter(({ format }) => format === query.format) : scoped;
    const sorted = query.sort === "oldest" ? oldestFirst(matches) : matches;

    return {
        items: sorted.slice((query.page - 1) * PER_PAGE, query.page * PER_PAGE),
        page: query.page,
        perPage: PER_PAGE,
        total: matches.length,
        totalPages: Math.max(1, Math.ceil(matches.length / PER_PAGE)),
        scope,
        formats: toFormats(scoped).filter(({ count }) => count > 0),
        subjects: toSubjects(scope?.kind === "author" ? scoped : index),
    };
};
