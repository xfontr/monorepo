import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EventHandlerRequest, H3Event } from "h3";
import { MAX_PAGE, MAX_PER_PAGE } from "#core/domain/content";
import { ContentError, NotFoundError, UpstreamError } from "#core/domain/errors";
import WordpressProvider from "#core/adapters/providers/wordpress/WordpressProvider";
import type { VendorConfig } from "#core/registry";

const nitro = vi.hoisted(() => ({ vendor: undefined as VendorConfig | undefined }));

vi.mock("nitropack/runtime", () => ({
    useRuntimeConfig: () => ({ content: { vendor: nitro.vendor } }),
}));

const {
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
    it("reads the resource off the route", () => {
        expect(parseResource(createEvent({ resource: "posts" }))).toBe("posts");
    });

    // Full acceptance/rejection shape lives in parsing.spec.ts's toResource
    it("404s a request with no resource at all", () => {
        expect(() => parseResource(createEvent())).toThrow(expect.objectContaining({ statusCode: 404 }) as Error);
    });
});

describe("parseSlug", () => {
    it("reads the slug out of the path", () => {
        expect(parseSlug(createEvent({ slug: "hello-world" }))).toBe("hello-world");
    });

    // A router param is the raw path segment. Left encoded, it reaches the vendor encoded a second
    // time and matches nothing. This is `request.ts`'s own concern — `{ decode: true }` is passed
    // here, not inside toSlug.
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
});

describe("parseQuery", () => {
    // Resolved here rather than left undefined, so `?page=1` and no page at all are one cache entry
    it("resolves the defaults every ceiling is then applied to", () => {
        expect(parseQuery(createEvent({}, ""), "posts")).toEqual({
            page: 1,
            perPage: 10,
            slug: undefined,
            search: undefined,
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
            term: undefined,
        });
    });

    // Pins that each field is wired to its own ceiling — MAX_PAGE and MAX_PER_PAGE are far enough
    // apart (1000 vs 50) that a swap would throw here instead of silently passing
    it("accepts the ceilings themselves", () => {
        const query = parseQuery(createEvent({}, `?page=${MAX_PAGE}&perPage=${MAX_PER_PAGE}`), "posts");

        expect(query).toMatchObject({ page: MAX_PAGE, perPage: MAX_PER_PAGE });
    });

    it("trims text, so whitespace cannot mint a cache entry of its own", () => {
        expect(parseQuery(createEvent({}, "?slug=%20hello%20&search=%20budget%20"), "posts")).toMatchObject({
            slug: "hello",
            search: "budget",
        });
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
