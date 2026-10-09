import { beforeEach, describe, expect, it, vi } from "vitest";
import type { H3Event } from "h3";
import type { CacheOptions } from "nitropack/types";
import { FetchError } from "ofetch";
import { contentKey } from "#core/contentKey";
import type { VendorConfig } from "#core/registry";
import { ITEM_MAX_AGE, ITEM_STALE_MAX_AGE, LIST_MAX_AGE, LIST_STALE_MAX_AGE } from "#nuxt/config";

const nitro = vi.hoisted(() => ({
    vendor: undefined as VendorConfig | undefined,
    caches: {} as Record<string, CacheOptions>,
    calls: [] as { name: string; key: string; event: unknown }[],
}));

const transport = vi.hoisted(() => ({ raw: vi.fn() }));

// Each cached function records the key Nitro would store it under, then runs uncached
vi.mock("nitropack/runtime", () => ({
    defineCachedFunction: (fn: (...args: unknown[]) => unknown, options: CacheOptions) => {
        nitro.caches[options.name!] = options;

        return async (...args: unknown[]) => {
            nitro.calls.push({
                name: options.name!,
                key: await options.getKey!(...args),
                event: args[0],
            });

            return fn(...args);
        };
    },
    useRuntimeConfig: () => ({ content: { vendor: nitro.vendor } }),
}));

// Only the instance is replaced: FetchError stays real, since that is what the client maps a status off
vi.mock("ofetch", async (importOriginal) => ({
    ...(await importOriginal<typeof import("ofetch")>()),
    ofetch: { raw: transport.raw },
}));

const { useContent } = await import("./useContent");

const EVENT = { context: {} } as H3Event;

const ENTRY = {
    id: 7,
    slug: "hello-world",
    title: { rendered: "Hello" },
    content: { rendered: "<p>Body</p>" },
};

const respond = (data: unknown, headers: Record<string, string> = {}) => {
    transport.raw.mockResolvedValue({ _data: data, headers: new Headers(headers) });
};

const upstreamStatus = (status: number) => {
    transport.raw.mockRejectedValue(
        Object.assign(new FetchError("upstream said no"), {
            response: { status } as unknown as FetchError["response"],
        }),
    );
};

const keyOf = (name: string): string | undefined =>
    nitro.calls.filter((call) => call.name === name).at(-1)?.key;

beforeEach(() => {
    vi.clearAllMocks();
    nitro.calls = [];
    nitro.vendor = { name: "wordpress", baseURL: "https://wp.test/" };
    respond([ENTRY], { "x-wp-total": "12", "x-wp-totalpages": "2" });
});

