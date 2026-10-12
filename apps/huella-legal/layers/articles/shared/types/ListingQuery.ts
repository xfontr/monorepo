import type { ArticleSummary } from "./ArticleSummary";

export interface ListingQuery {
    page: number;
    sort: "newest" | "oldest";
    format?: ArticleSummary["format"];
    category?: string;
    tag?: string;
    author?: string;
}
