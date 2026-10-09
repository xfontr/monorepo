export interface WordpressProviderConfig {
    baseURL: string;
}

interface WordpressRendered {
    rendered: string;
}

export interface WordpressMedia {
    id: number;
    source_url?: string;
    alt_text?: string;
    media_details?: { width?: number; height?: number };
}

// Only the text fields are read: every URL in it points at the WordPress host
export interface WordpressYoast {
    title?: string;
    description?: string;
    robots?: { index?: string };
}

export interface WordpressTerm {
    id: number;
    name: string;
    slug: string;
    taxonomy: string;
    description?: string;
    yoast_head_json?: WordpressYoast;
}

// `avatar_urls` is left out on purpose: without an uploaded avatar it holds a default-Gravatar placeholder
export interface WordpressUser {
    id: number;
    name: string;
    slug: string;
    description?: string;
    simple_local_avatar?: { media_id?: number; full?: string } | false | "";
}

export interface WordpressEntry {
    id: number;
    slug: string;
    title: WordpressRendered;
    content: WordpressRendered;
    excerpt?: WordpressRendered;
    date_gmt?: string | null;
    modified_gmt?: string | null;
    yoast_head_json?: WordpressYoast;
    _embedded?: {
        "wp:featuredmedia"?: WordpressMedia[];
        "wp:term"?: WordpressTerm[][];
        author?: WordpressUser[];
    };
}
