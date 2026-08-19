import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EventHandlerRequest, H3Event } from "h3";
import { MAX_PAGE, MAX_PER_PAGE, MAX_SEARCH_LENGTH } from "#core/domain/content";
import { ContentError, MalformedQueryError, NotFoundError, UpstreamError } from "#core/domain/errors";
import WordpressProvider from "#core/adapters/providers/wordpress/WordpressProvider";
import type { VendorConfig } from "#core/registry";

const nitro = vi.hoisted(() => ({ vendor: undefined as VendorConfig | undefined }));

vi.mock("nitropack/runtime", () => ({
    useRuntimeConfig: () => ({ content: { vendor: nitro.vendor } }),
}));

const {
    parseLocale,
    parseQuery,
    parseResource,
    parseSlug,
    readVendor,
    resolveProvider,
    rethrowAsHttpError,
    throwUnavailableError,
} = await import("./request");

function createEvent(params: Record<string, string> = {}, query = ""): H3Event<EventHandlerRequest> {
    return { context: { params }, path: `/api/content/posts${query}` } as unknown as H3Event<EventHandlerRequest>;
}

beforeEach(() => {
    nitro.vendor = { name: "wordpress", baseURL: "https://wp.test/" };
});

describe("parseResource", () => {
    it.each(["posts", "pages", "categories", "tags"])("accepts %s", (resource) => {
        expect(parseResource(createEvent({ resource }))).toBe(resource);
    });

    it.each(["media", "users", "POSTS", ""])("404s %o, naming every resource that exists", (resource) => {
        expect(() => parseResource(createEvent({ resource }))).toThrow(expect.objectContaining({ statusCode: 404 }) as Error);
        expect(() => parseResource(createEvent({ resource }))).toThrow(/posts, pages, categories, tags/);
    });

    it("404s a request with no resource at all", () => {
        expect(() => parseResource(createEvent())).toThrow(expect.objectContaining({ statusCode: 404 }) as Error);
    });
});

describe("parseSlug", () => {
    it("reads the slug out of the path", () => {
        expect(parseSlug(createEvent({ slug: "hello-world" }))).toBe("hello-world");
    });

    // A router param is the raw path segment. Left encoded, it reaches the vendor encoded a second
    // time and matches nothing.
    it.each([
        ["programaci%C3%B3n", "programación"],
        ["hello%20world", "hello world"],
        ["%E4%BD%A0%E5%A5%BD", "你好"],
    ])("decodes %s, so a non-ASCII slug reaches the vendor as itself", (param, expected) => {
        expect(parseSlug(createEvent({ slug: param }))).toBe(expected);
    });

    it("leaves an already-decoded slug alone", () => {
        expect(parseSlug(createEvent({ slug: "programación" }))).toBe("programación");
    });

    // Decoding must not become a way to 500 the route
    it.each(["100%", "%", "%zz", "%C3"])("survives %o, which is not a valid escape", (slug) => {
        expect(parseSlug(createEvent({ slug }))).toBe(slug);
    });

    it.each([undefined, "", "   "])("400s %o", (slug) => {
        const event = createEvent(slug === undefined ? {} : { slug });

        expect(() => parseSlug(event)).toThrow(expect.objectContaining({ statusCode: 400 }) as Error);
    });

    it("trims a slug, so whitespace cannot mint a cache entry of its own", () => {
        expect(parseSlug(createEvent({ slug: "  hello-world  " }))).toBe("hello-world");
    });
});

describe("parseLocale", () => {
    it("is absent when nothing asked for one", () => {
        expect(parseLocale(createEvent())).toBeUndefined();
        expect(parseLocale(createEvent({}, "?locale="))).toBeUndefined();
    });

    it.each(["en", "en-GB", "es-ES", "zh-Hans-CN"])("accepts %s", (locale) => {
        expect(parseLocale(createEvent({}, `?locale=${locale}`))).toBe(locale);
    });

    // The vendor is the authority on which locales it serves — this only keeps free text out of a key
    it.each(["en_GB", "english", "e", "<script>", "en-", "en-toolongsubtag", "12-GB"])("400s %o", (locale) => {
        const event = createEvent({}, `?locale=${encodeURIComponent(locale)}`);

        expect(() => parseLocale(event)).toThrow(expect.objectContaining({ statusCode: 400 }) as Error);
    });

    // Extension and variant chains are allowed, so the axis is bounded by shape rather than by length.
    // Worth knowing before a vendor that actually serves locales is added.
    it("accepts a chain of subtags, however long", () => {
        const chained = `en${"-ab".repeat(20)}`;

        expect(parseLocale(createEvent({}, `?locale=${chained}`))).toBe(chained);
    });
});

