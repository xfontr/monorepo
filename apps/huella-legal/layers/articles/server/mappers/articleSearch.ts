import type { Entry, Page } from "@monorepo/content";
import type { ArticleSearch } from "../../shared/types/ArticleSearch";
import type { ArticleSummary } from "../../shared/types/ArticleSummary";
import type { Category } from "../../shared/types/Category";
import { toArticleSummary } from "./articleSummary";
import { toFacets } from "./facet";

const SUGGESTED_SUBJECTS = 4;

export const toSuggestedSubjects = (index: ArticleSummary[]): Category[] =>
    toFacets(index.flatMap(({ category }) => category ?? []))
        .sort((a, b) => b.count - a.count)
        .slice(0, SUGGESTED_SUBJECTS)
        .map(({ value }) => value);

// WordPress reports zero pages for zero matches, which would put the first page past the end
export const toArticleSearch = (query: string, page: Page<Entry>): ArticleSearch => ({
    items: page.items.map(toArticleSummary),
    page: page.page,
    perPage: page.perPage,
    total: page.total,
    totalPages: Math.max(1, page.totalPages),
    query,
    subjects: [],
});
