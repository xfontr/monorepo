import { fakeAuthor, fakeEntry, fakeTerm } from "@monorepo/content/testing";
import { describe, expect, it } from "vitest";
import type { ArticleSummary } from "../../shared/types/ArticleSummary";
import type { ListingQuery } from "../../shared/types/ListingQuery";
import { toArticleListing } from "./articleListing";
import { toArticleSummary, toCategory } from "./articleSummary";

const CIVIL = fakeTerm({ name: "Derecho civil" });
const PENAL = fakeTerm({ name: "Derecho penal" });
const COMMENTS = fakeTerm({ resource: "tags", slug: "jurisprudencia-tc" });
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

    it("keeps undated posts last when oldest first, rather than leading with them", () => {
        const [dated, undated] = [index(2), index(1, { publishedAt: undefined })];

        expect(
            toArticleListing([...dated, ...undated], { ...QUERY, sort: "oldest" }).items,
        ).toEqual([...dated.reverse(), ...undated]);
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
        const articles = [...index(3), ...index(2, { terms: [CIVIL, COMMENTS] })];

        const listing = toArticleListing(articles, { ...QUERY, format: "comentario" });

        expect(listing.total).toBe(2);
        expect(listing.formats).toEqual([
            { value: "articulo", count: 3 },
            { value: "comentario", count: 2 },
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

    it.each<[string, string, Parameters<typeof fakeEntry>[0]]>([
        ["title", "estafa informatica", { title: "La estafa informática" }],
        ["excerpt", "COMPRAVENTA", { excerpt: { format: "html", value: "<p>Compraventa</p>" } }],
        ["subject", "derecho penal", { terms: [PENAL] }],
        [
            "tag",
            "proteccion de datos",
            { terms: [CIVIL, fakeTerm({ resource: "tags", name: "Protección de datos" })] },
        ],
        ["author", "alvaro nunez", { authors: [fakeAuthor({ name: "Álvaro Núñez" })] }],
    ])(
        "finds a post by its %s however the query is accented or cased",
        (_field, search, overrides) => {
            const [sought] = index(1, overrides);

            const listing = toArticleListing([...index(3), sought!], { ...QUERY, query: search });

            expect(listing.items).toEqual([sought]);
        },
    );

    it("matches when every word appears in some field, not only as one phrase", () => {
        const [both] = index(1, { terms: [PENAL], authors: [fakeAuthor({ name: "Ana Ruiz" })] });
        const onlyAuthor = index(1, { authors: [fakeAuthor({ name: "Ana Ruiz" })] });

        const listing = toArticleListing([...onlyAuthor, both!], { ...QUERY, query: "ruiz penal" });

        expect(listing.items).toEqual([both]);
    });

    it("counts the format pills within the search, but keeps every subject in the aside", () => {
        const sought = index(2, { title: "Culpabilidad", terms: [PENAL, COMMENTS] });
        const articles = [...index(3), ...sought];

        const listing = toArticleListing(articles, { ...QUERY, query: "culpabilidad" });

        expect(listing.total).toBe(2);
        expect(listing.formats).toEqual([{ value: "comentario", count: 2 }]);
        expect(listing.subjects.map(({ value }) => value.name)).toEqual([
            "Derecho civil",
            "Derecho penal",
        ]);
    });

    it("lists the whole archive for a blank query rather than nothing", () => {
        expect(toArticleListing(index(3), { ...QUERY, query: "" }).total).toBe(3);
    });
});
