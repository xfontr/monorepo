import type { SEO } from "@monorepo/content";
import type { ArticleBody } from "./ArticleBody";

export interface Page {
    id: string;
    slug: string;
    title: string;
    body: ArticleBody;
    seo?: SEO;
    permalink: string;
}
