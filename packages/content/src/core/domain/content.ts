export const ENTRY_RESOURCES = ["posts", "pages"] as const;

export const TERM_RESOURCES = ["categories", "tags"] as const;

export type EntryResource = (typeof ENTRY_RESOURCES)[number];

export type TermResource = (typeof TERM_RESOURCES)[number];

export type Resource = EntryResource | TermResource;

export const MAX_PAGE = 1000;

export const MAX_PER_PAGE = 50;

export const DEFAULT_PER_PAGE = 10;

export const MAX_SEARCH_LENGTH = 100;

export type RichText =
    { format: "html" | "markdown"; value: string } | { format: "blocks"; value: unknown[] };

export interface Asset {
    id: string;
    url: string;
    alt: string;
    width?: number;
    height?: number;
}

export interface SEO {
    title?: string;
    description?: string;
    noindex?: boolean;
}

export interface Author {
    id: string;
    slug: string;
    name: string;
    bio?: string;
    avatar?: Asset;
}

export interface Term {
    id: string;
    resource: TermResource;
    slug: string;
    name: string;
    description?: string;
    seo?: SEO;
}

export interface Entry {
    id: string;
    slug: string;
    title: string;
    excerpt?: RichText;
    body: RichText;
    publishedAt?: string;
    updatedAt?: string;
    image?: Asset;
    terms: Term[];
    authors: Author[];
    seo?: SEO;
}

export interface Page<T> {
    items: T[];
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
}

export interface Query {
    page?: number;
    perPage?: number;
    slug?: string;
    search?: string;
}

export type EntryQuery = Query & {
    term?: { resource: TermResource; id: string };
    author?: string;
};

export const isEntryResource = (resource: string | undefined): resource is EntryResource =>
    ENTRY_RESOURCES.includes(resource as EntryResource);

export const isTermResource = (resource: string | undefined): resource is TermResource =>
    TERM_RESOURCES.includes(resource as TermResource);
