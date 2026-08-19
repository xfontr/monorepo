export type WordpressProviderConfig = {
    baseURL: string
};

interface WordpressRendered {
    rendered: string
}

export interface WordpressMedia {
    id: number
    source_url?: string
    alt_text?: string
    media_details?: { width?: number, height?: number }
}

export interface WordpressTerm {
    id: number
    name: string
    slug: string
    taxonomy: string
    description?: string
}

export interface WordpressEntry {
    id: number
    slug: string
    title: WordpressRendered
    content: WordpressRendered
    excerpt?: WordpressRendered
    date_gmt?: string | null
    modified_gmt?: string | null
    _embedded?: {
        "wp:featuredmedia"?: WordpressMedia[]
        "wp:term"?: WordpressTerm[][]
    }
}
