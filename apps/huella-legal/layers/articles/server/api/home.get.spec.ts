import { fakeEntry } from "@monorepo/content/testing";
import { describe, expect, it, vi } from "vitest";
import type { ArticleSummary } from "../../shared/types/ArticleSummary";
import type { Home } from "../../shared/types/Home";
import { toArticleSummary } from "../mappers/articleSummary";

const nitro = vi.hoisted(() => ({ index: [] as ArticleSummary[] }));

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);

vi.mock("../services/articleIndex", () => ({
    getArticleIndex: () => Promise.resolve(nitro.index),
}));

vi.mock("../services/commentCounts", () => ({
    withCommentCounts: (_event: unknown, summaries: ArticleSummary[]) =>
        Promise.resolve(summaries.map((summary) => ({ ...summary, commentCount: 2 }))),
}));

const handler = (await import("./home.get")).default as unknown as (
    event: unknown,
) => Promise<Home>;

describe("GET /api/home", () => {
    it("leads with the newest post of the cached index", async () => {
        nitro.index = [fakeEntry(), fakeEntry()].map(toArticleSummary);

        const { lead, latest } = await handler({});

        expect(lead?.id).toBe(nitro.index[0]?.id);
        expect(latest.map(({ id }) => id)).toEqual([nitro.index[1]?.id]);
    });

    it("puts each card's comment count on the index before choosing from it", async () => {
        nitro.index = [fakeEntry(), fakeEntry()].map(toArticleSummary);

        const { lead, latest } = await handler({});

        expect([lead, ...latest].map((summary) => summary?.commentCount)).toEqual([2, 2]);
    });
});
