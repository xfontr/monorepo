import { JOURNAL_LOCALE } from "../../../../i18n/dateFormats";
import type { ArticleListing } from "../../shared/types/ArticleListing";
import type { ArticleSummary } from "../../shared/types/ArticleSummary";
import type { Category } from "../../shared/types/Category";
import type { Facet } from "../../shared/types/Facet";
import type { ListingQuery } from "../../shared/types/ListingQuery";
import type { ListingScope } from "../../shared/types/ListingScope";

const PER_PAGE = 20;

export const FORMATS = [
    "articulo",
    "comentario",
    "ensayo",
    "tfg-tfm",
] as const satisfies readonly ArticleSummary["format"][];

export const toArticleListing = (
    index: ArticleSummary[],
    query: ListingQuery,
    scope?: ListingScope,
): ArticleListing => {
    const scoped = index.filter((article) => isInScope(article, scope));
    const matches = query.format ? scoped.filter(({ format }) => format === query.format) : scoped;
    const sorted = query.sort === "oldest" ? [...matches].reverse() : matches;

    return {
        items: sorted.slice((query.page - 1) * PER_PAGE, query.page * PER_PAGE),
        page: query.page,
        perPage: PER_PAGE,
        total: matches.length,
        totalPages: Math.max(1, Math.ceil(matches.length / PER_PAGE)),
        scope,
        formats: FORMATS.map((format) => ({
            value: format,
            count: scoped.filter((article) => article.format === format).length,
        })).filter(({ count }) => count > 0),
        subjects: toSubjects(scope?.kind === "author" ? scoped : index),
    };
};

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

const toSubjects = (articles: ArticleSummary[]): Facet<Category>[] => {
    const subjects = new Map<string, Facet<Category>>();

    for (const { category } of articles) {
        if (!category) continue;

        const subject = subjects.get(category.id) ?? { value: category, count: 0 };
        subjects.set(category.id, { ...subject, count: subject.count + 1 });
    }

    return [...subjects.values()].sort((a, b) =>
        a.value.name.localeCompare(b.value.name, JOURNAL_LOCALE),
    );
};
