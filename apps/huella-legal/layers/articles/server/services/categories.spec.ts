import { fakeTerm } from "@monorepo/content/testing";
import { describe, expect, it, vi } from "vitest";
import type { Category } from "../../shared/types/Category";

const nitro = vi.hoisted(() => ({
    listTerms: vi.fn(),
    cache: {} as { getKey?: () => string; maxAge?: number; swr?: boolean },
    window: { maxAge: 300, swr: false },
}));

vi.stubGlobal("defineCachedFunction", (fn: unknown, options: typeof nitro.cache) => {
    nitro.cache = options;

    return fn;
});
vi.stubGlobal("useRuntimeConfig", () => ({ articles: { cache: nitro.window } }));
vi.stubGlobal("useContent", () => ({ listTerms: nitro.listTerms }));

const { getCategories } = (await import("./categories")) as unknown as {
    getCategories: (event: unknown) => Promise<Category[]>;
};

const CIVIL = fakeTerm({ name: "Derecho &amp; civil", description: "Personas y contratos." });
const PENAL = fakeTerm({ name: "Derecho penal", description: "Teoría del delito." });

describe("getCategories", () => {
    it("reads every page of categories, so one past the first page keeps its description", async () => {
        nitro.listTerms
            .mockResolvedValueOnce({ items: [CIVIL], totalPages: 2 })
            .mockResolvedValueOnce({ items: [PENAL], totalPages: 2 });

        const categories = await getCategories({});

        expect(nitro.listTerms.mock.calls).toEqual([
            ["categories", { page: 1, perPage: 50 }],
            ["categories", { page: 2, perPage: 50 }],
        ]);
        expect(categories.map(({ name, description }) => [name, description])).toEqual([
            ["Derecho & civil", "Personas y contratos."],
            ["Derecho penal", "Teoría del delito."],
        ]);
    });

    it("is cached as one entry, so the subjects index never rereads WordPress per request", () => {
        expect(nitro.cache.getKey?.()).toBe("categories");
    });

    it("caches for the window the runtime config sets, not a fixed one", () => {
        expect(nitro.cache).toMatchObject(nitro.window);
    });
});
