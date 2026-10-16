import { fakeAuthor, fakeEntry, fakeTerm } from "@monorepo/content/testing";
import { describe, expect, it } from "vitest";
import type { ArticleSummary } from "../../shared/types/ArticleSummary";
import type { ListingQuery } from "../../shared/types/ListingQuery";
import { toArticleListing } from "./articleListing";
import { toArticleSummary, toCategory } from "./articleSummary";

const CIVIL = fakeTerm({ name: "Derecho civil" });
const PENAL = fakeTerm({ name: "Derecho penal" });
const ESSAYS = fakeTerm({ slug: "ensayos", name: "Ensayos" });
const THESIS = fakeTerm({ resource: "tags", slug: "trabajos-de-fin-de-grado" });
const AUTHOR = fakeAuthor();

const QUERY: ListingQuery = { page: 1, sort: "newest" };

const index = (count: number, overrides: Parameters<typeof fakeEntry>[0] = {}): ArticleSummary[] =>
    Array.from({ length: count }, () =>
        toArticleSummary(fakeEntry({ terms: [CIVIL], ...overrides })),
    );

describe("toArticleListing", () => {
    it("pages twenty at a time and reports the pages the pagination needs", () => {
        const articles = index(45);

        const listing = toArticleListing(articles, { ...QUERY, page: 3 });

        expect(listing.items).toEqual(articles.slice(40));
        expect(listing).toMatchObject({ page: 3, perPage: 20, total: 45, totalPages: 3 });
    });

    it("still answers one page for an empty listing, so its first page is not past the end", () => {
        expect(toArticleListing([], QUERY)).toMatchObject({ items: [], total: 0, totalPages: 1 });
    });

    // The index is kept newest first, so oldest first is that order reversed
    it("puts the oldest first when asked", () => {
        const articles = index(3);

        expect(toArticleListing(articles, { ...QUERY, sort: "oldest" }).items).toEqual(
            [...articles].reverse(),
        );
    });

    it("keeps a subject's listing to posts whose primary category it is", () => {
        const civil = index(2);
        const penal = index(1, { terms: [PENAL, CIVIL] });

        const listing = toArticleListing([...civil, ...penal], QUERY, {
            kind: "category",
            term: toCategory(CIVIL),
        });

        expect(listing.items).toEqual(civil);
    });

    it("finds a tag among every tag a post carries", () => {
        const tagged = index(1, { terms: [CIVIL, fakeTerm({ resource: "tags" }), THESIS] });

        const listing = toArticleListing([...index(2), ...tagged], QUERY, {
            kind: "tag",
            term: toCategory(THESIS),
        });

        expect(listing.items).toEqual(tagged);
    });

    it("counts formats before the format filter, so the other pills keep their numbers", () => {
        const articles = [...index(3), ...index(2, { terms: [ESSAYS] })];

        const listing = toArticleListing(articles, { ...QUERY, format: "ensayo" });

        expect(listing.total).toBe(2);
        expect(listing.formats).toEqual([
            { value: "articulo", count: 3 },
            { value: "ensayo", count: 2 },
        ]);
    });

    it("lists every subject everywhere but on an author's profile, where it lists theirs", () => {
        const theirs = index(2, { terms: [PENAL], authors: [AUTHOR] });
        const articles = [...index(3), ...theirs];

        const everywhere = toArticleListing(articles, QUERY, {
            kind: "category",
            term: toCategory(PENAL),
        });
        const profile = toArticleListing(articles, QUERY, {
            kind: "author",
            author: theirs[0]!.authors[0]!,
        });

        expect(everywhere.subjects.map(({ value, count }) => [value.name, count])).toEqual([
            ["Derecho civil", 3],
            ["Derecho penal", 2],
        ]);
        expect(profile.subjects.map(({ value, count }) => [value.name, count])).toEqual([
            ["Derecho penal", 2],
        ]);
        expect(profile.items).toEqual(theirs);
    });
});
