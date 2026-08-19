import type { VendorConfig } from "#core/registry";

export const CONTENT_API_PATH = "/api/content";

export const LIST_MAX_AGE = 60 * 60;
export const LIST_STALE_MAX_AGE = 60 * 60 * 24;

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
