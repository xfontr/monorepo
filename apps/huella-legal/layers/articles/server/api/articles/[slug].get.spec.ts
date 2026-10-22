import { fakeEntry } from "@monorepo/content/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Article } from "../../../shared/types/Article";

const ENTRY = fakeEntry({ slug: "la-culpa", body: { format: "html", value: "<h2>Uno</h2>" } });

const nitro = vi.hoisted(() => ({ getEntry: vi.fn(), param: vi.fn() }));

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("getRouterParam", nitro.param);
vi.stubGlobal("useRuntimeConfig", () => ({ public: { site: { url: "https://revista.test" } } }));
vi.stubGlobal("useAppConfig", () => ({ journal: { name: "Huella Legal", issn: "0000-0000" } }));
vi.stubGlobal("useContent", () => ({ getEntry: nitro.getEntry }));

const handler = (await import("./[slug].get")).default as unknown as (
    event: unknown,
) => Promise<Article>;

beforeEach(() => {
    vi.clearAllMocks();
    nitro.param.mockReturnValue("la-culpa");
    nitro.getEntry.mockResolvedValue(ENTRY);
});

describe("GET /api/articles/:slug", () => {
    // Left encoded, an accented slug would reach WordPress encoded twice and match nothing
    it("reads the post named by the route, its slug decoded", async () => {
        await handler({});

        expect(nitro.param).toHaveBeenCalledWith({}, "slug", { decode: true });
        expect(nitro.getEntry).toHaveBeenCalledWith("posts", "la-culpa");
    });

    it("returns the entry mapped into an article, cited at its permalink on the site", async () => {
        const article = await handler({});

        expect(article.slug).toBe("la-culpa");
        expect(article.body.toc).toEqual([{ id: "uno", label: "Uno", level: 2 }]);
        expect(article.citations[0]?.text).toContain("https://revista.test/la-culpa/");
    });

    it("keeps the content module's status, so a missing post is a 404 and not a 500", async () => {
        nitro.getEntry.mockRejectedValue(Object.assign(new Error("http"), { statusCode: 404 }));

        await expect(handler({})).rejects.toMatchObject({ statusCode: 404 });
    });
});
