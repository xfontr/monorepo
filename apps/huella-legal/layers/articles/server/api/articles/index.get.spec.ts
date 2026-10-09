import { fakeEntry } from "@monorepo/content/testing";
import type { Page } from "@monorepo/content";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleSummary } from "../../../shared/types/ArticleSummary";

const ENTRY = fakeEntry({ title: "La &#8220;culpa&#8221;" });

const nitro = vi.hoisted(() => ({
    listEntries: vi.fn(),
    query: {} as Record<string, unknown>,
}));

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("getQuery", () => nitro.query);
vi.stubGlobal("useContent", () => ({ listEntries: nitro.listEntries }));

const handler = (await import("./index.get")).default as unknown as (
    event: unknown,
) => Promise<Page<ArticleSummary>>;

beforeEach(() => {
    vi.clearAllMocks();
    nitro.query = {};
    nitro.listEntries.mockResolvedValue({
        items: [ENTRY],
        page: 2,
        perPage: 6,
        total: 7,
        totalPages: 2,
    });
});

describe("GET /api/articles", () => {
    it("serves a page of posts as summaries, so no vendor HTML reaches the browser", async () => {
        const page = await handler({});

        expect(page).toMatchObject({ page: 2, perPage: 6, total: 7, totalPages: 2 });
        expect(page.items[0]).toMatchObject({ id: ENTRY.id, title: "La “culpa”" });
        expect(page.items[0]).not.toHaveProperty("body");
    });

    // useContent is what bounds the page, so a malformed one has to reach it to come back a 400
    it.each([
        [{}, undefined],
        [{ page: "2" }, 2],
        [{ page: "" }, undefined],
        [{ page: "abc" }, Number.NaN],
    ])("forwards %o as page %s, at a page size the reader can't choose", async (query, page) => {
        nitro.query = { ...query, perPage: "50" };

        await handler({});

        expect(nitro.listEntries).toHaveBeenCalledWith("posts", { page, perPage: 6 });
    });
});