describe("useContent", () => {
    it("lists entries from the configured vendor", async () => {
        const page = await useContent(EVENT).listEntries("posts", {
            page: 2,
            perPage: 6,
            term: { resource: "categories", id: "12" },
        });

        expect(page).toMatchObject({ page: 2, perPage: 6, total: 12, totalPages: 2 });
        expect(page.items[0]).toMatchObject({ id: "7", slug: "hello-world" });
        expect(transport.raw).toHaveBeenCalledWith("https://wp.test/wp-json/wp/v2/posts", {
            headers: undefined,
            query: expect.objectContaining({ page: 2, per_page: 6, categories: "12" }) as unknown,
        });
    });

    it("lists terms without asking for what only an entry embeds", async () => {
        respond([{ id: 3, name: "News", slug: "news", taxonomy: "category" }]);

        const page = await useContent(EVENT).listTerms("categories");

        expect(page.items[0]).toMatchObject({ id: "3", resource: "categories", name: "News" });
        expect(transport.raw).toHaveBeenCalledWith("https://wp.test/wp-json/wp/v2/categories", {
            headers: undefined,
            query: { page: 1, per_page: 10, slug: undefined, search: undefined },
        });
    });

    // WordPress has no single-document endpoint, so the inherited one-item list is what serves this
    it("gets the one entry a slug names", async () => {
        await expect(useContent(EVENT).getEntry("posts", "hello-world")).resolves.toMatchObject({
            id: "7",
            slug: "hello-world",
        });

        expect(transport.raw).toHaveBeenCalledWith("https://wp.test/wp-json/wp/v2/posts", {
            headers: undefined,
            query: expect.objectContaining({ per_page: 1, slug: "hello-world" }) as unknown,
        });
    });

    it("gets a term by slug", async () => {
        respond([{ id: 3, name: "News", slug: "news", taxonomy: "category" }]);

        await expect(useContent(EVENT).getTerm("categories", "news")).resolves.toMatchObject({
            id: "3",
            resource: "categories",
        });
    });

    it("404s a slug that matches nothing", async () => {
        respond([]);

        await expect(useContent(EVENT).getEntry("posts", "nope")).rejects.toMatchObject({
            statusCode: 404,
        });
    });

    it.each([
        ["page 0", () => useContent(EVENT).listEntries("posts", { page: 0 })],
        [
            "a page that is not a number",
            () => useContent(EVENT).listEntries("posts", { page: Number.NaN }),
        ],
        ["perPage 999", () => useContent(EVENT).listTerms("tags", { perPage: 999 })],
        [
            "an unknown taxonomy",
            () =>
                useContent(EVENT).listEntries("posts", {
                    term: { resource: "authors", id: "1" },
                } as never),
        ],
        ["an empty slug", () => useContent(EVENT).getEntry("posts", " ")],
    ])("refuses %s without keying it or asking the vendor", async (_, read) => {
        await expect(read()).rejects.toMatchObject({
            statusCode: expect.any(Number) as unknown as number,
        });
        expect(nitro.calls).toEqual([]);
        expect(transport.raw).not.toHaveBeenCalled();
    });

    it("500s an unregistered vendor, naming the ones that exist", async () => {
        nitro.vendor = { name: "contentful" } as unknown as VendorConfig;

        await expect(useContent(EVENT).listEntries("posts")).rejects.toMatchObject({
            statusCode: 500,
        });
        await expect(useContent(EVENT).listEntries("posts")).rejects.toThrow(/wordpress/);
        expect(transport.raw).not.toHaveBeenCalled();
    });

    // Unset env vars used to reach the vendor as an empty base URL and come back as a 502
    it("500s unset vendor config, naming what is missing instead of blaming the vendor", async () => {
        nitro.vendor = { name: "wordpress", baseURL: "" };

        await expect(useContent(EVENT).getEntry("posts", "hello-world")).rejects.toMatchObject({
            statusCode: 500,
            statusMessage: expect.stringContaining(
                "baseURL is not an absolute URL",
            ) as unknown as string,
        });
        expect(transport.raw).not.toHaveBeenCalled();
    });

    it("502s when the vendor cannot be reached, keeping the failure as the cause", async () => {
        const cause = new Error("connect ECONNREFUSED");
        transport.raw.mockRejectedValue(cause);

        await expect(useContent(EVENT).listEntries("posts")).rejects.toMatchObject({
            statusCode: 502,
            cause,
        });
    });

    it("relays an upstream 404, which answers the request that was actually made", async () => {
        upstreamStatus(404);

        await expect(useContent(EVENT).listEntries("posts")).rejects.toMatchObject({
            statusCode: 404,
        });
    });

    // Our own credentials are what an upstream 401 rejects, so it must never invite a retry with others
    it.each([401, 403, 500])(
        "reports an upstream %i as a gateway failure of ours",
        async (status) => {
            upstreamStatus(status);

            await expect(useContent(EVENT).getEntry("posts", "hello-world")).rejects.toMatchObject({
                statusCode: 502,
            });
        },
    );

    it("never names the vendor endpoint in the status it settles on", async () => {
        transport.raw.mockRejectedValue(
            new Error("connect ECONNREFUSED https://wp.test/wp-json/wp/v2/posts"),
        );

        await expect(useContent(EVENT).listEntries("posts")).rejects.toMatchObject({
            statusMessage: expect.not.stringContaining("wp.test") as unknown as string,
        });
    });

    it("lets a failure it cannot diagnose through untouched, rather than blaming the vendor", async () => {
        const cause = new Error("adapter is broken");
        vi.doMock("#core/registry", () => ({ default: () => Promise.reject(cause) }));
        vi.resetModules();

        const broken = (await import("./useContent")).useContent;

        await expect(broken(EVENT).listEntries("posts")).rejects.toBe(cause);

        vi.doUnmock("#core/registry");
        vi.resetModules();
    });
});

