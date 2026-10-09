import type { H3Event } from "h3";
import { createError } from "h3";
import { defineCachedFunction, useRuntimeConfig } from "nitropack/runtime";
import { ofetch } from "ofetch";
import { OfetchHttpClient } from "#core/adapters/clients/OfetchHttpClient";
import { contentKey } from "#core/contentKey";
import type {
    Entry,
    EntryQuery,
    EntryResource,
    Page,
    Query,
    Resource,
    Term,
    TermResource,
} from "#core/domain/content";
import { isEntryResource } from "#core/domain/content";
import { ContentError, ContentUnavailableError } from "#core/domain/errors";
import type ContentProvider from "#core/ports/ContentProvider";
import type { VendorConfig } from "#core/registry";
import createProvider from "#core/registry";
import {
    type ContentConfig,
    ITEM_MAX_AGE,
    ITEM_STALE_MAX_AGE,
    LIST_MAX_AGE,
    LIST_STALE_MAX_AGE,
} from "#nuxt/config";
import { toEntryQuery, toQuery, toSlug } from "./query";

const readList = defineCachedFunction(
    async (
        event: H3Event,
        resource: Resource,
        query: EntryQuery,
    ): Promise<Page<Entry> | Page<Term>> => {
        const provider = await resolveProvider(readVendor(event));

        const page = isEntryResource(resource)
            ? provider.listEntries(resource, query)
            : provider.listTerms(resource, query);

        return page.catch((cause) => throwUnavailableError(cause, resource));
    },
    {
        name: "content-list",
        group: "content",
        maxAge: LIST_MAX_AGE,
        staleMaxAge: LIST_STALE_MAX_AGE,
        getKey: (event, resource, query) => contentKey(readVendor(event), resource, query),
        shouldBypassCache: () => import.meta.dev === true,
    },
);

const readItem = defineCachedFunction(
    async (event: H3Event, resource: Resource, slug: string): Promise<Entry | Term> => {
        const provider = await resolveProvider(readVendor(event));

        const item = isEntryResource(resource)
            ? provider.getEntry(resource, slug)
            : provider.getTerm(resource, slug);

        return item.catch((cause) => throwUnavailableError(cause, resource));
    },
    {
        name: "content-item",
        group: "content",
        maxAge: ITEM_MAX_AGE,
        staleMaxAge: ITEM_STALE_MAX_AGE,
        getKey: (event, resource, slug) => contentKey(readVendor(event), resource, { slug }),
        shouldBypassCache: () => import.meta.dev === true,
    },
);

export const useContent = (event: H3Event) => ({
    listEntries: async (resource: EntryResource, query?: EntryQuery) =>
        (await readList(event, resource, toEntryQuery(query))) as Page<Entry>,

    listTerms: async (resource: TermResource, query?: Query) =>
        (await readList(event, resource, toQuery(query))) as Page<Term>,

    getEntry: async (resource: EntryResource, slug: string) =>
        (await readItem(event, resource, toSlug(slug))) as Entry,

    getTerm: async (resource: TermResource, slug: string) =>
        (await readItem(event, resource, toSlug(slug))) as Term,
});

// #region utils
const readVendor = (event: H3Event): VendorConfig => {
    const { vendor } = useRuntimeConfig(event).content as ContentConfig;

    return vendor;
};

const resolveProvider = async (vendor: VendorConfig): Promise<ContentProvider> => {
    try {
        return await createProvider(vendor, new OfetchHttpClient(ofetch));
    } catch (cause) {
        return rethrowAsHttpError(cause);
    }
};

const rethrowAsHttpError = (cause: unknown): never => {
    if (cause instanceof ContentError) throw createError(cause);

    throw cause;
};

const throwUnavailableError = (cause: unknown, resource: string): never => {
    if (cause instanceof ContentError) throw createError(cause);

    throw createError(new ContentUnavailableError(resource, cause));
};
// #endregion
