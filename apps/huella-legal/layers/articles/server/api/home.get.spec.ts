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

const handler = (await import("./home.get")).default as unknown as (
    event: unknown,
) => Promise<Home>;

describe("GET /api/home", () => {
    it("leads with the newest post of the cached index", async () => {
        nitro.index = [fakeEntry(), fakeEntry()].map(toArticleSummary);

        const { lead, latest } = await handler({});

        expect(lead).toEqual(nitro.index[0]);
        expect(latest).toEqual([nitro.index[1]]);
    });
});
