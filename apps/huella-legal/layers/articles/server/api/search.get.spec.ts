import { MAX_SEARCH_LENGTH } from "@monorepo/content";
import { fakeEntry, fakeTerm } from "@monorepo/content/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleSearch } from "../../shared/types/ArticleSearch";
import type { ArticleSummary } from "../../shared/types/ArticleSummary";
import { toArticleSummary, toCategory } from "../mappers/articleSummary";

const nitro = vi.hoisted(() => ({
    listEntries: vi.fn(),
    query: {} as Record<string, unknown>,
    index: [] as ArticleSummary[],
}));

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("getQuery", () => nitro.query);
vi.stubGlobal("createError", (input: { statusCode?: number }) =>
    Object.assign(new Error("http"), input),
);
vi.stubGlobal("useContent", () => ({ listEntries: nitro.listEntries }));

vi.mock("../services/articleIndex", () => ({
    getArticleIndex: () => Promise.resolve(nitro.index),
}));

const handler = (await import("./search.get")).default as unknown as (
    event: unknown,
) => Promise<ArticleSearch>;

const CIVIL = fakeTerm();
const MATCH = fakeEntry();

const page = (items: ReturnType<typeof fakeEntry>[]) => ({
    items,
    page: 1,
    perPage: 20,
    total: items.length,
    totalPages: items.length ? 1 : 0,
});

beforeEach(() => {
    vi.clearAllMocks();
    nitro.query = { query: "culpa" };
    nitro.index = [toArticleSummary(fakeEntry({ terms: [CIVIL] }))];
    nitro.listEntries.mockResolvedValue(page([MATCH]));
});

describe("GET /api/search", () => {
    it("asks the CMS for the trimmed query twenty at a time and maps what it answers", async () => {
        nitro.query = { query: "  culpa  ", page: "2" };
        nitro.listEntries.mockResolvedValue({ ...page([MATCH]), page: 2, totalPages: 2 });

        const search = await handler({});

        expect(nitro.listEntries).toHaveBeenCalledWith("posts", {
            search: "culpa",
            page: 2,
            perPage: 20,
        });
        expect(search).toMatchObject({ query: "culpa", items: [toArticleSummary(MATCH)] });
    });

    it("suggests subjects only when nothing matched, so a hit never pays for the index", async () => {
        expect((await handler({})).subjects).toEqual([]);

        nitro.listEntries.mockResolvedValue(page([]));

        expect((await handler({})).subjects).toEqual([toCategory(CIVIL)]);
    });

    it.each([
        [{}],
        [{ query: "   " }],
        [{ query: ["culpa", "dolo"] }],
        [{ query: "a".repeat(MAX_SEARCH_LENGTH + 1) }],
        [{ query: "culpa", page: "0" }],
        [{ query: "culpa", page: "dos" }],
    ])("answers %j with a 404 without asking the CMS", async (query) => {
        nitro.query = query;

        await expect(handler({})).rejects.toMatchObject({ statusCode: 404 });
        expect(nitro.listEntries).not.toHaveBeenCalled();
    });

    it("answers a page past the end with a 404 rather than WordPress's 400", async () => {
        nitro.listEntries.mockRejectedValue(
            Object.assign(new Error("upstream"), { statusCode: 400 }),
        );

        await expect(handler({})).rejects.toMatchObject({ statusCode: 404 });
    });

    it("answers a page past the end of a search with no match with a 404 too", async () => {
        nitro.query = { query: "culpa", page: "2" };
        nitro.listEntries.mockResolvedValue({ ...page([]), page: 2 });

        await expect(handler({})).rejects.toMatchObject({ statusCode: 404 });
    });

    it("lets any other CMS failure through, so an outage is never reported as no results", async () => {
        const outage = Object.assign(new Error("upstream"), { statusCode: 502 });
        nitro.listEntries.mockRejectedValue(outage);

        await expect(handler({})).rejects.toBe(outage);
    });
});
