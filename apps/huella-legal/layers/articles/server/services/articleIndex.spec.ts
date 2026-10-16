import { fakeEntry } from "@monorepo/content/testing";
import { describe, expect, it, vi } from "vitest";
import type { ArticleSummary } from "../../shared/types/ArticleSummary";

const nitro = vi.hoisted(() => ({
    listEntries: vi.fn(),
    cache: {} as { getKey?: () => string; maxAge?: number },
}));

vi.stubGlobal("defineCachedFunction", (fn: unknown, options: typeof nitro.cache) => {
    nitro.cache = options;

    return fn;
});
vi.stubGlobal("useContent", () => ({ listEntries: nitro.listEntries }));

const { getArticleIndex } = (await import("./articleIndex")) as unknown as {
    getArticleIndex: (event: unknown) => Promise<ArticleSummary[]>;
};

const OLD = fakeEntry({ publishedAt: "2024-03-01T00:00:00Z" });
const NEW = fakeEntry({ publishedAt: "2026-03-01T00:00:00Z" });
const MIDDLE = fakeEntry({ publishedAt: "2025-03-01T00:00:00Z" });

describe("getArticleIndex", () => {
    it("reads every page of posts at the content module's ceiling, not just the first", async () => {
        nitro.listEntries.mockImplementation((_resource: string, { page }: { page: number }) =>
            Promise.resolve({ items: [[OLD], [NEW], [MIDDLE]][page - 1], totalPages: 3 }),
        );

        const index = await getArticleIndex({});

        expect(nitro.listEntries.mock.calls).toEqual([
            ["posts", { page: 1, perPage: 50 }],
            ["posts", { page: 2, perPage: 50 }],
            ["posts", { page: 3, perPage: 50 }],
        ]);
        expect(index.map(({ id }) => id)).toEqual([NEW.id, MIDDLE.id, OLD.id]);
    });

    it("is cached as one entry, so listings never remap the archive per query", () => {
        expect(nitro.cache.getKey?.()).toBe("posts");
        expect(nitro.cache.maxAge).toBeGreaterThan(0);
    });
});
