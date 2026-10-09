import { fakeEntry } from "@monorepo/content/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Article } from "../../../shared/types/Article";

const ENTRY = fakeEntry({ slug: "la-culpa", body: { format: "html", value: "<h2>Uno</h2>" } });

const nitro = vi.hoisted(() => ({
    entry: vi.fn(),
    slug: "la-culpa",
    siteUrl: "https://revista.test",
    cache: {} as { getKey?: (event: unknown) => string, maxAge?: number },
}));

vi.stubGlobal("defineCachedEventHandler", (handler: unknown, options: typeof nitro.cache) => {
    nitro.cache = options;

    return handler;
});
vi.stubGlobal("getRouterParam", () => nitro.slug);
vi.stubGlobal("createError", (input: { statusCode?: number }) => Object.assign(new Error("http"), input));
vi.stubGlobal("useRuntimeConfig", () => ({ public: { site: { url: nitro.siteUrl } } }));
vi.stubGlobal("useAppConfig", () => ({ journal: { name: "Huella Legal", issn: "0000-0000" } }));
vi.stubGlobal("$fetch", (path: string) => nitro.entry(path));

const handler = (await import("./[slug].get")).default as unknown as (event: unknown) => Promise<Article>;

beforeEach(() => {
    vi.clearAllMocks();
    nitro.slug = "la-culpa";
    nitro.siteUrl = "https://revista.test";
    nitro.entry.mockResolvedValue(ENTRY);
});

describe("GET /api/articles/:slug", () => {
    // The router param arrives still encoded, which is the form the content route expects
    it("reads the post named by the route, its slug passed on as it arrived", async () => {
        nitro.slug = "la-teor%C3%ADa";

        await handler({});

        expect(nitro.entry).toHaveBeenCalledWith("/api/content/posts/la-teor%C3%ADa");
    });

    it("returns the entry mapped into an article, cited at its permalink on the site", async () => {
        const article = await handler({});

        expect(article.slug).toBe("la-culpa");
        expect(article.body.toc).toEqual([{ id: "uno", label: "Uno", level: 2 }]);
        expect(article.citations[0]?.text).toContain("https://revista.test/la-culpa/");
    });

    it("caches the mapped article per slug, so the sanitiser doesn't run on every request", () => {
        expect(nitro.cache.getKey?.({})).toBe("la-culpa");
        expect(nitro.cache.maxAge).toBeGreaterThan(0);
    });

    it("keeps the content module's status, so a missing post is a 404 and not a 500", async () => {
        nitro.entry.mockRejectedValue(Object.assign(new Error("404"), { response: { status: 404, statusText: "Not found" } }));

        await expect(handler({})).rejects.toMatchObject({ statusCode: 404 });
    });

    it("fails naming the missing site URL instead of citing a relative address", async () => {
        nitro.siteUrl = "";

        await expect(handler({})).rejects.toMatchObject({ statusCode: 500, statusMessage: "Site is misconfigured: NUXT_PUBLIC_SITE_URL is not set" });
        expect(nitro.entry).not.toHaveBeenCalled();
    });
});
