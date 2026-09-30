import type { SEO } from "@monorepo/content";
import type { ArticleBody } from "./ArticleBody";
import type { ArticleSummary } from "./ArticleSummary";

export type Article = ArticleSummary & {
    body: ArticleBody
    seo?: SEO
};
