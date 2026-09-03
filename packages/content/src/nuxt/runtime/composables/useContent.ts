import type { Entry, EntryQuery, EntryResource, Page, Query, Term, TermResource } from "#core/domain/content";
import { CONTENT_API_PATH } from "#nuxt/config";

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
function getEntry(resource: EntryResource, slug: () => string) {
    return useAsyncData(
        () => itemKey(resource, slug()),
        () => $fetch<Entry>(itemPath(resource, slug())),
    );
}

function getTerm(resource: TermResource, slug: () => string) {
    return useAsyncData(
        () => itemKey(resource, slug()),
        () => $fetch<Term>(itemPath(resource, slug())),
    );
}

export function useContent() {
    return { listEntries, getEntry, listTerms, getTerm };
}

// #region utils
function getList<T>(resource: EntryResource | TermResource, query: Record<string, string | number | undefined>): Promise<Page<T>> {
    return $fetch<Page<T>>(`${CONTENT_API_PATH}/${resource}`, { query });
}

// The response type is named at the call site rather than passed through a generic helper: Nitro
// resolves `$fetch<T>` to T only for a concrete object type, and leaves a bare one unresolved
function itemPath(resource: EntryResource | TermResource, slug: string): string {
    return `${CONTENT_API_PATH}/${resource}/${encodeURIComponent(slug)}`;
}

function listKey(resource: EntryResource | TermResource, requestQuery: Record<string, string | number | undefined>): string {
    return `content:${resource}:${JSON.stringify(requestQuery)}`;
}

function itemKey(resource: EntryResource | TermResource, slug: string): string {
    return `content:${resource}:${slug}`;
}

function toRequestQuery(query?: EntryQuery): Record<string, string | number | undefined> {
    return {
        page: query?.page,
        perPage: query?.perPage,
        slug: query?.slug,
        search: query?.search,
        term: query?.term && `${query.term.resource}:${query.term.id}`,
    };
}
// #endregion