describe("parseQuery", () => {
    // Resolved here rather than left undefined, so `?page=1` and no page at all are one cache entry
    it("resolves the defaults every ceiling is then applied to", () => {
        expect(parseQuery(createEvent({}, ""), "posts")).toEqual({
            page: 1,
            perPage: 10,
            slug: undefined,
            search: undefined,
            locale: undefined,
            term: undefined,
        });
    });

    it("canonicalises however a number was spelled, so one page cannot hold two entries", () => {
        const canonical = parseQuery(createEvent({}, "?page=2"), "posts");

        expect(parseQuery(createEvent({}, "?page=02"), "posts")).toEqual(canonical);
        expect(parseQuery(createEvent({}, "?page=%202%20"), "posts")).toEqual(canonical);
    });

    it("treats an empty parameter as one nobody sent", () => {
        expect(parseQuery(createEvent({}, "?page=&perPage=&slug=&search="), "posts")).toEqual({
            page: 1,
            perPage: 10,
            slug: undefined,
            search: undefined,
            locale: undefined,
            term: undefined,
        });
    });

    it("accepts the ceilings themselves", () => {
        const query = parseQuery(createEvent({}, `?page=${MAX_PAGE}&perPage=${MAX_PER_PAGE}`), "posts");

        expect(query).toMatchObject({ page: MAX_PAGE, perPage: MAX_PER_PAGE });
    });

    // Out of range is rejected, not clamped: a caller asking for page 10000 wants a page that does
    // not exist, and silently answering with a different one is worse than saying so
    it.each([
        ["page", "0"],
        ["page", "-1"],
        ["page", "1.5"],
        ["page", "abc"],
        ["page", String(MAX_PAGE + 1)],
        ["perPage", "0"],
        ["perPage", String(MAX_PER_PAGE + 1)],
    ])("400s %s=%s", (param, value) => {
        const event = createEvent({}, `?${param}=${value}`);

        expect(() => parseQuery(event, "posts")).toThrow(expect.objectContaining({
            statusCode: 400,
            cause: expect.any(MalformedQueryError) as unknown,
        }) as Error);
    });

    it("trims text, so whitespace cannot mint a cache entry of its own", () => {
        expect(parseQuery(createEvent({}, "?slug=%20hello%20&search=%20budget%20"), "posts")).toMatchObject({
            slug: "hello",
            search: "budget",
        });
    });

    // Bounding a search is not the same as bounding the key space, but it is what keeps one request
    // from minting an unbounded key
    it("accepts a search at the ceiling and 400s one past it", () => {
        const atCeiling = "a".repeat(MAX_SEARCH_LENGTH);

        expect(parseQuery(createEvent({}, `?search=${atCeiling}`), "posts")).toMatchObject({ search: atCeiling });
        expect(() => parseQuery(createEvent({}, `?search=${atCeiling}a`), "posts"))
            .toThrow(expect.objectContaining({ statusCode: 400 }) as Error);
    });

    describe("the term filter", () => {
        it("parses the taxonomy and the id an entry list filters by", () => {
            expect(parseQuery(createEvent({}, "?term=categories:12"), "posts")).toMatchObject({
                term: { resource: "categories", id: "12" },
            });
        });

        it("is not an axis a term list has", () => {
            expect(parseQuery(createEvent({}, "?term=categories:12"), "categories").term).toBeUndefined();
        });

        it.each(["categories", "categories:", "12"])("400s %o, which names no id", (term) => {
            const event = createEvent({}, `?term=${encodeURIComponent(term)}`);

            expect(() => parseQuery(event, "posts")).toThrow(expect.objectContaining({ statusCode: 400 }) as Error);
        });

        // A typo cannot silently return the unfiltered list
        it.each(["authors:12", ":12"])("404s %o, which names a taxonomy the domain does not have", (term) => {
            const event = createEvent({}, `?term=${encodeURIComponent(term)}`);

            expect(() => parseQuery(event, "posts")).toThrow(expect.objectContaining({ statusCode: 404 }) as Error);
            expect(() => parseQuery(event, "posts")).toThrow(/categories, tags/);
        });
    });
});

describe("readVendor", () => {
    it("reads the vendor the module published, so no handler holds config of its own", () => {
        expect(readVendor(createEvent())).toBe(nitro.vendor);
    });
});

describe("resolveProvider", () => {
    it("builds the provider the vendor config names", async () => {
        await expect(resolveProvider(nitro.vendor!)).resolves.toBeInstanceOf(WordpressProvider);
    });

    it("500s an unregistered vendor, naming the ones that exist", async () => {
        const vendor = { name: "contentful", baseURL: "https://wp.test/" } as unknown as VendorConfig;

        await expect(resolveProvider(vendor)).rejects.toMatchObject({ statusCode: 500 });
        await expect(resolveProvider(vendor)).rejects.toThrow(/wordpress/);
    });

    // Unset env vars used to reach the vendor as an empty base URL and come back as a 502
    it("500s unset config, naming what is missing instead of blaming the vendor", async () => {
        await expect(resolveProvider({ name: "wordpress", baseURL: "" })).rejects.toMatchObject({
            statusCode: 500,
            statusMessage: expect.stringContaining("baseURL is not an absolute URL") as unknown as string,
        });
    });
});

describe("rethrowAsHttpError", () => {
    it("hands our own diagnosis to h3 with the status it settled on", () => {
        expect(() => rethrowAsHttpError(new NotFoundError("posts", "nope")))
            .toThrow(expect.objectContaining({ statusCode: 404 }) as Error);
    });

    // Anything else keeps its stack and reports as unhandled, rather than being dressed up as ours
    it("lets a failure it cannot diagnose through untouched", () => {
        const cause = new Error("adapter is broken");

        expect(() => rethrowAsHttpError(cause)).toThrow(cause);
    });
});

describe("throwUnavailableError", () => {
    // An UpstreamError already carries the status the domain settled on
    it.each([
        [404, 404],
        [401, 502],
    ])("keeps an upstream %i as a %i rather than flattening it", (upstream, expected) => {
        expect(() => throwUnavailableError(new UpstreamError(upstream), "posts"))
            .toThrow(expect.objectContaining({ statusCode: expected }) as Error);
    });

    it("reports an undiagnosed failure as a bad gateway, naming the resource and keeping the cause", () => {
        const cause = new Error("something else entirely");

        expect(() => throwUnavailableError(cause, "posts")).toThrow(expect.objectContaining({
            statusCode: 502,
            cause,
        }) as Error);
        expect(() => throwUnavailableError(cause, "posts")).toThrow(/posts/);
    });

    it("never swallows the class the domain raised", () => {
        expect(() => throwUnavailableError(new NotFoundError("posts", "nope"), "posts"))
            .toThrow(expect.objectContaining({ cause: expect.any(ContentError) as unknown }) as Error);
    });
});
