import type { Entry } from "@monorepo/content";
import type { Article } from "../../shared/types/Article";
import type { Journal } from "../../shared/types/Journal";
import type { Origins } from "./articleBody";
import { toArticleSummary } from "./articleSummary";
import { toCitations } from "./citation";
import { toPage } from "./page";

export interface Publication extends Origins {
    journal: Journal;
}

export const toArticle = (entry: Entry, { journal, ...origins }: Publication): Article => {
    const page = toPage(entry, origins);
    const summary = toArticleSummary(entry);

    return { ...page, ...summary, citations: toCitations(summary, journal, page.permalink) };
};
