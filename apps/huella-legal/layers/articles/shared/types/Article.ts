import type { ArticleSummary } from "./ArticleSummary";
import type { Citation } from "./Citation";
import type { Page } from "./Page";

export type Article = Page &
    ArticleSummary & {
        citations: Citation[];
    };
