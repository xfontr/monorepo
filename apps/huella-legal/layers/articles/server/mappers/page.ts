import type { Entry } from "@monorepo/content";
import type { Page } from "../../shared/types/Page";
import { toArticleBody } from "./articleBody";
import { toText } from "./articleSummary";

export const toPage = (entry: Entry, siteUrl: string): Page => ({
    id: entry.id,
    slug: entry.slug,
    title: toText(entry.title),
    body: toArticleBody(entry.body.format === "blocks" ? "" : entry.body.value),
    seo: entry.seo,
    permalink: new URL(`${entry.slug}/`, siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`).href,
});
