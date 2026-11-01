import { fakeAuthor, fakeEntry } from "@monorepo/content/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleSummary } from "../../shared/types/ArticleSummary";
import { toArticleSummary } from "../mappers/articleSummary";

const nitro = vi.hoisted(() => ({ index: [] as ArticleSummary[], header: vi.fn() }));

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("setResponseHeader", nitro.header);
vi.stubGlobal("useRuntimeConfig", () => ({ public: { site: { url: "https://revista.test" } } }));
vi.stubGlobal("useAppConfig", () => ({ journal: { name: "Huella Legal", issn: "0000-0000" } }));

vi.mock("../services/articleIndex", () => ({
    getArticleIndex: () => Promise.resolve(nitro.index),
}));

const handler = (await import("./feed.get")).default as unknown as (
    event: unknown,
) => Promise<string>;

const items = (xml: string): string[] => xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

beforeEach(() => {
    vi.clearAllMocks();
    nitro.index = Array.from({ length: 25 }, () => toArticleSummary(fakeEntry()));
});

describe("GET /feed", () => {
    it("carries the twenty newest articles of the index, in its order", async () => {
        const feed = items(await handler({}));

        expect(feed).toHaveLength(20);
        expect(feed[0]).toContain(`<link>https://revista.test/${nitro.index[0]?.slug}/</link>`);
    });

    it("leaves out a post the CMS marks noindex", async () => {
        nitro.index = [toArticleSummary(fakeEntry({ slug: "borrador", seo: { noindex: true } }))];

        expect(items(await handler({}))).toEqual([]);
    });

    it("names every author of a post, not only the first", async () => {
        const authors = [fakeAuthor(), fakeAuthor()];
        nitro.index = [toArticleSummary(fakeEntry({ authors }))];

        const [item] = items(await handler({}));

        for (const { name } of authors) expect(item).toContain(`<author>${name}</author>`);
    });

    it("dates each item in RFC 822, which RSS readers require", async () => {
        nitro.index = [toArticleSummary(fakeEntry({ publishedAt: "2024-03-09T10:00:00Z" }))];

        expect(items(await handler({}))[0]).toContain(
            "<pubDate>Sat, 09 Mar 2024 10:00:00 GMT</pubDate>",
        );
    });

    it("serves RSS, so readers recognise the feed", async () => {
        await handler({});

        expect(nitro.header).toHaveBeenCalledWith(
            {},
            "content-type",
            "application/rss+xml; charset=utf-8",
        );
    });
});
