import type { Entry } from "@monorepo/content";
import type { Article } from "../../shared/types/Article";
import { toArticleBody } from "./articleBody";
import { toArticleSummary } from "./articleSummary";
import { toCitations } from "./citation";

export interface Site {
    url: string
    name: string
    issn: string
}

export function toArticle(entry: Entry, site: Site): Article {
    const summary = toArticleSummary(entry);
    const permalink = new URL(`${entry.slug}/`, site.url.endsWith("/") ? site.url : `${site.url}/`).href;

    return {
        ...summary,
        body: toArticleBody(entry.body.format === "blocks" ? "" : entry.body.value),
        seo: entry.seo,
        permalink,
        citations: toCitations(summary, { name: site.name, issn: site.issn, permalink }),
    };
}
