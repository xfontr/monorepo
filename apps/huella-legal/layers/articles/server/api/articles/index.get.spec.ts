import { MAX_SEARCH_LENGTH } from "@monorepo/content";
import { fakeAuthor, fakeEntry, fakeTerm } from "@monorepo/content/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleListing } from "../../../shared/types/ArticleListing";
import type { ArticleSummary } from "../../../shared/types/ArticleSummary";
import { toArticleSummary } from "../../mappers/articleSummary";

const nitro = vi.hoisted(() => ({
    getTerm: vi.fn(),
    query: {} as Record<string, unknown>,
    index: [] as ArticleSummary[],
}));

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("getQuery", () => nitro.query);
vi.stubGlobal("createError", (input: { statusCode?: number }) =>
    Object.assign(new Error("http"), input),
);
vi.stubGlobal("useContent", () => ({ getTerm: nitro.getTerm }));

vi.mock("../../services/articleIndex", () => ({
    getArticleIndex: () => Promise.resolve(nitro.index),
}));

const handler = (await import("./index.get")).default as unknown as (
    event: unknown,
) => Promise<ArticleListing>;

const CIVIL = fakeTerm({ slug: "derecho-civil", name: "Derecho &amp; civil" });
const AUTHOR = fakeAuthor({ slug: "ana-ruiz" });
const OLDEST = fakeEntry({
    publishedAt: "2023-01-01T00:00:00Z",
    authors: [AUTHOR],
    terms: [CIVIL],
});

beforeEach(() => {
    vi.clearAllMocks();
    nitro.query = {};
    nitro.index = [
        ...Array.from({ length: 21 }, () => toArticleSummary(fakeEntry())),
        toArticleSummary(OLDEST),
    ];
});

describe("GET /api/articles", () => {
    it("answers the first page newest first when asked for nothing", async () => {
        const listing = await handler({});

        expect(listing).toMatchObject({ page: 1, total: 22, totalPages: 2 });
        expect(listing.items[0]).toBe(nitro.index[0]);
    });

    it.each([
        [{ page: "0" }],
        [{ page: "2.5" }],
        [{ page: "dos" }],
        [{ page: "3" }],
        [{ sort: "popular" }],
        [{ format: "podcast" }],
        [{ sort: ["newest", "oldest"] }],
        [{ query: "a".repeat(MAX_SEARCH_LENGTH + 1) }],
        [{ query: ["culpa", "dolo"] }],
    ])("answers %j with a 404 instead of quietly answering another listing", async (query) => {
        nitro.query = query;

        await expect(handler({})).rejects.toMatchObject({ statusCode: 404 });
    });

    it("answers a query of only spaces with the whole archive, so an empty submit is no 404", async () => {
        nitro.query = { query: "   " };

        await expect(handler({})).resolves.toMatchObject({ total: 22 });
    });

    // h3 mangles anything else in a status message and logs a warning for every such request
    it("keeps the status message printable ASCII and puts what was wrong in the message", async () => {
        nitro.query = { page: "0", sort: "más" };

        const error = (await handler({}).catch((caught: unknown) => caught)) as {
            statusMessage: string;
            message: string;
        };

        expect(error.statusMessage).toMatch(/^[\t\x20-\x7E]*$/);
        expect(error.message).toContain("page");
    });

    it("reads a subject's own term, so the page has its description and decoded name", async () => {
        nitro.query = { category: "derecho-civil" };
        nitro.getTerm.mockResolvedValue({ ...CIVIL, description: "<p>Contratos</p>" });

        const listing = await handler({});

        expect(nitro.getTerm).toHaveBeenCalledWith("categories", "derecho-civil");
        expect(listing.scope).toEqual({
            kind: "category",
            term: {
                id: CIVIL.id,
                slug: "derecho-civil",
                name: "Derecho & civil",
                description: "Contratos",
            },
        });
        expect(listing.items.map(({ id }) => id)).toEqual([OLDEST.id]);
    });

    it("resolves an author by slug from the index, with the date of their first post", async () => {
        nitro.query = { author: "ana-ruiz" };

        const listing = await handler({});

        expect(listing.scope).toMatchObject({
            kind: "author",
            author: { slug: "ana-ruiz" },
            since: OLDEST.publishedAt,
        });
        expect(listing.total).toBe(1);
    });

    it("answers 404 for a slug no post is by", async () => {
        nitro.query = { author: "nadie" };

        await expect(handler({})).rejects.toMatchObject({ statusCode: 404 });
    });
});
