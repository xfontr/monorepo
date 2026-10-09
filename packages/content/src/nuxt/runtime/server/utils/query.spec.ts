import { describe, expect, it } from "vitest";
import { DEFAULT_PER_PAGE, MAX_PAGE, MAX_PER_PAGE, MAX_SEARCH_LENGTH } from "#core/domain/content";
import { MalformedQueryError, UndefinedResourceError } from "#core/domain/errors";
import { toEntryQuery, toQuery, toSlug } from "./query";

describe("toQuery", () => {
    it("resolves the defaults every ceiling is then applied to", () => {
        expect(toQuery()).toEqual({ page: 1, perPage: DEFAULT_PER_PAGE, slug: undefined, search: undefined });
        expect(toQuery({ page: 1, perPage: DEFAULT_PER_PAGE })).toEqual(toQuery());
    });

    it("keeps the page that was asked for", () => {
        expect(toQuery({ page: 2, perPage: 6 })).toMatchObject({ page: 2, perPage: 6 });
    });

    // MAX_PAGE and MAX_PER_PAGE are far enough apart (1000 vs 50) that a swap would throw here
    it("accepts the ceilings themselves", () => {
        expect(toQuery({ page: MAX_PAGE, perPage: MAX_PER_PAGE })).toMatchObject({ page: MAX_PAGE, perPage: MAX_PER_PAGE });
    });

    it.each([
        ["page", { page: 0 }],
        ["page", { page: -1 }],
        ["page", { page: 1.5 }],
        ["page", { page: Number.NaN }],
        ["page", { page: MAX_PAGE + 1 }],
        ["perPage", { perPage: MAX_PER_PAGE + 1 }],
    ])("400s a %s of %o", (_, query) => {
        expect(() => toQuery(query)).toThrow(expect.objectContaining({
            statusCode: 400,
            cause: expect.any(MalformedQueryError) as unknown,
        }) as Error);
    });

    it("trims text and treats an empty string as nothing sent, so neither mints an entry of its own", () => {
        expect(toQuery({ slug: " hello ", search: " budget " })).toMatchObject({ slug: "hello", search: "budget" });
        expect(toQuery({ slug: "", search: "   " })).toMatchObject({ slug: undefined, search: undefined });
    });

    it("accepts a search at the ceiling and 400s one past it", () => {
        const atCeiling = "a".repeat(MAX_SEARCH_LENGTH);

        expect(toQuery({ search: atCeiling }).search).toBe(atCeiling);
        expect(() => toQuery({ search: `${atCeiling}a` })).toThrow(expect.objectContaining({ statusCode: 400 }) as Error);
    });

    it("has no term or author axis, since a term list cannot be filtered by either", () => {
        const query = toQuery({ term: { resource: "categories", id: "12" }, author: "3" } as never);

        expect(query).not.toHaveProperty("term");
        expect(query).not.toHaveProperty("author");
    });
});

describe("toEntryQuery", () => {
    // A dropped filter would be cached under the value that was asked for, listing the whole archive
    it("keeps the term and the author an entry list filters by", () => {
        expect(toEntryQuery({ term: { resource: "categories", id: " 12 " }, author: " 3 " })).toMatchObject({
            term: { resource: "categories", id: "12" },
            author: "3",
        });
    });

    it("404s a taxonomy the domain does not have, naming the ones it does", () => {
        const query = { term: { resource: "authors", id: "1" } } as never;

        expect(() => toEntryQuery(query)).toThrow(expect.objectContaining({
            statusCode: 404,
            cause: expect.any(UndefinedResourceError) as unknown,
        }) as Error);
        expect(() => toEntryQuery(query)).toThrow(/categories, tags/);
    });

    it("400s a term with no id rather than listing every entry", () => {
        expect(() => toEntryQuery({ term: { resource: "tags", id: " " } }))
            .toThrow(expect.objectContaining({ statusCode: 400 }) as Error);
    });
});

describe("toSlug", () => {
    it("trims a slug, so whitespace cannot mint a cache entry of its own", () => {
        expect(toSlug("  hello-world  ")).toBe("hello-world");
    });

    it.each(["", "   "])("400s %o", (slug) => {
        expect(() => toSlug(slug)).toThrow(expect.objectContaining({ statusCode: 400 }) as Error);
    });
});
