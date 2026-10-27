import type { VendorConfig } from "#core/registry";

export interface CacheWindow {
    maxAge: number;
    // Off refetches an expired entry before answering, instead of serving it while it refreshes
    swr: boolean;
}

export interface ContentCacheConfig {
    list: CacheWindow;
    item: CacheWindow;
}

export const CACHE_DEFAULTS: ContentCacheConfig = {
    list: { maxAge: 60 * 60, swr: true },
    item: { maxAge: 60 * 60 * 6, swr: true },
};

export interface ContentConfig {
    vendor: VendorConfig;
    cache: ContentCacheConfig;
}

declare module "@nuxt/schema" {
    interface RuntimeConfig {
        content: ContentConfig;
    }
}
