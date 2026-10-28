import type { Page } from "@monorepo/content";
import type { ArticleSummary } from "./ArticleSummary";
import type { Category } from "./Category";

export interface ArticleSearch extends Page<ArticleSummary> {
    query: string;
    // Empty unless nothing matched, when they are what the reader can browse instead
    subjects: Category[];
}
