import { describe, expect, it } from "vitest";
import {
    DEFAULT_PER_PAGE,
    ENTRY_RESOURCES,
    isEntryResource,
    isTermResource,
    MAX_PAGE,
    MAX_PER_PAGE,
    MAX_SEARCH_LENGTH,
    TERM_RESOURCES,
} from "./content";

describe("resource guards", () => {
    it.each(ENTRY_RESOURCES)("recognises %s as an entry resource and nothing else", (resource) => {
        expect(isEntryResource(resource)).toBe(true);
        expect(isTermResource(resource)).toBe(false);
    });

    it.each(TERM_RESOURCES)("recognises %s as a term resource and nothing else", (resource) => {
        expect(isTermResource(resource)).toBe(true);
        expect(isEntryResource(resource)).toBe(false);
    });

    // The route picks the provider method by asking both, so an overlap would make one family unreachable
    it("keeps the two families disjoint", () => {
        const terms: readonly string[] = TERM_RESOURCES;

        expect(ENTRY_RESOURCES.filter((resource) => terms.includes(resource))).toEqual([]);
    });

    // A resource reaches these straight from the URL, so anything not in the list has to fall through
    it.each([undefined, "", "  ", "POSTS", "post", "media", "../posts", "posts/1"])("rejects %o", (resource) => {
        expect(isEntryResource(resource)).toBe(false);
        expect(isTermResource(resource)).toBe(false);
    });
});

describe("query ceilings", () => {
    it("defaults to a page size the contract allows", () => {
        expect(DEFAULT_PER_PAGE).toBeLessThanOrEqual(MAX_PER_PAGE);
    });

    // They bound the cache key space of a public route, so a ceiling that is absent or huge is the bug
    it.each([
        ["MAX_PAGE", MAX_PAGE],
        ["MAX_PER_PAGE", MAX_PER_PAGE],
        ["MAX_SEARCH_LENGTH", MAX_SEARCH_LENGTH],
    ])("bounds %s to a finite positive integer", (_, ceiling) => {
        expect(Number.isInteger(ceiling)).toBe(true);
        expect(ceiling).toBeGreaterThan(0);
    });
});
