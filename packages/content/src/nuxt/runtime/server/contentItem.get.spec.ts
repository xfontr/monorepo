import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EventHandlerRequest, H3Event } from "h3";
import type { CachedEventHandlerOptions } from "nitropack";
import { contentKey } from "#core/contentKey";
import type { Entry, Term } from "#core/domain/content";
import type { VendorConfig } from "#core/registry";
import { ITEM_MAX_AGE, ITEM_STALE_MAX_AGE } from "#nuxt/config";

const nitro = vi.hoisted(() => ({
    vendor: undefined as VendorConfig | undefined,
    cache: undefined as CachedEventHandlerOptions<Entry | Term> | undefined,
}));

const transport = vi.hoisted(() => ({ raw: vi.fn() }));

vi.mock("nitropack/runtime", () => ({
    defineCachedEventHandler: (handler: unknown, options: CachedEventHandlerOptions<Entry | Term>) => {
        nitro.cache = options;

        return handler;
    },
    useRuntimeConfig: () => ({ content: { vendor: nitro.vendor } }),
}));

vi.mock("ofetch", async (importOriginal) => ({
    ...await importOriginal<typeof import("ofetch")>(),
    ofetch: { raw: transport.raw },
}));

const handler = (await import("./contentItem.get")).default as unknown as (event: H3Event<EventHandlerRequest>) => Promise<Entry | Term>;

const entry = {
    id: 7,
    slug: "hello-world",
    title: { rendered: "Hello" },
    content: { rendered: "<p>Body</p>" },
};

function createEvent(slug: string | undefined, resource = "posts", query = ""): H3Event<EventHandlerRequest> {
    return {
        context: { params: slug === undefined ? { resource } : { resource, slug } },
        path: `/api/content/${resource}/${slug ?? ""}${query}`,
    } as unknown as H3Event<EventHandlerRequest>;
}

function respond(data: unknown) {
    transport.raw.mockResolvedValue({ _data: data, headers: new Headers() });
}

function requestedQuery(): unknown {
    return transport.raw.mock.calls[0]?.[1] as unknown;
}

beforeEach(() => {
    vi.clearAllMocks();
    nitro.vendor = { name: "wordpress", baseURL: "https://wp.test/" };
    respond([entry]);
});

describe("GET /api/content/:resource/:slug", () => {
    // WordPress has no single-document endpoint, so the inherited one-item list is what serves this
    it("serves the one entry the slug names", async () => {
        await expect(handler(createEvent("hello-world"))).resolves.toMatchObject({ id: "7", slug: "hello-world" });

        expect(transport.raw).toHaveBeenCalledWith("https://wp.test/wp-json/wp/v2/posts", {
            headers: undefined,
            query: {
                page: undefined,
                per_page: 1,
                slug: "hello-world",
                search: undefined,
                _embed: "wp:featuredmedia,wp:term",
            },
        });
    });

    it("serves a term by slug from the same route", async () => {
        respond([{ id: 3, name: "News", slug: "news", taxonomy: "category" }]);

        await expect(handler(createEvent("news", "categories"))).resolves.toMatchObject({ id: "3", resource: "categories" });
    });

    // A router param arrives as the raw path segment. Left encoded, it would reach WordPress encoded
    // a second time and match nothing.
    it.each([
        ["programaci%C3%B3n", "programación"],
        ["hello%20world", "hello world"],
    ])("asks the vendor for %s as %s", async (param, decoded) => {
        respond([{ ...entry, slug: decoded }]);

        await handler(createEvent(param));

        expect(requestedQuery()).toMatchObject({ query: { slug: decoded } });
    });

    // The miss is answered here rather than in the composable, so it renders as a real error page
    it("404s a slug that matches nothing", async () => {
        respond([]);

        await expect(handler(createEvent("nope"))).rejects.toMatchObject({ statusCode: 404 });
    });

    it.each([undefined, "", "%20"])("400s %o as a slug, without asking the vendor", async (slug) => {
        await expect(handler(createEvent(slug))).rejects.toMatchObject({ statusCode: 400 });
        expect(transport.raw).not.toHaveBeenCalled();
    });

    it("502s when the vendor cannot be reached, keeping the failure as the cause", async () => {
        const cause = new Error("connect ECONNREFUSED");
        transport.raw.mockRejectedValue(cause);

        await expect(handler(createEvent("hello-world"))).rejects.toMatchObject({ statusCode: 502, cause });
    });
});

describe("the item cache", () => {
    // The slug is the whole identity of a single document
    it("keys entries off the vendor, the resource and the slug", () => {
        const key = nitro.cache?.getKey?.(createEvent("hello-world"));

        expect(key).toBe(contentKey(nitro.vendor!, "posts", { slug: "hello-world" }));
    });

    it("keys the decoded slug, so the entry matches the document that was fetched", () => {
        expect(nitro.cache?.getKey?.(createEvent("programaci%C3%B3n")))
            .toBe(contentKey(nitro.vendor!, "posts", { slug: "programación" }));
    });

    // Page size cannot fragment a document that has only one of itself
    it("ignores the paging axes a list would key", () => {
        expect(nitro.cache?.getKey?.(createEvent("hello-world", "posts", "?page=3&perPage=50")))
            .toBe(nitro.cache?.getKey?.(createEvent("hello-world")));
    });

    it("separates two documents, and the same slug under two resources", () => {
        const key = nitro.cache?.getKey?.(createEvent("hello-world"));

        expect(key).not.toBe(nitro.cache?.getKey?.(createEvent("other")));
        expect(key).not.toBe(nitro.cache?.getKey?.(createEvent("hello-world", "pages")));
    });

    it("refuses to key a request with no slug", () => {
        expect(() => nitro.cache?.getKey?.(createEvent(undefined)))
            .toThrow(expect.objectContaining({ statusCode: 400 }) as Error);
    });

    it("caches outside of dev", () => {
        expect(nitro.cache?.shouldBypassCache?.(createEvent("hello-world"))).toBe(false);
    });

    // A document addressed by slug stays valid far longer than a list a new entry reorders
    it("holds a document for longer than the list it appears in", () => {
        expect(nitro.cache).toMatchObject({
            name: "content-item",
            group: "content",
            maxAge: ITEM_MAX_AGE,
            staleMaxAge: ITEM_STALE_MAX_AGE,
        });
        expect(ITEM_STALE_MAX_AGE).toBeGreaterThan(ITEM_MAX_AGE);
    });
});
