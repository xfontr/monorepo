import type { Entry } from "@monorepo/content";
import type { Article } from "../../shared/types/Article";
import { toArticleBody } from "./articleBody";
import { toArticleSummary } from "./articleSummary";
import { type Journal, toCitations } from "./citation";

export interface Publication {
    siteUrl: string;
    journal: Journal;
}

export function toArticle(entry: Entry, { siteUrl, journal }: Publication): Article {
    const summary = toArticleSummary(entry);
    const permalink = new URL(`${entry.slug}/`, siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`)
        .href;

    return {
        ...summary,
        body: toArticleBody(entry.body.format === "blocks" ? "" : entry.body.value),
        seo: entry.seo,
        permalink,
        citations: toCitations(summary, journal, permalink),
    };
}
