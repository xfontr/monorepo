import { beforeEach, describe, expect, it, vi } from "vitest";
import WordpressProvider from "./WordpressProvider";
import type { HttpClient } from "#core/ports/HttpClient";
import type { Vendor } from "#core/domain/vendor";

const get = vi.fn();
const http: HttpClient = { get };

const POSTS_URL = "/wp-json/wp/v2/posts";

const entry = {
    id: 7,
    slug: "hello-world",
    title: { rendered: "Hello World" },
    content: { rendered: "<p>Body</p>" },
};

const respond = (data: unknown, headers: Record<string, string> = {}) => {
    get.mockResolvedValue({ data, headers: new Headers(headers) });
};

// Built the way the registry builds it: a vendor with no options is configured without the field
const build = () => new WordpressProvider({ baseURL: "https://wp.test" } as Vendor, http);

beforeEach(() => {
    vi.clearAllMocks();
    respond([entry]);
});

describe("WordpressProvider", () => {
    describe("addressing the vendor", () => {
        it("asks the WordPress REST API for the resource, embedding media, terms and authors in one round trip", async () => {
            await build().listEntries("posts");

            expect(get).toHaveBeenCalledWith(POSTS_URL, {
                query: {
                    page: undefined,
                    per_page: 10,
                    slug: undefined,
                    search: undefined,
                    author: undefined,
                    _embed: "wp:featuredmedia,wp:term,author",
                },
            });
        });

        it("sends no _embed for terms, which have nothing to embed", async () => {
            await build().listTerms("categories");

            expect(get).toHaveBeenCalledWith("/wp-json/wp/v2/categories", {
                query: { page: undefined, per_page: 10, slug: undefined, search: undefined },
            });
        });

        it("filters by author id", async () => {
            await build().listEntries("posts", { author: "12" });

            expect(get).toHaveBeenCalledWith(POSTS_URL, {
                query: {
                    page: undefined,
                    per_page: 10,
                    slug: undefined,
                    search: undefined,
                    author: "12",
                    _embed: "wp:featuredmedia,wp:term,author",
                },
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
                    author: undefined,
                    _embed: "wp:featuredmedia,wp:term,author",
                },
            });
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
