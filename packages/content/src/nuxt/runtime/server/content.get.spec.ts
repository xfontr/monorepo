import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EventHandlerRequest, H3Event } from "h3";
import type { CachedEventHandlerOptions } from "nitropack";
import { FetchError } from "ofetch";
import { contentKey } from "#core/contentKey";
import type { Entry, Page, Term } from "#core/domain/content";
import type { VendorConfig } from "#core/registry";
import { LIST_MAX_AGE, LIST_STALE_MAX_AGE } from "#nuxt/config";

type ContentPage = Page<Entry> | Page<Term>;

const nitro = vi.hoisted(() => ({
    vendor: undefined as VendorConfig | undefined,
    cache: undefined as CachedEventHandlerOptions<ContentPage> | undefined,
}));

const transport = vi.hoisted(() => ({ raw: vi.fn() }));

vi.mock("nitropack/runtime", () => ({
    defineCachedEventHandler: (handler: unknown, options: CachedEventHandlerOptions<ContentPage>) => {
        nitro.cache = options;

        return handler;
    },
    useRuntimeConfig: () => ({ content: { vendor: nitro.vendor } }),
}));

// Only the instance is replaced: FetchError stays real, since that is what the client maps a status off
vi.mock("ofetch", async (importOriginal) => ({
    ...await importOriginal<typeof import("ofetch")>(),
    ofetch: { raw: transport.raw },
}));

const handler = (await import("./content.get")).default as unknown as (event: H3Event<EventHandlerRequest>) => Promise<ContentPage>;

const entry = {
    id: 7,
    slug: "hello-world",
    title: { rendered: "Hello" },
    content: { rendered: "<p>Body</p>" },
};

function createEvent(resource = "posts", query = ""): H3Event<EventHandlerRequest> {
    return {
        context: { params: { resource } },
        path: `/api/content/${resource}${query}`,
    } as unknown as H3Event<EventHandlerRequest>;
}

function respond(data: unknown, headers: Record<string, string> = {}) {
    transport.raw.mockResolvedValue({ _data: data, headers: new Headers(headers) });
}

function upstreamStatus(status: number) {
    transport.raw.mockRejectedValue(Object.assign(new FetchError("upstream said no"), {
        response: { status } as unknown as FetchError["response"],
    }));
}

beforeEach(() => {
    vi.clearAllMocks();
    nitro.vendor = { name: "wordpress", baseURL: "https://wp.test/" };
    respond([entry], { "x-wp-total": "12", "x-wp-totalpages": "2" });
});

