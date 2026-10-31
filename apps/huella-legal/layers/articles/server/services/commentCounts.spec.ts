import { fakeEntry } from "@monorepo/content/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toArticleSummary } from "../mappers/articleSummary";

const nitro = vi.hoisted(() => ({
    posts: vi.fn(),
    cache: {} as { getKey?: () => string; maxAge?: number; swr?: boolean },
    window: { maxAge: 300, swr: false },
}));

vi.stubGlobal("defineCachedFunction", (fn: unknown, options: typeof nitro.cache) => {
    nitro.cache = options;

    return fn;
});
vi.stubGlobal("useRuntimeConfig", () => ({ articles: { cache: nitro.window } }));

vi.mock("../adapters/wordpress", () => ({ listCommentedPosts: nitro.posts }));

const { withCommentCounts } = await import("./commentCounts");

const COMMENTED = toArticleSummary(fakeEntry());
const SILENT = toArticleSummary(fakeEntry());

beforeEach(() => {
    vi.clearAllMocks();
    nitro.posts.mockResolvedValue([COMMENTED.id, "999", COMMENTED.id]);
});

describe("withCommentCounts", () => {
    it("counts each post's comments onto its summary and leaves an uncommented one without", async () => {
        const [commented, silent] = await withCommentCounts({} as never, [COMMENTED, SILENT]);

        expect(commented?.commentCount).toBe(2);
        expect(silent).not.toHaveProperty("commentCount");
    });

    it("answers the summaries without counts when WordPress can't be read, rather than failing the listing", async () => {
        nitro.posts.mockRejectedValue(Object.assign(new Error("http"), { statusCode: 502 }));

        await expect(withCommentCounts({} as never, [COMMENTED])).resolves.toEqual([COMMENTED]);
    });

    it("is cached as one entry for the articles window, so a listing never counts per request", () => {
        expect(nitro.cache.getKey?.()).toBe("comments");
        expect(nitro.cache).toMatchObject(nitro.window);
    });
});
