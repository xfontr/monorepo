import type { ArticleSummary } from "./ArticleSummary";
import type { Category } from "./Category";
import type { Facet } from "./Facet";

export interface Home {
    lead?: ArticleSummary;
    latest: ArticleSummary[];
    recent: ArticleSummary[];
    theses: ArticleSummary[];
    subjects: Facet<Category>[];
    formats: Facet<ArticleSummary["format"]>[];
}
