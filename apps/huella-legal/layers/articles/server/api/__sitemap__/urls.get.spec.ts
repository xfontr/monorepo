import { fakeAuthor, fakeEntry, fakeTerm } from "@monorepo/content/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleSummary } from "../../../shared/types/ArticleSummary";
import type { Category } from "../../../shared/types/Category";
import { toArticleSummary, toCategory } from "../../mappers/articleSummary";

interface SitemapUrl {
    loc: string;
    lastmod?: string;
}

const AUTHOR = fakeAuthor({ slug: "ana-ruiz" });

const nitro = vi.hoisted(() => ({
    index: [] as ArticleSummary[],
    categories: [] as Category[],
    getEntry: vi.fn(),
}));

vi.stubGlobal("defineSitemapEventHandler", (handler: unknown) => handler);
vi.stubGlobal("useRuntimeConfig", () => ({ public: { pageSlugs: ["aviso-legal", "oculta"] } }));
vi.stubGlobal("useContent", () => ({ getEntry: nitro.getEntry }));

vi.mock("../../services/articleIndex", () => ({
    getArticleIndex: () => Promise.resolve(nitro.index),
}));

vi.mock("../../services/categories", () => ({
    getCategories: () => Promise.resolve(nitro.categories),
}));

const handler = (await import("./urls.get")).default as unknown as (
    event: unknown,
) => Promise<SitemapUrl[]>;

const locs = async () => (await handler({})).map(({ loc }) => loc);

beforeEach(() => {
    vi.clearAllMocks();
    nitro.index = [
        toArticleSummary(
            fakeEntry({ slug: "la-culpa", updatedAt: "2025-05-02T08:00:00Z", authors: [AUTHOR] }),
        ),
        toArticleSummary(fakeEntry({ slug: "borrador", seo: { noindex: true } })),
    ];
    nitro.categories = [toCategory(fakeTerm({ slug: "penal", seo: { noindex: true } }))];
    nitro.getEntry.mockImplementation((_resource: string, slug: string) =>
        Promise.resolve(fakeEntry({ slug, seo: { noindex: slug === "oculta" } })),
    );
});

describe("GET /api/__sitemap__/urls", () => {
    it("lists posts, kept pages, áreas and colaboradores", async () => {
        expect(await locs()).toEqual(
            expect.arrayContaining([
                "/la-culpa/",
                "/aviso-legal/",
                "/areas/penal/",
                "/colaboradores/ana-ruiz/",
            ]),
        );
    });

    it("leaves out a post or a page the CMS marks noindex", async () => {
        const urls = await locs();

        expect(urls).not.toContain("/borrador/");
        expect(urls).not.toContain("/oculta/");
    });

    it("dates a post by when it was last changed", async () => {
        expect(await handler({})).toContainEqual({
            loc: "/la-culpa/",
            lastmod: "2025-05-02T08:00:00Z",
        });
    });

    it("still lists the posts when WordPress can't serve one of the pages", async () => {
        nitro.getEntry.mockImplementation((_resource: string, slug: string) =>
            slug === "oculta"
                ? Promise.reject(new Error("not found"))
                : Promise.resolve(fakeEntry({ slug })),
        );

        expect(await locs()).toEqual(expect.arrayContaining(["/la-culpa/", "/aviso-legal/"]));
    });

    it("lists each colaborador once, however many posts they wrote", async () => {
        nitro.index.push(toArticleSummary(fakeEntry({ authors: [AUTHOR] })));

        expect((await locs()).filter((loc) => loc.endsWith("/ana-ruiz/"))).toHaveLength(1);
    });
});
