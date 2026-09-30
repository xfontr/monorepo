import { fakeEntry } from "@monorepo/content/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Article } from "../../../shared/types/Article";

const nitro = vi.hoisted(() => ({ fetch: vi.fn(), slug: "la-culpa" }));

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("getRouterParam", () => nitro.slug);
vi.stubGlobal("createError", (input: { statusCode?: number }) => Object.assign(new Error("http"), input));
vi.stubGlobal("$fetch", nitro.fetch);

const handler = (await import("./[slug].get")).default as unknown as (event: unknown) => Promise<Article>;

beforeEach(() => {
    vi.clearAllMocks();
    nitro.slug = "la-culpa";
    nitro.fetch.mockResolvedValue(fakeEntry({ slug: "la-culpa", body: { format: "html", value: "<h2>Uno</h2>" } }));
});

describe("GET /api/articles/:slug", () => {
    // The raw segment goes through untouched, so an accented slug isn't encoded a second time
    it("reads the post through the content module's route", async () => {
        nitro.slug = "la-teor%C3%ADa";

        await handler({});

        expect(nitro.fetch).toHaveBeenCalledWith("/api/content/posts/la-teor%C3%ADa");
    });

    it("returns the entry mapped into an article", async () => {
        const article = await handler({});

        expect(article.slug).toBe("la-culpa");
        expect(article.body.toc).toEqual([{ id: "uno", label: "Uno", level: 2 }]);
    });

    it("keeps the content module's status, so a missing post is a 404 and not a 500", async () => {
        nitro.fetch.mockRejectedValue({ statusCode: 404, statusMessage: "No \"posts\" found" });

        await expect(handler({})).rejects.toMatchObject({ statusCode: 404, statusMessage: "No \"posts\" found" });
    });
});
