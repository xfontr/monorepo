import { fakeEntry } from "@monorepo/content/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleSummary } from "../../shared/types/ArticleSummary";

const nitro = vi.hoisted(() => ({
    listEntries: vi.fn(),
    cache: {} as { getKey?: () => string; maxAge?: number; swr?: boolean },
    window: { maxAge: 300, swr: false },
}));

const blobs = vi.hoisted(() => ({ readSaved: vi.fn(), save: vi.fn() }));

vi.mock("../adapters/netlify", () => blobs);

vi.stubGlobal("defineCachedFunction", (fn: unknown, options: typeof nitro.cache) => {
    nitro.cache = options;

    return fn;
});
vi.stubGlobal("useRuntimeConfig", () => ({ articles: { cache: nitro.window } }));
vi.stubGlobal("useContent", () => ({ listEntries: nitro.listEntries }));

const { getArticleIndex } = (await import("./articleIndex")) as unknown as {
    getArticleIndex: (event: unknown) => Promise<ArticleSummary[]>;
};

const OLD = fakeEntry({ publishedAt: "2024-03-01T00:00:00Z" });
const NEW = fakeEntry({ publishedAt: "2026-03-01T00:00:00Z" });
const MIDDLE = fakeEntry({ publishedAt: "2025-03-01T00:00:00Z" });

beforeEach(() => {
    vi.clearAllMocks();
    blobs.readSaved.mockResolvedValue(undefined);
    blobs.save.mockResolvedValue(undefined);
    nitro.listEntries.mockImplementation((_resource: string, { page }: { page: number }) =>
        Promise.resolve({ items: [[OLD], [NEW], [MIDDLE]][page - 1], totalPages: 3 }),
    );
});

describe("getArticleIndex", () => {
    it("reads every page of posts at the content module's ceiling, not just the first", async () => {
        const index = await getArticleIndex({});

        expect(nitro.listEntries.mock.calls).toEqual([
            ["posts", { page: 1, perPage: 50 }],
            ["posts", { page: 2, perPage: 50 }],
            ["posts", { page: 3, perPage: 50 }],
        ]);
        expect(index.map(({ id }) => id)).toEqual([NEW.id, MIDDLE.id, OLD.id]);
    });

    it("serves the deploy's saved copy without asking WordPress, so a cold instance is fast", async () => {
        const saved = [{ id: "saved" }];
        blobs.readSaved.mockResolvedValue(saved);

        await expect(getArticleIndex({})).resolves.toBe(saved);
        expect(blobs.readSaved).toHaveBeenCalledWith("article-index", "posts", 300);
        expect(nitro.listEntries).not.toHaveBeenCalled();
    });

    it("resolves only once the index it read is saved, so a frozen function can't lose it", async () => {
        let release = () => {};
        blobs.save.mockReturnValue(new Promise<void>((resolve) => (release = resolve)));

        let settled = false;
        const pending = getArticleIndex({}).then(() => (settled = true));
        await vi.waitFor(() => expect(blobs.save).toHaveBeenCalledOnce());

        expect(settled).toBe(false);
        expect(blobs.save.mock.calls[0]?.slice(0, 2)).toEqual(["article-index", "posts"]);

        release();
        await pending;

        expect(settled).toBe(true);
    });

    it("is cached as one entry, so listings never remap the archive per query", () => {
        expect(nitro.cache.getKey?.()).toBe("posts");
    });

    it("caches for the window the runtime config sets, not a fixed one", () => {
        expect(nitro.cache).toMatchObject(nitro.window);
    });
});
