import { createError } from "h3";
import type { EntryQuery, Query } from "#core/domain/content";
import {
    DEFAULT_PER_PAGE,
    isTermResource,
    MAX_PAGE,
    MAX_PER_PAGE,
    MAX_SEARCH_LENGTH,
    TERM_RESOURCES,
} from "#core/domain/content";
import { MalformedQueryError, UndefinedResourceError } from "#core/domain/errors";

// Defaults are resolved rather than left undefined, so `{}` and `{ page: 1 }` key one cache entry
export const toQuery = (query: Query = {}): Query => ({
    page: toBoundedInteger(query.page, "page", MAX_PAGE) ?? 1,
    perPage: toBoundedInteger(query.perPage, "perPage", MAX_PER_PAGE) ?? DEFAULT_PER_PAGE,
    slug: toText(query.slug),
    search: toSearch(query.search),
});

export const toEntryQuery = (query: EntryQuery = {}): EntryQuery => ({
    ...toQuery(query),
    term: toTerm(query.term),
    author: toText(query.author),
});

export const toSlug = (slug: string): string => {
    const text = toText(slug);

    if (!text) throw createError(new MalformedQueryError("slug", "a non-empty string"));

    return text;
};

// Out of range is rejected, not clamped
const toBoundedInteger = (
    value: number | undefined,
    param: string,
    max: number,
): number | undefined => {
    if (value === undefined) return undefined;

    if (!Number.isInteger(value) || value < 1 || value > max) {
        throw createError(new MalformedQueryError(param, `an integer between 1 and ${max}`));
    }

    return value;
};

// `search` is the one query axis whose key space is not small — bounding its length is not the same
// as bounding it, so a public deployment wants a rate limit at the edge as well.
const toSearch = (value: string | undefined): string | undefined => {
    const search = toText(value);

    if (search !== undefined && search.length > MAX_SEARCH_LENGTH) {
        throw createError(
            new MalformedQueryError("search", `at most ${MAX_SEARCH_LENGTH} characters`),
        );
    }

    return search;
};

// An unknown taxonomy is rejected rather than dropped, so a typo cannot silently return the
// unfiltered list.
const toTerm = (term: EntryQuery["term"]): EntryQuery["term"] => {
    if (!term) return undefined;

    if (!isTermResource(term.resource)) {
        throw createError(new UndefinedResourceError(term.resource, [...TERM_RESOURCES]));
    }

    const id = toText(term.id);

    if (!id) throw createError(new MalformedQueryError("term", "a taxonomy and a non-empty id"));

    return { resource: term.resource, id };
};

const toText = (value: string | undefined): string | undefined => value?.trim() || undefined;
