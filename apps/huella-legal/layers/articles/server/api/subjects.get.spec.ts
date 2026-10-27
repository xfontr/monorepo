import { fakeEntry, fakeTerm } from "@monorepo/content/testing";
import { describe, expect, it, vi } from "vitest";
import type { ArticleSummary } from "../../shared/types/ArticleSummary";
import type { Category } from "../../shared/types/Category";
import type { SubjectIndex } from "../../shared/types/SubjectIndex";
import { toArticleSummary, toCategory } from "../mappers/articleSummary";

const nitro = vi.hoisted(() => ({
    index: [] as ArticleSummary[],
    categories: [] as Category[],
}));

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);

vi.mock("../services/articleIndex", () => ({
    getArticleIndex: () => Promise.resolve(nitro.index),
}));
vi.mock("../services/categories", () => ({
    getCategories: () => Promise.resolve(nitro.categories),
}));

const handler = (await import("./subjects.get")).default as unknown as (
    event: unknown,
) => Promise<SubjectIndex>;

const CIVIL = fakeTerm({ name: "Derecho civil", description: "Personas y contratos." });

describe("GET /api/subjects", () => {
    it("answers each subject with the description its category carries and its post count", async () => {
        nitro.index = [toArticleSummary(fakeEntry({ terms: [CIVIL] }))];
        nitro.categories = [toCategory(CIVIL)];

        const { subjects } = await handler({});

        expect(subjects).toEqual([{ value: toCategory(CIVIL), count: 1 }]);
    });
});
