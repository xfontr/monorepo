import type { ArticleSummary } from "./ArticleSummary";
import type { Category } from "./Category";
import type { Facet } from "./Facet";

export interface SubjectIndex {
    subjects: Facet<Category>[];
    formats: Facet<ArticleSummary["format"]>[];
    topics: Facet<Category>[];
}
