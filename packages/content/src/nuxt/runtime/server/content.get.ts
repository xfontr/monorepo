import type { EventHandlerRequest, H3Event } from "h3";
import { defineCachedEventHandler } from "nitropack/runtime";
import type { CachedEventHandlerOptions } from "nitropack";
import { contentKey } from "#core/contentKey";
import type { Entry, Page, Term } from "#core/domain/content";
import { isEntryResource } from "#core/domain/content";
import { LIST_MAX_AGE, LIST_STALE_MAX_AGE } from "#nuxt/config";
import { parseQuery, parseResource, readVendor, resolveProvider, throwUnavailableError } from "./utils/request";

type ContentPage = Page<Entry> | Page<Term>;

const cacheOptions: CachedEventHandlerOptions<ContentPage> = {
    name: "content-list",
    group: "content",
    maxAge: LIST_MAX_AGE,
    staleMaxAge: LIST_STALE_MAX_AGE,
    getKey,
    shouldBypassCache: () => import.meta.dev === true,
};

export default defineCachedEventHandler(async (event) => {
    const resource = parseResource(event);
    const query = parseQuery(event, resource);
    const provider = await resolveProvider(readVendor(event));

    const page = isEntryResource(resource)
        ? provider.listEntries(resource, query)
        : provider.listTerms(resource, query);

    return page.catch((cause) => throwUnavailableError(cause, resource));
}, cacheOptions);

// Keyed off the parsed query, so `?page=1`, `?page=01` and no page at all cannot split the cache
function getKey(event: H3Event<EventHandlerRequest>): string {
    const resource = parseResource(event);

    return contentKey(readVendor(event), resource, parseQuery(event, resource));
}
