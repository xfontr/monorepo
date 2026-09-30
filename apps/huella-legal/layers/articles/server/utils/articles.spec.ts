import type { Entry, Term } from "@monorepo/content";
import { describe, expect, it } from "vitest";
import { toArticleSummary } from "./articles";

const category = (slug: string, name = slug): Term => ({ id: slug, resource: "categories", slug, name });
const tag = (slug: string, name = slug): Term => ({ id: slug, resource: "tags", slug, name });

const words = (count: number) => `<p>${"palabra ".repeat(count)}</p>`;

// Synthetic, in the shape `@monorepo/content` maps a WordPress post to
const entry: Entry = {
    id: "31",
    slug: "la-prueba-de-la-culpa",
    title: "La &#8220;prueba&#8221; de la culpa &#8211; notas",
    excerpt: { format: "html", value: "<p>Un resumen de la culpa [&hellip;]</p>\n" },
    body: { format: "html", value: words(460) },
    publishedAt: "2025-03-11T23:30:00Z",
    updatedAt: "2025-04-01T10:00:00Z",
    image: { id: "8", url: "https://wp.test/uploads/culpa.jpg", alt: "" },
    terms: [category("derecho-penal", "Derecho penal"), tag("dogmatica", "Dogmática")],
    authors: [{ id: "4", slug: "ana-ejemplo", name: "Ana Ejemplo", bio: "Inventada." }],
};

const summarise = (overrides: Partial<Entry>) => toArticleSummary({ ...entry, ...overrides });

describe("toArticleSummary", () => {
    it("maps an entry into the shape the cards are typed against", () => {
        expect(toArticleSummary(entry)).toEqual({
            id: "31",
            slug: "la-prueba-de-la-culpa",
            title: "La “prueba” de la culpa – notas",
            excerpt: "Un resumen de la culpa",
            publishedAt: "2025-03-11T23:30:00Z",
            updatedAt: "2025-04-01T10:00:00Z",
            image: { id: "8", url: "https://wp.test/uploads/culpa.jpg", alt: "" },
            authors: [{ id: "4", slug: "ana-ejemplo", name: "Ana Ejemplo", bio: "Inventada." }],
            category: { id: "derecho-penal", slug: "derecho-penal", name: "Derecho penal" },
            tags: [{ id: "dogmatica", slug: "dogmatica", name: "Dogmática" }],
            format: "articulo",
            readingMinutes: 2,
        });
    });

    it("decodes the names WordPress escaped", () => {
        const result = summarise({
            terms: [category("tfg", "TFG &amp; TFM")],
            authors: [{ id: "1", slug: "a", name: "Ana &amp; Bruno" }],
        });

        expect(result.category?.name).toBe("TFG & TFM");
        expect(result.authors[0]?.name).toBe("Ana & Bruno");
    });

    it("leaves an unset avatar unset, so UAvatar falls back to initials", () => {
        expect(toArticleSummary(entry).authors[0]?.avatar).toBeUndefined();
    });
});

describe("the primary category", () => {
    // 103 of 105 posts have exactly one category; the rest are read by their first
    it("is the first category", () => {
        expect(summarise({ terms: [category("civil"), category("penal")] }).category?.slug).toBe("civil");
    });

    it("is unset on a post that has none, rather than borrowed from a tag", () => {
        expect(summarise({ terms: [tag("dogmatica")] }).category).toBeUndefined();
    });
});

describe("the excerpt", () => {
    it("keeps a hand-written excerpt whole", () => {
        expect(summarise({ excerpt: { format: "html", value: "<p>Escrito a mano.</p>" } }).excerpt).toBe("Escrito a mano.");
    });

    it("keeps words apart across paragraphs", () => {
        expect(summarise({ excerpt: { format: "html", value: "<p>Uno</p><p>dos</p>" } }).excerpt).toBe("Uno dos");
    });

    it.each([undefined, { format: "html" as const, value: "<p></p>" }])("is unset when WordPress rendered %o", (excerpt) => {
        expect(summarise({ excerpt }).excerpt).toBeUndefined();
    });
});

describe("the reading time", () => {
    it.each([[0, 1], [230, 1], [231, 2], [2300, 10]])("reads %i words in %i minutes", (count, minutes) => {
        expect(summarise({ body: { format: "html", value: words(count) } }).readingMinutes).toBe(minutes);
    });

    // Bodies carry `<meta charset>` (50 posts) and empty icon spans (23 uses); neither is reading
    it("does not count markup as reading", () => {
        const html = "<meta charset=\"utf-8\"><span class=\"superfontello3-quote\"></span>"
          + `<img src="https://wp.test/uploads/a.jpg" alt="una foto larga">${words(230)}`;

        expect(summarise({ body: { format: "html", value: html } }).readingMinutes).toBe(1);
    });
});

describe("the format", () => {
    const formatOf = (...terms: Term[]) => summarise({ terms }).format;

    it("reads an essay from the ensayos category", () => {
        expect(formatOf(category("ensayos"))).toBe("ensayo");
    });

    it("reads a TFG or TFM from its tag", () => {
        expect(formatOf(category("derecho-civil"), tag("trabajos-de-fin-de-grado"))).toBe("tfg-tfm");
    });

    it("reads a case comment from any jurisprudencia- tag", () => {
        expect(formatOf(tag("jurisprudencia-tribunal-supremo"))).toBe("comentario");
    });

    it("does not take a bare jurisprudencia tag for a case comment", () => {
        expect(formatOf(tag("jurisprudencia"))).toBe("articulo");
    });

    it("does not take an ensayos tag for the essay category", () => {
        expect(formatOf(tag("ensayos"))).toBe("articulo");
    });

    it("ranks a TFG above an essay, and an essay above a case comment", () => {
        expect(formatOf(category("ensayos"), tag("trabajos-de-fin-de-grado"), tag("jurisprudencia-tc"))).toBe("tfg-tfm");
        expect(formatOf(category("ensayos"), tag("jurisprudencia-tc"))).toBe("ensayo");
    });
});
