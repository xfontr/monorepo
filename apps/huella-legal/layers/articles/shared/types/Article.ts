import type { SEO } from "@monorepo/content";
import type { ArticleBody } from "./ArticleBody";
import type { ArticleSummary } from "./ArticleSummary";
import type { Citation } from "./Citation";

export type Article = ArticleSummary & {
    body: ArticleBody;
    seo?: SEO;
    permalink: string;
    citations: Citation[];
};
