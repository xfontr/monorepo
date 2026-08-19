import type { Entry, EntryQuery, EntryResource, Locale, Page, Query, Term, TermResource } from "#core/domain/content";
import { CONTENT_API_PATH } from "#nuxt/config";

export function useContent() {
    function listEntries(resource: EntryResource, query?: () => EntryQuery) {
        const requestQuery = toRequestQuery(query?.());

        return useAsyncData(
            () => listKey(resource, requestQuery),
            () => getList<Entry>(resource, requestQuery),
        );
    }

    function listTerms(resource: TermResource, query?: () => Query) {
        const requestQuery = toRequestQuery(query?.());

        return useAsyncData(
            () => listKey(resource, requestQuery),
            () => getList<Term>(resource, requestQuery),
        );
    }

    // A miss is the server's 404, not one invented here: useAsyncData captures it in `error`
    // rather than throwing, so the caller still decides whether that's a soft or a fatal failure
    function getEntry(resource: EntryResource, slug: () => string, locale?: () => Locale | undefined) {
        return useAsyncData(
            () => itemKey(resource, slug(), locale?.()),
            () => getItem<Entry>(resource, slug(), locale?.()),
        );
    }

    function getTerm(resource: TermResource, slug: () => string, locale?: () => Locale | undefined) {
        return useAsyncData(
            () => itemKey(resource, slug(), locale?.()),
            () => getItem<Term>(resource, slug(), locale?.()),
        );
    }

    return { listEntries, getEntry, listTerms, getTerm };
}

// #region utils
function getList<T>(resource: EntryResource | TermResource, query: Record<string, string | number | undefined>): Promise<Page<T>> {
    return $fetch<Page<T>>(`${CONTENT_API_PATH}/${resource}`, { query });
}

function getItem<T>(resource: EntryResource | TermResource, slug: string, locale?: Locale): Promise<T> {
    return $fetch<T>(itemPath(resource, slug), { query: { locale } });
}

function itemPath(resource: EntryResource | TermResource, slug: string): string {
    return `${CONTENT_API_PATH}/${resource}/${encodeURIComponent(slug)}`;
}

function listKey(resource: EntryResource | TermResource, requestQuery: Record<string, string | number | undefined>): string {
    return `content:${resource}:${JSON.stringify(requestQuery)}`;
}

function itemKey(resource: EntryResource | TermResource, slug: string, locale?: Locale): string {
    return `content:${resource}:${slug}:${locale ?? ""}`;
}

function toRequestQuery(query?: EntryQuery): Record<string, string | number | undefined> {
    return {
        page: query?.page,
        perPage: query?.perPage,
        slug: query?.slug,
        search: query?.search,
        locale: query?.locale,
        term: query?.term && `${query.term.resource}:${query.term.id}`,
    };
}
// #endregion
