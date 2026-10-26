import type { Entry } from "@monorepo/content";
import type { Article } from "../../shared/types/Article";
import { toArticleSummary } from "./articleSummary";
import { type Journal, toCitations } from "./citation";
import { toPage } from "./page";

export interface Publication {
    siteUrl: string;
    journal: Journal;
}

export const toArticle = (entry: Entry, { siteUrl, journal }: Publication): Article => {
    const page = toPage(entry, siteUrl);
    const summary = toArticleSummary(entry);

    return { ...page, ...summary, citations: toCitations(summary, journal, page.permalink) };
};
