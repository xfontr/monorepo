import type { Page } from "@monorepo/content";
import type { ArticleSummary } from "./ArticleSummary";
import type { Category } from "./Category";
import type { Facet } from "./Facet";
import type { ListingScope } from "./ListingScope";

export interface ArticleListing extends Page<ArticleSummary> {
    scope?: ListingScope;
    // Counted before the format filter, so every pill keeps its number while another one is active
    formats: Facet<ArticleSummary["format"]>[];
    // An author's own subjects on their profile, every subject everywhere else
    subjects: Facet<Category>[];
}
