import type { Asset } from "@monorepo/content";
import type { Author } from "./Author";
import type { Category } from "./Category";

export interface ArticleSummary {
    id: string
    slug: string
    title: string
    excerpt?: string
    publishedAt?: string
    updatedAt?: string
    image?: Asset
    authors: Author[]
    category?: Category
    tags: Category[]
    format: "articulo" | "comentario" | "ensayo" | "tfg-tfm"
    readingMinutes: number
}
