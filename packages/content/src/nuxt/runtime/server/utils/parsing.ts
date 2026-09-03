import { createError } from "h3";
import type { EntryQuery, Resource } from "#core/domain/content";
import {
    ENTRY_RESOURCES,
    isEntryResource,
    isTermResource,
    MAX_SEARCH_LENGTH,
    TERM_RESOURCES,
} from "#core/domain/content";
import { MalformedQueryError, UndefinedResourceError } from "#core/domain/errors";

export function toResource(resource: string | undefined): Resource {
    if (!isEntryResource(resource) && !isTermResource(resource)) {
        throw createError(new UndefinedResourceError(resource, [...ENTRY_RESOURCES, ...TERM_RESOURCES]));
    }

    return resource;
}

export function toSlug(slug: string | undefined): string {
    const text = toText(slug);

    if (!text) throw createError(new MalformedQueryError("slug", "a non-empty string"));

    return text;
}

// Out of range is rejected, not clamped
export function toBoundedInteger(value: unknown, param: string, max: number): number | undefined {
    const text = toText(value);

    if (text === undefined) return undefined;

    const parsed = Number(text);

    if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) {
        throw createError(new MalformedQueryError(param, `an integer between 1 and ${max}`));
    }

    return parsed;
}

// `search` is the one query axis whose key space is not small — bounding its length is not the same
// as bounding it, so a public deployment wants a rate limit at the edge as well.
export function toSearch(value: unknown): string | undefined {
    const search = toText(value);

    if (search !== undefined && search.length > MAX_SEARCH_LENGTH) {
        throw createError(new MalformedQueryError("search", `at most ${MAX_SEARCH_LENGTH} characters`));
    }

    return search;
}

// `term=categories:12`. An unknown taxonomy is rejected rather than dropped, so a typo cannot
// silently return the unfiltered list.
export function toTerm(value: unknown): EntryQuery["term"] {
    const term = toText(value);

    if (!term) return undefined;

    const [resource, id] = term.split(":");

    if (!id) throw createError(new MalformedQueryError("term", "<taxonomy>:<id>"));

    if (!isTermResource(resource)) {
        throw createError(new UndefinedResourceError(resource, [...TERM_RESOURCES]));
    }

    return { resource, id };
}

export function toText(value: unknown): string | undefined {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
