import { beforeEach, describe, expect, it, vi } from "vitest";
import WordpressProvider from "./WordpressProvider";
import type { HttpClient } from "#core/ports/HttpClient";
import { MisconfiguredVendorError, UnsupportedQueryError } from "#core/domain/errors";

const get = vi.fn();
const http: HttpClient = { get };

const POSTS_URL = "https://wp.test/wp-json/wp/v2/posts";

const entry = {
    id: 7,
    slug: "hello-world",
    title: { rendered: "Hello World" },
    content: { rendered: "<p>Body</p>" },
};

function respond(data: unknown, headers: Record<string, string> = {}) {
    get.mockResolvedValue({ data, headers: new Headers(headers) });
}

function build(baseURL = "https://wp.test") {
    return new WordpressProvider({ baseURL }, http);
}

function requestedUrl(): unknown {
    return get.mock.calls[0]?.[0] as unknown;
}

beforeEach(() => {
    vi.clearAllMocks();
    respond([entry]);
});

describe("WordpressProvider", () => {
    describe("addressing the vendor", () => {
        it("asks the WordPress REST API for the resource, embedding media and terms in one round trip", async () => {
            await build().listEntries("posts");

            expect(get).toHaveBeenCalledWith(POSTS_URL, {
                query: {
                    page: undefined,
                    per_page: 10,
                    slug: undefined,
                    search: undefined,
                    _embed: "wp:featuredmedia,wp:term",
                },
            });
        });

        // new URL() against the site root would discard "/blog"
        it("keeps the path of a subdirectory install", async () => {
            await build("https://wp.test/blog").listEntries("posts");

            expect(requestedUrl()).toBe("https://wp.test/blog/wp-json/wp/v2/posts");
        });

        it.each(["https://wp.test/", "https://wp.test///"])("joins the API path onto %s exactly once", async (baseURL) => {
            await build(baseURL).listEntries("posts");

            expect(requestedUrl()).toBe(POSTS_URL);
        });

        it("sends no _embed for terms, which have nothing to embed", async () => {
            await build().listTerms("categories");

            expect(get).toHaveBeenCalledWith("https://wp.test/wp-json/wp/v2/categories", {
                query: { page: undefined, per_page: 10, slug: undefined, search: undefined },
            });
        });

        it("filters by the taxonomy the term names", async () => {
            await build().listEntries("posts", { term: { resource: "categories", id: "12" } });

            expect(get).toHaveBeenCalledWith(POSTS_URL, {
                query: {
                    page: undefined,
                    per_page: 10,
                    slug: undefined,
                    search: undefined,
                    categories: "12",
                    _embed: "wp:featuredmedia,wp:term",
                },
            });
        });
    });

    // An unset NUXT_CONTENT_VENDOR_BASE_URL would otherwise become a relative fetch and come back as a 502
    it.each(["", "   ", "wp.test", "/blog"])("refuses to exist with %o as its base URL", (baseURL) => {
        expect(() => build(baseURL)).toThrow(MisconfiguredVendorError);
        expect(() => build(baseURL)).toThrow(/baseURL is not an absolute URL/);
    });

    // Core WordPress has no locale axis. A silently dropped one is cached under the locale that was
    // asked for and then serves the wrong language, so refusing beats ignoring.
    describe("the locale axis", () => {
        it.each([
            ["listEntries", (provider: WordpressProvider) => provider.listEntries("posts", { locale: "es-ES" })],
            ["listTerms", (provider: WordpressProvider) => provider.listTerms("categories", { locale: "es-ES" })],
        ])("refuses a locale on %s without asking WordPress for one", async (_, call) => {
            await expect(call(build())).rejects.toThrow(UnsupportedQueryError);
            await expect(call(build())).rejects.toMatchObject({ statusCode: 400 });
            expect(get).not.toHaveBeenCalled();
        });
    });

    // A thin smoke test that the query and the response are actually wired through WordpressHelpers —
    // the mapping and pagination edge cases themselves are pinned in WordpressHelpers.spec.ts
    it("returns a page built from the mapped response", async () => {
        respond([entry], { "x-wp-total": "12", "x-wp-totalpages": "2" });

        const result = await build().listEntries("posts", { page: 2, perPage: 6 });

        expect(result).toMatchObject({
            items: [expect.objectContaining({ id: "7", slug: "hello-world" })],
            page: 2,
            perPage: 6,
            total: 12,
            totalPages: 2,
        });
    });
});
