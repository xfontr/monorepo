import type { Entry, EntryQuery, EntryResource, Locale, Page, Query, Term, TermResource } from "#core/domain/content";
import { CONTENT_API_PATH } from "#nuxt/config";

// Thin fetchers rather than useAsyncData wrappers: the caller keeps its own keys, caching and SSR strategy
export function useContent() {
    function listEntries(resource: EntryResource, query?: EntryQuery): Promise<Page<Entry>> {
        return $fetch<Page<Entry>>(`${CONTENT_API_PATH}/${resource}`, { query: toRequestQuery(query) });
    }

    function listTerms(resource: TermResource, query?: Query): Promise<Page<Term>> {
        return $fetch<Page<Term>>(`${CONTENT_API_PATH}/${resource}`, { query: toRequestQuery(query) });
    }

    // A miss is the server's 404, not one invented here: a NotFoundError thrown in the browser carries
    // a status nothing reads and will not render as an error page
    function getEntry(resource: EntryResource, slug: string, locale?: Locale): Promise<Entry> {
        return $fetch<Entry>(itemPath(resource, slug), { query: { locale } });
    }

    function getTerm(resource: TermResource, slug: string, locale?: Locale): Promise<Term> {
        return $fetch<Term>(itemPath(resource, slug), { query: { locale } });
    }

    return { listEntries, getEntry, listTerms, getTerm };
}

function itemPath(resource: EntryResource | TermResource, slug: string): string {
    return `${CONTENT_API_PATH}/${resource}/${encodeURIComponent(slug)}`;
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
