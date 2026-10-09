import type { Entry } from "@monorepo/content";
import { fakeEntry, fakeTerm } from "@monorepo/content/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleSummary } from "../../../../shared/types/ArticleSummary";

const CATEGORY = fakeTerm();
const ENTRY = fakeEntry({ slug: "la-culpa", terms: [CATEGORY] });
const SIBLINGS = Array.from({ length: 4 }, () => fakeEntry({ terms: [CATEGORY] }));

const nitro = vi.hoisted(() => ({
    entry: vi.fn(),
    list: vi.fn(),
    slug: "la-culpa",
    cache: {} as { getKey?: (event: unknown) => string, maxAge?: number },
}));

vi.stubGlobal("defineCachedEventHandler", (handler: unknown, options: typeof nitro.cache) => {
    nitro.cache = options;

    return handler;
});
vi.stubGlobal("getRouterParam", () => nitro.slug);
vi.stubGlobal("createError", (input: object) => Object.assign(new Error("http"), input));
vi.stubGlobal("$fetch", (path: string, options?: unknown) => path.startsWith("/api/content/posts/") ? nitro.entry(path) : nitro.list(path, options));

const handler = (await import("./related.get")).default as unknown as (event: unknown) => Promise<ArticleSummary[]>;

beforeEach(() => {
    vi.clearAllMocks();
    nitro.slug = "la-culpa";
    nitro.entry.mockResolvedValue(ENTRY);
    nitro.list.mockResolvedValue({ items: [...SIBLINGS.slice(0, 1), ENTRY, ...SIBLINGS.slice(1)] satisfies Entry[] });
});

describe("GET /api/articles/:slug/related", () => {
    it("relates the three newest posts in its category, never the article itself", async () => {
        const related = await handler({});

        expect(nitro.entry).toHaveBeenCalledWith("/api/content/posts/la-culpa");
        expect(nitro.list).toHaveBeenCalledWith("/api/content/posts", { query: { term: `categories:${CATEGORY.id}`, perPage: 4 } });
        expect(related.map(({ id }) => id)).toEqual(SIBLINGS.slice(0, 3).map(({ id }) => id));
    });

    it("relates nothing to a post with no category, rather than the whole archive", async () => {
        nitro.entry.mockResolvedValue({ ...ENTRY, terms: [] });

        expect(await handler({})).toEqual([]);
        expect(nitro.list).not.toHaveBeenCalled();
    });

    // A fallback here would be cached for hours; the page hides the band on an error instead
    it("fails with the list's status rather than caching an empty list", async () => {
        nitro.list.mockRejectedValue(Object.assign(new Error("502"), { response: { status: 502, statusText: "Upstream request failed" } }));

        await expect(handler({})).rejects.toMatchObject({ statusCode: 502 });
    });

    it("caches the list per slug", () => {
        expect(nitro.cache.getKey?.({})).toBe("la-culpa");
        expect(nitro.cache.maxAge).toBeGreaterThan(0);
    });
});
