import { fakeEntry } from "@monorepo/content/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleComments } from "../../../../shared/types/ArticleComments";

const ENTRY = fakeEntry({ slug: "la-culpa" });

const nitro = vi.hoisted(() => ({
    getEntry: vi.fn(),
    isOpen: vi.fn(),
    list: vi.fn(),
}));

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("getRouterParam", () => "la-culpa");
vi.stubGlobal("useContent", () => ({ getEntry: nitro.getEntry }));

vi.mock("../../../adapters/wordpress", () => ({
    isOpenForComments: nitro.isOpen,
    listComments: nitro.list,
}));

const handler = (await import("./comments.get")).default as unknown as (
    event: unknown,
) => Promise<ArticleComments>;

beforeEach(() => {
    vi.clearAllMocks();
    nitro.getEntry.mockResolvedValue(ENTRY);
    nitro.isOpen.mockResolvedValue(true);
    nitro.list.mockResolvedValue([
        {
            id: 1,
            parent: 0,
            author_name: "Ana",
            date_gmt: "2024-05-01T10:00:00",
            content: { rendered: "<p>Hola</p>" },
        },
    ]);
});

describe("GET /api/articles/:slug/comments", () => {
    it("reads the comments of the post the slug names, by its id", async () => {
        const { open, count, threads } = await handler({});

        expect(nitro.getEntry).toHaveBeenCalledWith("posts", "la-culpa");
        expect(nitro.list).toHaveBeenCalledWith({}, ENTRY.id);
        expect(nitro.isOpen).toHaveBeenCalledWith({}, ENTRY.id);
        expect({ open, count, author: threads[0]?.author }).toEqual({
            open: true,
            count: 1,
            author: "Ana",
        });
    });

    it("fails with the article's status when the slug names nothing", async () => {
        nitro.getEntry.mockRejectedValue(Object.assign(new Error("http"), { statusCode: 404 }));

        await expect(handler({})).rejects.toMatchObject({ statusCode: 404 });
        expect(nitro.list).not.toHaveBeenCalled();
    });
});
