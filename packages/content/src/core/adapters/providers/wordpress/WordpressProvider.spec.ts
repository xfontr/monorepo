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
    title: { rendered: "Hello &#8211; World" },
    content: { rendered: "<p>Body</p>" },
    excerpt: { rendered: "<p>Excerpt</p>" },
    date_gmt: "2026-01-02T03:04:05",
    modified_gmt: "2026-01-03T03:04:05",
    _embedded: {
        "wp:featuredmedia": [{
            id: 9,
            source_url: "https://wp.test/image.jpg",
            alt_text: "A photo",
            media_details: { width: 800, height: 600 },
        }],
        "wp:term": [
            [{ id: 3, name: "News", slug: "news", taxonomy: "category" }],
            [{ id: 4, name: "Tips", slug: "tips", taxonomy: "post_tag" }],
        ],
    },
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
    respond([entry], { "x-wp-total": "12", "x-wp-totalpages": "2" });
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
            respond([{ id: 3, name: "News", slug: "news", taxonomy: "category" }]);

            await build().listTerms("categories");

            expect(get).toHaveBeenCalledWith("https://wp.test/wp-json/wp/v2/categories", {
                query: { page: undefined, per_page: 10, slug: undefined, search: undefined },
            });
        });
    });

    // An unset NUXT_CONTENT_VENDOR_BASE_URL would otherwise become a relative fetch and come back as a 502
    it.each(["", "   ", "wp.test", "/blog"])("refuses to exist with %o as its base URL", (baseURL) => {
        expect(() => build(baseURL)).toThrow(MisconfiguredVendorError);
        expect(() => build(baseURL)).toThrow(/baseURL is not an absolute URL/);
    });

    describe("the query", () => {
        it("forwards the axes WordPress names differently", async () => {
            await build().listEntries("posts", { page: 3, perPage: 25, slug: "hello-world", search: "budget" });

            expect(get).toHaveBeenCalledWith(POSTS_URL, {
                query: {
                    page: 3,
                    per_page: 25,
                    slug: "hello-world",
                    search: "budget",
                    _embed: "wp:featuredmedia,wp:term",
                },
            });
        });

        // WordPress returns a 400 above its own ceiling rather than clamping itself
        it("clamps the page size to what WordPress accepts, and reports the clamped value", async () => {
            const result = await build().listEntries("posts", { perPage: 500 });

            expect(get).toHaveBeenCalledWith(POSTS_URL, {
                query: {
                    page: undefined,
                    per_page: 100,
                    slug: undefined,
                    search: undefined,
                    _embed: "wp:featuredmedia,wp:term",
                },
            });
            expect(result.perPage).toBe(100);
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

        // Core WordPress has no locale axis. A silently dropped one is cached under the locale that was
        // asked for and then serves the wrong language, so refusing beats ignoring.
        it.each([
            ["listEntries", (provider: WordpressProvider) => provider.listEntries("posts", { locale: "es-ES" })],
            ["listTerms", (provider: WordpressProvider) => provider.listTerms("categories", { locale: "es-ES" })],
        ])("refuses a locale on %s without asking WordPress for one", async (_, call) => {
            await expect(call(build())).rejects.toThrow(UnsupportedQueryError);
            await expect(call(build())).rejects.toMatchObject({ statusCode: 400 });
            expect(get).not.toHaveBeenCalled();
        });
    });

    describe("mapping an entry", () => {
        it("reads it into the domain shape, ids as strings", async () => {
            const { items } = await build().listEntries("posts");

            expect(items[0]).toEqual({
                id: "7",
                slug: "hello-world",
                title: "Hello &#8211; World",
                excerpt: { format: "html", value: "<p>Excerpt</p>" },
                body: { format: "html", value: "<p>Body</p>" },
                publishedAt: "2026-01-02T03:04:05Z",
                updatedAt: "2026-01-03T03:04:05Z",
                image: {
                    id: "9",
                    url: "https://wp.test/image.jpg",
                    alt: "A photo",
                    width: 800,
                    height: 600,
                },
                terms: [
                    { id: "3", resource: "categories", slug: "news", name: "News", description: undefined },
                    { id: "4", resource: "tags", slug: "tips", name: "Tips", description: undefined },
                ],
            });
        });

        // WordPress reports GMT without a zone designator, so an unsuffixed timestamp parses as local time
        it.each([
            ["2026-01-02T03:04:05", "2026-01-02T03:04:05Z"],
            ["2026-01-02T03:04:05Z", "2026-01-02T03:04:05Z"],
        ])("marks %s as UTC", async (date_gmt, expected) => {
            respond([{ ...entry, date_gmt }]);

            const { items } = await build().listEntries("posts");

            expect(items[0]?.publishedAt).toBe(expected);
        });

        it.each([null, undefined, ""])("omits a date reported as %o", async (date_gmt) => {
            respond([{ ...entry, date_gmt, modified_gmt: date_gmt }]);

            const { items } = await build().listEntries("posts");

            expect(items[0]?.publishedAt).toBeUndefined();
            expect(items[0]?.updatedAt).toBeUndefined();
        });

        it("omits an excerpt the vendor did not render", async () => {
            respond([{ ...entry, excerpt: undefined }]);

            const { items } = await build().listEntries("posts");

            expect(items[0]?.excerpt).toBeUndefined();
        });

        // An inaccessible featured image embeds as a REST error object instead of a media item
        it("drops a featured image that came back without a url", async () => {
            respond([{ ...entry, _embedded: { "wp:featuredmedia": [{ code: "rest_forbidden" }] } }]);

            const { items } = await build().listEntries("posts");

            expect(items[0]?.image).toBeUndefined();
        });

        it("omits alt text rather than inventing it, so a decorative image stays decorative", async () => {
            respond([{ ...entry, _embedded: { "wp:featuredmedia": [{ id: 9, source_url: "https://wp.test/i.jpg" }] } }]);

            const { items } = await build().listEntries("posts");

            expect(items[0]?.image).toEqual({ id: "9", url: "https://wp.test/i.jpg", alt: "", width: undefined, height: undefined });
        });

        // An entry embeds every taxonomy the site defines, including custom ones the domain has no name for
        it("drops a taxonomy the domain cannot name, rather than guessing one", async () => {
            respond([{
                ...entry,
                _embedded: { "wp:term": [[{ id: 5, name: "Q1", slug: "q1", taxonomy: "wp_pattern_category" }]] },
            }]);

            const { items } = await build().listEntries("posts");

            expect(items[0]?.terms).toEqual([]);
        });

        it("survives an entry that embeds nothing", async () => {
            respond([{ ...entry, _embedded: undefined }]);

            const { items } = await build().listEntries("posts");

            expect(items[0]?.terms).toEqual([]);
            expect(items[0]?.image).toBeUndefined();
        });
    });

    describe("mapping a term", () => {
        it("reads it into the domain shape, naming the resource from its taxonomy", async () => {
            respond([{ id: 3, name: "News", slug: "news", taxonomy: "category", description: "Latest" }]);

            const { items } = await build().listTerms("categories");

            expect(items).toEqual([{ id: "3", resource: "categories", slug: "news", name: "News", description: "Latest" }]);
        });

        it("omits an empty description", async () => {
            respond([{ id: 3, name: "News", slug: "news", taxonomy: "category", description: "" }]);

            const { items } = await build().listTerms("categories");

            expect(items[0]?.description).toBeUndefined();
        });

        // Falls back to what the caller asked for, so a custom taxonomy is never relabelled as a tag
        it("keeps the requested resource when the taxonomy is one the domain cannot name", async () => {
            respond([{ id: 5, name: "Q1", slug: "q1", taxonomy: "quarter" }]);

            const { items } = await build().listTerms("categories");

            expect(items[0]?.resource).toBe("categories");
        });
    });

    describe("pagination", () => {
        it("reports the totals WordPress puts in the headers, and the page that was asked for", async () => {
            const result = await build().listEntries("posts", { page: 2, perPage: 6 });

            expect(result).toMatchObject({ page: 2, perPage: 6, total: 12, totalPages: 2 });
        });

        it("defaults to the first page when none was asked for", async () => {
            expect(await build().listEntries("posts")).toMatchObject({ page: 1, perPage: 10 });
        });

        // A proxy or plugin can drop these headers or rewrite them into something non-numeric. The empty
        // string matters on its own: Number("") is 0, which would report a populated list as empty.
        it.each<Record<string, string>>([{}, { "x-wp-total": "" }, { "x-wp-total": "  " }, { "x-wp-total": "many" }, { "x-wp-total": "-1" }, { "x-wp-total": "1.5" }])(
            "falls back to what it actually received when the totals arrive as %o",
            async (headers) => {
                respond([entry], headers);

                expect(await build().listEntries("posts")).toMatchObject({ total: 1, totalPages: 1 });
            },
        );

        it("trusts a zero total, which is a real answer rather than a missing one", async () => {
            respond([], { "x-wp-total": "0", "x-wp-totalpages": "0" });

            expect(await build().listEntries("posts")).toMatchObject({ items: [], total: 0, totalPages: 0 });
        });

        it("survives a body that is not a list", async () => {
            respond(null);

            expect(await build().listEntries("posts")).toMatchObject({ items: [], total: 0 });
        });
    });
});
