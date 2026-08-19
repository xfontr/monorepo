import type { VendorConfig } from "#core/registry";

export const CONTENT_API_PATH = "/api/content";

// Nitro reads these when the handler module loads, so they cannot vary per request or per resource;
// a genuinely different TTL per resource would need a route per resource.
export const LIST_MAX_AGE = 60 * 60;

export const LIST_STALE_MAX_AGE = 60 * 60 * 24;

// A single document is addressed by slug, so it stays valid far longer than any list that a newly
// published entry reorders
export const ITEM_MAX_AGE = 60 * 60 * 6;

export const ITEM_STALE_MAX_AGE = 60 * 60 * 24 * 7;

export interface ContentConfig {
    vendor: VendorConfig
}

declare module "@nuxt/schema" {
    interface RuntimeConfig {
        content: ContentConfig
    }
}
