import type { EventHandlerRequest, H3Event } from "h3";
import { defineCachedEventHandler } from "nitropack/runtime";
import type { CachedEventHandlerOptions } from "nitropack";
import { contentKey } from "#core/contentKey";
import type { Entry, Term } from "#core/domain/content";
import { isEntryResource } from "#core/domain/content";
import { ITEM_MAX_AGE, ITEM_STALE_MAX_AGE } from "#nuxt/config";
import { parseLocale, parseResource, parseSlug, readVendor, resolveProvider, throwUnavailableError } from "./utils/request";

const cacheOptions: CachedEventHandlerOptions<Entry | Term> = {
    name: "content-item",
    group: "content",
    maxAge: ITEM_MAX_AGE,
    staleMaxAge: ITEM_STALE_MAX_AGE,
    getKey,
    shouldBypassCache: () => import.meta.dev === true,
};

// The slug lookup lives on the server rather than in the composable, so a miss answers with a real
// 404 and a vendor with a native single-document endpoint can serve it without a list round-trip
export default defineCachedEventHandler(async (event) => {
    const resource = parseResource(event);
    const slug = parseSlug(event);
    const locale = parseLocale(event);
    const provider = await resolveProvider(readVendor(event));

    const item = isEntryResource(resource)
        ? provider.getEntry(resource, slug, locale)
        : provider.getTerm(resource, slug, locale);

    return item.catch((cause) => throwUnavailableError(cause, resource));
}, cacheOptions);

// Slug and locale are the whole identity of a single document, so page size cannot fragment it
function getKey(event: H3Event<EventHandlerRequest>): string {
    return contentKey(readVendor(event), parseResource(event), {
        slug: parseSlug(event),
        locale: parseLocale(event),
    });
}
