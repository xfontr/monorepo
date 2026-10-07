import type { TocItem } from "./TocItem";

export interface ArticleBody {
    html: string
    toc: TocItem[]
    // One sanitised HTML fragment per reference
    bibliography: string[]
}
