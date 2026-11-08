import type { Entry } from "@monorepo/content";
import type { Page } from "../../shared/types/Page";
import { type Origins, toArticleBody } from "./articleBody";
import { toText } from "./articleSummary";

export const toPermalink = (slug: string, siteUrl: string): string =>
    new URL(`${slug}/`, siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`).href;

export const toPage = (entry: Entry, origins: Origins): Page => ({
    id: entry.id,
    slug: entry.slug,
    title: toText(entry.title),
    body: toArticleBody(entry.body.format === "blocks" ? "" : entry.body.value, origins),
    seo: entry.seo,
    permalink: toPermalink(entry.slug, origins.siteUrl),
});
