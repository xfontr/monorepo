import type { CachedEventHandlerOptions } from "nitropack/types";

const MAX_AGE = 60 * 60 * 6;
const STALE_MAX_AGE = 60 * 60 * 24 * 7;

export function articleCacheOptions(name: string): CachedEventHandlerOptions {
    return {
        name,
        group: "articles",
        maxAge: MAX_AGE,
        staleMaxAge: STALE_MAX_AGE,
        getKey: (event) => getRouterParam(event, "slug") ?? "",
        shouldBypassCache: () => import.meta.dev === true,
    };
}
