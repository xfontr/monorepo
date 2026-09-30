import type { Entry } from "@monorepo/content";
import type { Article } from "../../shared/types/Article";
import { toArticleBody } from "./articleBody";
import { toArticleSummary } from "./articleSummary";

export function toArticle(entry: Entry): Article {
    return {
        ...toArticleSummary(entry),
        body: toArticleBody(entry.body.format === "blocks" ? "" : entry.body.value),
        seo: entry.seo,
    };
}
