import type { Entry } from "@monorepo/content";
import { fakeEntry, fakeTerm } from "@monorepo/content/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleSummary } from "../../../../shared/types/ArticleSummary";

const CATEGORY = fakeTerm();
const ENTRY = fakeEntry({ slug: "la-culpa", terms: [CATEGORY] });
const SIBLINGS = Array.from({ length: 4 }, () => fakeEntry({ terms: [CATEGORY] }));

const nitro = vi.hoisted(() => ({
    getEntry: vi.fn(),
    listEntries: vi.fn(),
}));

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("getRouterParam", () => "la-culpa");
vi.stubGlobal("useContent", () => ({ getEntry: nitro.getEntry, listEntries: nitro.listEntries }));

const handler = (await import("./related.get")).default as unknown as (
    event: unknown,
) => Promise<ArticleSummary[]>;

beforeEach(() => {
    vi.clearAllMocks();
    nitro.getEntry.mockResolvedValue(ENTRY);
    nitro.listEntries.mockResolvedValue({
        items: [...SIBLINGS.slice(0, 1), ENTRY, ...SIBLINGS.slice(1)] satisfies Entry[],
    });
});

describe("GET /api/articles/:slug/related", () => {
    it("relates the three newest posts in its category, never the article itself", async () => {
        const related = await handler({});

        expect(nitro.getEntry).toHaveBeenCalledWith("posts", "la-culpa");
        expect(nitro.listEntries).toHaveBeenCalledWith("posts", {
            term: { resource: "categories", id: CATEGORY.id },
            perPage: 4,
        });
        expect(related.map(({ id }) => id)).toEqual(SIBLINGS.slice(0, 3).map(({ id }) => id));
    });

    it("relates nothing to a post with no category, rather than the whole archive", async () => {
        nitro.getEntry.mockResolvedValue({ ...ENTRY, terms: [] });

        expect(await handler({})).toEqual([]);
        expect(nitro.listEntries).not.toHaveBeenCalled();
    });

    // The page hides the band on an error, so an empty fallback here would hide that something failed
    it("fails with the list's status rather than answering an empty list", async () => {
        nitro.listEntries.mockRejectedValue(Object.assign(new Error("http"), { statusCode: 502 }));

        await expect(handler({})).rejects.toMatchObject({ statusCode: 502 });
    });
});
