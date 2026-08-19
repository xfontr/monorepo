import type { EventHandlerRequest, H3Event } from "h3";
import { createError, getQuery, getRouterParam } from "h3";
import { useRuntimeConfig } from "nitropack/runtime";
import { ofetch } from "ofetch";
import { OfetchHttpClient } from "#core/adapters/clients/OfetchHttpClient";
import type { EntryQuery, Locale, Resource } from "#core/domain/content";
import {
    DEFAULT_PER_PAGE,
    ENTRY_RESOURCES,
    isEntryResource,
    isTermResource,
    MAX_PAGE,
    MAX_PER_PAGE,
    MAX_SEARCH_LENGTH,
    TERM_RESOURCES,
} from "#core/domain/content";
import { ContentError, ContentUnavailableError, MalformedQueryError, UndefinedResourceError } from "#core/domain/errors";
import type ContentProvider from "#core/ports/ContentProvider";
import type { VendorConfig } from "#core/registry";
import createProvider from "#core/registry";
import type { ContentConfig } from "#nuxt/config";

// A basic BCP-47 tag. The vendor is the authority on which locales it actually serves — this only
// keeps free text out of a cache key.
const LOCALE_PATTERN = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

export function readVendor(event: H3Event<EventHandlerRequest>): VendorConfig {
    // The #nuxt/config augmentation only lands inside a Nuxt project; compiled standalone this is
    // `any`, so the assertion is what keeps it typed rather than redundant decoration
    const { vendor } = useRuntimeConfig(event).content as ContentConfig;

    return vendor;
}

// The transport is built with no baseURL: a provider composes its own absolute URLs, so nothing here
// has to know how its vendor is addressed
export function resolveProvider(vendor: VendorConfig): Promise<ContentProvider> {
    return createProvider(vendor, new OfetchHttpClient(ofetch)).catch(rethrowAsHttpError);
}

export function parseResource(event: H3Event<EventHandlerRequest>): Resource {
    const resource = getRouterParam(event, "resource");

    if (!isEntryResource(resource) && !isTermResource(resource)) {
        throw createError(new UndefinedResourceError(resource, [...ENTRY_RESOURCES, ...TERM_RESOURCES]));
    }

    return resource;
}

// Decoded, because a router param arrives as the raw path segment: an accented slug would otherwise
// be encoded a second time on the way to the vendor and match nothing. The resource above needs no
// decoding — it is matched against a fixed ASCII list, which an encoded segment fails either way.
export function parseSlug(event: H3Event<EventHandlerRequest>): string {
    const slug = toText(getRouterParam(event, "slug", { decode: true }));

    if (!slug) throw createError(new MalformedQueryError("slug", "a non-empty string"));

    return slug;
}

export function parseLocale(event: H3Event<EventHandlerRequest>): Locale | undefined {
    const locale = toText(getQuery(event).locale);

    if (locale === undefined) return undefined;

    if (!LOCALE_PATTERN.test(locale)) throw createError(new MalformedQueryError("locale", "a BCP-47 tag, e.g. en-GB"));

    return locale;
}

// Defaults are resolved here rather than left undefined, so `?page=1` and no page at all produce one
// cache key instead of two, and every ceiling is applied before the key is built. `search` is the one
// axis whose key space is not small — bounding its length is not the same as bounding it, so a public
// deployment wants a rate limit at the edge as well.
export function parseQuery(event: H3Event<EventHandlerRequest>, resource: Resource): EntryQuery {
    const query = getQuery(event);

    return {
        page: toBoundedInteger(query.page, "page", MAX_PAGE) ?? 1,
        perPage: toBoundedInteger(query.perPage, "perPage", MAX_PER_PAGE) ?? DEFAULT_PER_PAGE,
        slug: toText(query.slug),
        search: toSearch(query.search),
        locale: parseLocale(event),
        term: isEntryResource(resource) ? parseTerm(toText(query.term)) : undefined,
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

// #region parsing
// `term=categories:12`. An unknown taxonomy is rejected rather than dropped, so a typo cannot
// silently return the unfiltered list.
function parseTerm(term?: string): EntryQuery["term"] {
    if (!term) return undefined;

    const [resource, id] = term.split(":");

    if (!id) throw createError(new MalformedQueryError("term", "<taxonomy>:<id>"));

    if (!isTermResource(resource)) {
        throw createError(new UndefinedResourceError(resource, [...TERM_RESOURCES]));
    }

    return { resource, id };
}

// Out of range is rejected, not clamped: a caller asking for page 10000 wants a page that does not
// exist, and silently answering with a different one is worse than saying so
function toBoundedInteger(value: unknown, param: string, max: number): number | undefined {
    const text = toText(value);

    if (text === undefined) return undefined;

    const parsed = Number(text);

    if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) {
        throw createError(new MalformedQueryError(param, `an integer between 1 and ${max}`));
    }

    return parsed;
}

function toSearch(value: unknown): string | undefined {
    const search = toText(value);

    if (search !== undefined && search.length > MAX_SEARCH_LENGTH) {
        throw createError(new MalformedQueryError("search", `at most ${MAX_SEARCH_LENGTH} characters`));
    }

    return search;
}

function toText(value: unknown): string | undefined {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
// #endregion
