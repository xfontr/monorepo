import type { EventHandlerRequest, H3Event } from "h3";
import { createError, getQuery, getRouterParam } from "h3";
import { useRuntimeConfig } from "nitropack/runtime";
import { ofetch } from "ofetch";
import { OfetchHttpClient } from "#core/adapters/clients/OfetchHttpClient";
import type { EntryQuery, Resource } from "#core/domain/content";
import { DEFAULT_PER_PAGE, isEntryResource, MAX_PAGE, MAX_PER_PAGE } from "#core/domain/content";
import { ContentError, ContentUnavailableError } from "#core/domain/errors";
import type ContentProvider from "#core/ports/ContentProvider";
import type { VendorConfig } from "#core/registry";
import createProvider from "#core/registry";
import type { ContentConfig } from "#nuxt/config";
import { toBoundedInteger, toResource, toSearch, toSlug, toTerm, toText } from "./parsing";

export function readVendor(event: H3Event<EventHandlerRequest>): VendorConfig {
    const { vendor } = useRuntimeConfig(event).content as ContentConfig;

    return vendor;
}

// The transport is built with no baseURL: a provider composes its own absolute URLs, so nothing here
// has to know how its vendor is addressed
export async function resolveProvider(vendor: VendorConfig): Promise<ContentProvider> {
    try {
        return await createProvider(vendor, new OfetchHttpClient(ofetch));
    }
    catch (cause) {
        return rethrowAsHttpError(cause);
    }
}

export function parseResource(event: H3Event<EventHandlerRequest>): Resource {
    return toResource(getRouterParam(event, "resource"));
}

// Decoded, because a router param arrives as the raw path segment: an accented slug would otherwise
// be encoded a second time on the way to the vendor and match nothing. The resource above needs no
// decoding — it is matched against a fixed ASCII list, which an encoded segment fails either way.
export function parseSlug(event: H3Event<EventHandlerRequest>): string {
    return toSlug(getRouterParam(event, "slug", { decode: true }));
}

// Defaults are resolved here rather than left undefined, so `?page=1` and no page at all produce one
// cache key instead of two, and every ceiling is applied before the key is built.
export function parseQuery(event: H3Event<EventHandlerRequest>, resource: Resource): EntryQuery {
    const query = getQuery(event);

    return {
        page: toBoundedInteger(query.page, "page", MAX_PAGE) ?? 1,
        perPage: toBoundedInteger(query.perPage, "perPage", MAX_PER_PAGE) ?? DEFAULT_PER_PAGE,
        slug: toText(query.slug),
        search: toSearch(query.search),
        term: isEntryResource(resource) ? toTerm(query.term) : undefined,
    };
}

// Only our own diagnoses become an HTTP status; anything else keeps its stack and reports as unhandled
export function rethrowAsHttpError(cause: unknown): never {
    if (cause instanceof ContentError) throw createError(cause);

    throw cause;
}

// An UpstreamError already carries the status the domain settled on, so it passes through untouched
// instead of being flattened into a 502
export function throwUnavailableError(cause: unknown, resource: string): never {
    if (cause instanceof ContentError) throw createError(cause);

    throw createError(new ContentUnavailableError(resource, cause));
}
