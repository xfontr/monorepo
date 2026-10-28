import { fakeEntry, fakeTerm } from "@monorepo/content/testing";
import { describe, expect, it } from "vitest";
import { toArticleSearch, toSuggestedSubjects } from "./articleSearch";
import { toArticleSummary, toCategory } from "./articleSummary";

const CIVIL = fakeTerm({ name: "Derecho &amp; civil" });
const PENAL = fakeTerm();
const LABOUR = fakeTerm();

const summaries = (count: number, term: typeof CIVIL) =>
    Array.from({ length: count }, () => toArticleSummary(fakeEntry({ terms: [term] })));

describe("toArticleSearch", () => {
    it("maps every match into a summary, so no raw entry reaches the browser", () => {
        const entry = fakeEntry({ title: "La &#8220;culpa&#8221;" });

        const search = toArticleSearch("culpa", {
            items: [entry],
            page: 1,
            perPage: 20,
            total: 1,
            totalPages: 1,
        });

        expect(search.items).toEqual([toArticleSummary(entry)]);
        expect(search).toMatchObject({ query: "culpa", total: 1, subjects: [] });
    });

    it("still answers one page when nothing matched, so its first page is not past the end", () => {
        const search = toArticleSearch("nada", {
            items: [],
            page: 1,
            perPage: 20,
            total: 0,
            totalPages: 0,
        });

        expect(search.totalPages).toBe(1);
    });
});

describe("toSuggestedSubjects", () => {
    it("suggests the four subjects with the most publications, most first", () => {
        const extra = [fakeTerm(), fakeTerm()];
        const index = [
            ...summaries(1, PENAL),
            ...summaries(3, CIVIL),
            ...summaries(2, LABOUR),
            ...extra.flatMap((term) => summaries(1, term)),
        ];

        const subjects = toSuggestedSubjects(index);

        expect(subjects).toHaveLength(4);
        expect(subjects.slice(0, 2)).toEqual([toCategory(CIVIL), toCategory(LABOUR)]);
    });

    it("leaves out articles with no subject instead of suggesting an empty one", () => {
        expect(toSuggestedSubjects([toArticleSummary(fakeEntry({ terms: [] }))])).toEqual([]);
    });
});
