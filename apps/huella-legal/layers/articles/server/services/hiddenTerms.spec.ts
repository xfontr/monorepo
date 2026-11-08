import { fakeEntry, fakeTerm } from "@monorepo/content/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toArticleSummary, toCategory } from "../mappers/articleSummary";

const nitro = vi.hoisted(() => ({ hiddenTerms: [] as string[] }));

vi.stubGlobal("useRuntimeConfig", () => ({ articles: { hiddenTerms: nitro.hiddenTerms } }));

const { isHiddenTerm, isListed } = await import("./hiddenTerms");

const HIDDEN = fakeTerm({ resource: "tags", slug: "consultas-legales-gratuitas" });
const OTHER = fakeTerm({ resource: "tags", slug: "derecho-civil" });

beforeEach(() => {
    nitro.hiddenTerms = [HIDDEN.slug];
});

describe("isHiddenTerm", () => {
    it("matches a listed tag by slug and leaves every other tag visible", () => {
        expect(isHiddenTerm(toCategory(HIDDEN))).toBe(true);
        expect(isHiddenTerm(toCategory(OTHER))).toBe(false);
    });
});

describe("isListed", () => {
    it("drops an article filed under a hidden category", () => {
        const category = fakeTerm({ slug: HIDDEN.slug });

        expect(isListed(toArticleSummary(fakeEntry({ terms: [category] })))).toBe(false);
    });

    it("drops an article carrying a hidden tag beside visible ones", () => {
        expect(isListed(toArticleSummary(fakeEntry({ terms: [OTHER, HIDDEN] })))).toBe(false);
        expect(isListed(toArticleSummary(fakeEntry({ terms: [OTHER] })))).toBe(true);
    });

    // An empty list is how the env var switches hiding off
    it("lists everything once the list is emptied", () => {
        nitro.hiddenTerms = [];

        expect(isListed(toArticleSummary(fakeEntry({ terms: [HIDDEN] })))).toBe(true);
    });
});
