import { describe, expect, it } from "vitest";
import { MAX_PAGE, MAX_SEARCH_LENGTH } from "#core/domain/content";
import { MalformedQueryError } from "#core/domain/errors";
import { toBoundedInteger, toLocale, toResource, toSearch, toSlug, toTerm, toText } from "./parsing";

describe("toResource", () => {
    it.each(["posts", "pages", "categories", "tags"])("accepts %s", (resource) => {
        expect(toResource(resource)).toBe(resource);
    });

    it.each(["media", "users", "POSTS", ""])("404s %o, naming every resource that exists", (resource) => {
        expect(() => toResource(resource)).toThrow(expect.objectContaining({ statusCode: 404 }) as Error);
        expect(() => toResource(resource)).toThrow(/posts, pages, categories, tags/);
    });

    it("404s no resource at all", () => {
        expect(() => toResource(undefined)).toThrow(expect.objectContaining({ statusCode: 404 }) as Error);
    });
});

describe("toSlug", () => {
    it("passes a non-empty slug through", () => {
        expect(toSlug("hello-world")).toBe("hello-world");
    });

    it.each([undefined, "", "   "])("400s %o", (slug) => {
        expect(() => toSlug(slug)).toThrow(expect.objectContaining({ statusCode: 400 }) as Error);
    });

    it("trims a slug, so whitespace cannot mint a cache entry of its own", () => {
        expect(toSlug("  hello-world  ")).toBe("hello-world");
    });
});

describe("toLocale", () => {
    it("is absent when nothing asked for one", () => {
        expect(toLocale(undefined)).toBeUndefined();
        expect(toLocale("")).toBeUndefined();
    });

    it.each(["en", "en-GB", "es-ES", "zh-Hans-CN"])("accepts %s", (locale) => {
        expect(toLocale(locale)).toBe(locale);
    });

    // The vendor is the authority on which locales it serves — this only keeps free text out of a key
    it.each(["en_GB", "english", "e", "<script>", "en-", "en-toolongsubtag", "12-GB"])("400s %o", (locale) => {
        expect(() => toLocale(locale)).toThrow(expect.objectContaining({ statusCode: 400 }) as Error);
    });

    // Extension and variant chains are allowed, so the axis is bounded by shape rather than by length.
    // Worth knowing before a vendor that actually serves locales is added.
    it("accepts a chain of subtags, however long", () => {
        const chained = `en${"-ab".repeat(20)}`;

        expect(toLocale(chained)).toBe(chained);
    });
});

describe("toBoundedInteger", () => {
    it("resolves nothing when the value is absent", () => {
        expect(toBoundedInteger(undefined, "page", MAX_PAGE)).toBeUndefined();
    });

    it("canonicalises however a number was spelled", () => {
        expect(toBoundedInteger("02", "page", MAX_PAGE)).toBe(2);
        expect(toBoundedInteger(" 2 ", "page", MAX_PAGE)).toBe(2);
    });

    it("accepts the ceiling itself", () => {
        expect(toBoundedInteger(String(MAX_PAGE), "page", MAX_PAGE)).toBe(MAX_PAGE);
    });

    // Out of range is rejected, not clamped: a caller asking for page 10000 wants a page that does
    // not exist, and silently answering with a different one is worse than saying so
    it.each(["0", "-1", "1.5", "abc", String(MAX_PAGE + 1)])("400s %o", (value) => {
        expect(() => toBoundedInteger(value, "page", MAX_PAGE)).toThrow(expect.objectContaining({
            statusCode: 400,
            cause: expect.any(MalformedQueryError) as unknown,
        }) as Error);
    });
});

describe("toSearch", () => {
    it("passes text under the ceiling through", () => {
        expect(toSearch("budget")).toBe("budget");
    });

    // Bounding a search is not the same as bounding the key space, but it is what keeps one request
    // from minting an unbounded key
    it("accepts a search at the ceiling and 400s one past it", () => {
        const atCeiling = "a".repeat(MAX_SEARCH_LENGTH);

        expect(toSearch(atCeiling)).toBe(atCeiling);
        expect(() => toSearch(`${atCeiling}a`)).toThrow(expect.objectContaining({ statusCode: 400 }) as Error);
    });
});

describe("toTerm", () => {
    it("is absent when nothing asked for one", () => {
        expect(toTerm(undefined)).toBeUndefined();
    });

    it("parses the taxonomy and the id an entry list filters by", () => {
        expect(toTerm("categories:12")).toEqual({ resource: "categories", id: "12" });
    });

    it.each(["categories", "categories:", "12"])("400s %o, which names no id", (term) => {
        expect(() => toTerm(term)).toThrow(expect.objectContaining({ statusCode: 400 }) as Error);
    });

    // A typo cannot silently return the unfiltered list
    it.each(["authors:12", ":12"])("404s %o, which names a taxonomy the domain does not have", (term) => {
        expect(() => toTerm(term)).toThrow(expect.objectContaining({ statusCode: 404 }) as Error);
        expect(() => toTerm(term)).toThrow(/categories, tags/);
    });
});

describe("toText", () => {
    it("trims text and treats blank as absent", () => {
        expect(toText("  hello  ")).toBe("hello");
        expect(toText("   ")).toBeUndefined();
        expect(toText(undefined)).toBeUndefined();
    });
});