describe("GET /api/content/:resource", () => {
    it("serves a page of entries from the configured vendor", async () => {
        const page = await handler(createEvent("posts", "?page=2&perPage=6"));

        expect(page).toMatchObject({ page: 2, perPage: 6, total: 12, totalPages: 2 });
        expect(page.items[0]).toMatchObject({ id: "7", slug: "hello-world" });
        expect(transport.raw).toHaveBeenCalledWith("https://wp.test/wp-json/wp/v2/posts", {
            headers: undefined,
            query: {
                page: 2,
                per_page: 6,
                slug: undefined,
                search: undefined,
                _embed: "wp:featuredmedia,wp:term",
            },
        });
    });

    it("serves terms from the same route, without asking for what only an entry embeds", async () => {
        respond([{ id: 3, name: "News", slug: "news", taxonomy: "category" }]);

        const page = await handler(createEvent("categories"));

        expect(page.items[0]).toMatchObject({ id: "3", resource: "categories", name: "News" });
        expect(transport.raw).toHaveBeenCalledWith("https://wp.test/wp-json/wp/v2/categories", {
            headers: undefined,
            query: { page: 1, per_page: 10, slug: undefined, search: undefined },
        });
    });

    it("404s a resource the domain does not have, without asking the vendor for it", async () => {
        await expect(handler(createEvent("media"))).rejects.toMatchObject({ statusCode: 404 });
        expect(transport.raw).not.toHaveBeenCalled();
    });

    // The ceilings are what bound the key space of a public route, so they run before any I/O
    it.each(["?page=0", "?perPage=999", "?page=abc", "?term=authors:1"])("refuses %s without asking the vendor", async (query) => {
        await expect(handler(createEvent("posts", query))).rejects.toMatchObject({
            statusCode: expect.any(Number) as unknown as number,
        });
        expect(transport.raw).not.toHaveBeenCalled();
    });

    it("500s an unregistered vendor", async () => {
        nitro.vendor = { name: "contentful" } as unknown as VendorConfig;

        await expect(handler(createEvent())).rejects.toMatchObject({ statusCode: 500 });
        expect(transport.raw).not.toHaveBeenCalled();
    });

    // Unset env vars used to reach the vendor as an empty base URL and come back as a 502
    it("500s unset vendor config, naming what is missing instead of blaming the vendor", async () => {
        nitro.vendor = { name: "wordpress", baseURL: "" };

        await expect(handler(createEvent())).rejects.toMatchObject({
            statusCode: 500,
            statusMessage: expect.stringContaining("baseURL is not an absolute URL") as unknown as string,
        });
        expect(transport.raw).not.toHaveBeenCalled();
    });

    it("502s when the vendor cannot be reached, keeping the failure as the cause", async () => {
        const cause = new Error("connect ECONNREFUSED");
        transport.raw.mockRejectedValue(cause);

        await expect(handler(createEvent())).rejects.toMatchObject({ statusCode: 502, cause });
    });

    it("relays an upstream 404, which answers the request that was actually made", async () => {
        upstreamStatus(404);

        await expect(handler(createEvent())).rejects.toMatchObject({ statusCode: 404 });
    });

    // Our own credentials are what an upstream 401 rejects, so it must never invite the client to retry
    it.each([401, 403, 500])("reports an upstream %i as a gateway failure of ours", async (status) => {
        upstreamStatus(status);

        await expect(handler(createEvent())).rejects.toMatchObject({ statusCode: 502 });
    });

    it("never names the vendor endpoint in what it tells the client", async () => {
        transport.raw.mockRejectedValue(new Error("connect ECONNREFUSED https://wp.test/wp-json/wp/v2/posts"));

        await expect(handler(createEvent())).rejects.toMatchObject({
            statusMessage: expect.not.stringContaining("wp.test") as unknown as string,
        });
    });

    it("lets a failure it cannot diagnose through untouched, rather than blaming the vendor", async () => {
        const cause = new Error("adapter is broken");
        vi.doMock("#core/registry", () => ({ default: () => Promise.reject(cause) }));
        vi.resetModules();

        const broken = (await import("./content.get")).default as unknown as (event: H3Event<EventHandlerRequest>) => Promise<ContentPage>;

        await expect(broken(createEvent())).rejects.toBe(cause);

        vi.doUnmock("#core/registry");
        vi.resetModules();
    });
});

// Key derivation itself lives in core and is covered by core/contentKey.spec.ts
describe("the list cache", () => {
    it("keys entries off the vendor, the resource and the parsed query", () => {
        const key = nitro.cache?.getKey?.(createEvent("posts", "?page=2&perPage=6"));

        expect(key).toBe(contentKey(nitro.vendor!, "posts", {
            page: 2,
            perPage: 6,
            slug: undefined,
            search: undefined,
            term: undefined,
        }));
    });

    // Keyed off the parsed query, so the defaults are resolved before the key exists
    it.each(["", "?page=1", "?page=01", "?page=1&perPage=10"])("gives %o the same entry as the first page", (query) => {
        expect(nitro.cache?.getKey?.(createEvent("posts", query))).toBe(nitro.cache?.getKey?.(createEvent("posts")));
    });

    it("separates the resources of one vendor", () => {
        expect(nitro.cache?.getKey?.(createEvent("posts"))).not.toBe(nitro.cache?.getKey?.(createEvent("pages")));
    });

    // The key is derived before the handler runs, so this is what stops a bad request minting an entry
    it.each(["media", "posts?page=0", "posts?term=authors:1"])("refuses to key %o", (path) => {
        const [resource = "posts", query] = path.split("?");

        expect(() => nitro.cache?.getKey?.(createEvent(resource, query && `?${query}`)))
            .toThrow(expect.objectContaining({ statusCode: expect.any(Number) as unknown }) as Error);
    });

    it("caches outside of dev", () => {
        expect(nitro.cache?.shouldBypassCache?.(createEvent())).toBe(false);
    });

    it("holds a list for the window the config declares, and serves it stale for longer", () => {
        expect(nitro.cache).toMatchObject({
            name: "content-list",
            group: "content",
            maxAge: LIST_MAX_AGE,
            staleMaxAge: LIST_STALE_MAX_AGE,
        });
        expect(LIST_STALE_MAX_AGE).toBeGreaterThan(LIST_MAX_AGE);
    });
});
