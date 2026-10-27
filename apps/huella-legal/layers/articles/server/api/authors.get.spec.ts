import { fakeAuthor, fakeEntry } from "@monorepo/content/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleSummary } from "../../shared/types/ArticleSummary";
import type { Author } from "../../shared/types/Author";
import type { Facet } from "../../shared/types/Facet";
import { toArticleSummary } from "../mappers/articleSummary";

const nitro = vi.hoisted(() => ({ index: [] as ArticleSummary[] }));

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);

vi.mock("../services/articleIndex", () => ({
    getArticleIndex: () => Promise.resolve(nitro.index),
}));

const handler = (await import("./authors.get")).default as unknown as (
    event: unknown,
) => Promise<Facet<Author>[]>;

const AUTHOR = fakeAuthor();

beforeEach(() => {
    nitro.index = [
        toArticleSummary(fakeEntry({ authors: [AUTHOR] })),
        toArticleSummary(fakeEntry({ authors: [AUTHOR] })),
        toArticleSummary(fakeEntry({ authors: [fakeAuthor()] })),
    ];
});

describe("GET /api/authors", () => {
    it("answers every author of the index with their post count, the most published first", async () => {
        const authors = await handler({});

        expect(authors).toHaveLength(2);
        expect(authors[0]).toMatchObject({ value: { id: AUTHOR.id }, count: 2 });
    });
});
