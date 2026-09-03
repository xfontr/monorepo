export const ENTRY_RESOURCES = ["posts", "pages"] as const;

export const TERM_RESOURCES = ["categories", "tags"] as const;

// Derived from the arrays so the union and the runtime list cannot drift apart
export type EntryResource = typeof ENTRY_RESOURCES[number];

export type TermResource = typeof TERM_RESOURCES[number];

export type Resource = EntryResource | TermResource;

// Contract ceilings, distinct from any vendor's own limits: they bound the cache key space of a
// public route, so a crafted query cannot mint an unlimited number of cache entries.
export const MAX_PAGE = 1000;

export const MAX_PER_PAGE = 50;

export const DEFAULT_PER_PAGE = 10;

export const MAX_SEARCH_LENGTH = 100;

// "blocks" is here so a structured-content vendor is not a breaking change for consumers later
export type RichText
    = | { format: "html" | "markdown", value: string }
      | { format: "blocks", value: unknown[] };

export type Asset = {
    id: string
    url: string
    alt: string
    width?: number
    height?: number
};

export type Term = {
    id: string
    resource: TermResource
    slug: string
    name: string
    description?: string
};

export type Entry = {
    id: string
    slug: string
    title: string
    excerpt?: RichText
    body: RichText
    publishedAt?: string
    updatedAt?: string
    image?: Asset
    terms: Term[]
};

export type Page<T> = {
    items: T[]
    page: number
    perPage: number
    total: number
    totalPages: number
};

export type Query = {
    page?: number
    perPage?: number
    slug?: string
    search?: string
};

export type EntryQuery = Query & {
    term?: { resource: TermResource, id: string }
};

export function isEntryResource(resource: string | undefined): resource is EntryResource {
    return ENTRY_RESOURCES.includes(resource as EntryResource);
}

export function isTermResource(resource: string | undefined): resource is TermResource {
    return TERM_RESOURCES.includes(resource as TermResource);
}