// Key derivation itself lives in core and is covered by core/contentKey.spec.ts
describe("the list cache", () => {
    it("keys off the vendor, the resource and the normalised query", async () => {
        await useContent(EVENT).listEntries("posts", { page: 2, perPage: 6 });

        expect(keyOf("content-list")).toBe(
            contentKey(nitro.vendor!, "posts", { page: 2, perPage: 6 }),
        );
    });

    it.each([{}, { page: 1 }, { page: 1, perPage: 10 }, { search: "  " }])(
        "gives %o the same entry as the first page",
        async (query) => {
            await useContent(EVENT).listEntries("posts");
            const firstPage = keyOf("content-list");

            await useContent(EVENT).listEntries("posts", query);

            expect(keyOf("content-list")).toBe(firstPage);
        },
    );

    it("separates the resources of one vendor, and one filter from another", async () => {
        await useContent(EVENT).listEntries("posts");
        const posts = keyOf("content-list");

        await useContent(EVENT).listEntries("pages");
        expect(keyOf("content-list")).not.toBe(posts);

        await useContent(EVENT).listEntries("posts", {
            term: { resource: "categories", id: "12" },
        });
        expect(keyOf("content-list")).not.toBe(posts);
    });

    it("hands the cache the request, so a stale refresh can outlive the response", async () => {
        await useContent(EVENT).listEntries("posts");

        expect(nitro.calls[0]?.event).toBe(EVENT);
    });

    it("caches outside of dev, for the windows the config declares", () => {
        expect(nitro.caches["content-list"]?.shouldBypassCache?.()).toBe(false);
        expect(nitro.caches["content-list"]).toMatchObject({
            group: "content",
            maxAge: LIST_MAX_AGE,
            staleMaxAge: LIST_STALE_MAX_AGE,
        });
        expect(LIST_STALE_MAX_AGE).toBeGreaterThan(LIST_MAX_AGE);
    });
});

describe("the item cache", () => {
    // The slug is the whole identity of a single document, so nothing else can fragment it
    it("keys off the vendor, the resource and the trimmed slug", async () => {
        await useContent(EVENT).getEntry("posts", " hello-world ");

        expect(keyOf("content-item")).toBe(
            contentKey(nitro.vendor!, "posts", { slug: "hello-world" }),
        );
    });

    it("separates the same slug under two resources", async () => {
        await useContent(EVENT).getEntry("posts", "hello-world");
        const post = keyOf("content-item");

        await useContent(EVENT).getEntry("pages", "hello-world");

        expect(keyOf("content-item")).not.toBe(post);
    });

    // A document addressed by slug stays valid far longer than a list a new entry reorders
    it("holds a document for longer than the list it appears in", () => {
        expect(nitro.caches["content-item"]?.shouldBypassCache?.()).toBe(false);
        expect(nitro.caches["content-item"]).toMatchObject({
            group: "content",
            maxAge: ITEM_MAX_AGE,
            staleMaxAge: ITEM_STALE_MAX_AGE,
        });
        expect(ITEM_MAX_AGE).toBeGreaterThan(LIST_MAX_AGE);
    });
});
