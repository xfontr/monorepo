import { describe, expect, it } from "vitest";
import { toArticleBody } from "./articleBody";

const html = (body: string) => {
    const { lead, html } = toArticleBody(body);

    return lead + html;
};

describe("sanitising", () => {
    it.each([
        ["an inline handler", "<p onclick=\"steal()\">Texto</p>", "onclick"],
        ["a javascript: link", "<p><a href=\"javascript:steal()\">enlace</a></p>", "javascript:"],
        ["an iframe", "<iframe src=\"https://evil.test\"></iframe><p>Texto</p>", "iframe"],
        ["an inline style", "<p style=\"position:fixed\">Texto</p>", "style"],
    ])("removes %s", (_, body, unsafe) => {
        expect(html(body)).not.toContain(unsafe);
    });

    it("removes a script with its text, rather than leaving the code as prose", () => {
        expect(html("<p>Antes</p><script>alert(1)</script>")).toBe("<p>Antes</p>");
    });

    // 50 bodies open with a pasted `<meta charset>`; parsed as a document it would drag in a `<head>`
    it("drops a pasted meta tag without wrapping the body in a document", () => {
        expect(html("<meta charset=\"utf-8\"><p>Texto</p>")).toBe("<p>Texto</p>");
    });

    it("keeps figures, captions, cites and responsive images, which the default schema drops", () => {
        const body = "<figure><img src=\"/a.jpg\" alt=\"Sala\" srcset=\"/a-300.jpg 300w\" sizes=\"100vw\"><figcaption>Sala</figcaption></figure>"
          + "<blockquote><p>Cita</p><cite>Autor</cite></blockquote>";

        expect(html(body)).toContain("srcset=\"/a-300.jpg 300w\" sizes=\"100vw\"");
        expect(html(body)).toContain("<figcaption>Sala</figcaption>");
        expect(html(body)).toContain("<cite>Autor</cite>");
    });

    it("keeps an existing id as written, not prefixed with user-content-", () => {
        expect(html("<p id=\"_ftn1\">Nota</p>")).toBe("<p id=\"_ftn1\">Nota</p>");
    });

    it("lazy-loads every body image", () => {
        expect(html("<p><img src=\"/a.jpg\" alt=\"\"></p>")).toBe("<p><img src=\"/a.jpg\" alt=\"\" loading=\"lazy\" decoding=\"async\"></p>");
    });
});

describe("the lead", () => {
    it("ends after the first top-level paragraph, so the featured image never lands inside a quote", () => {
        expect(toArticleBody("<blockquote><p>Cita</p></blockquote><p>Uno</p><p>Dos</p>")).toMatchObject({
            lead: "<blockquote><p>Cita</p></blockquote><p>Uno</p>",
            html: "<p>Dos</p>",
        });
    });

    it("is empty when the body has no paragraph, so the image goes first", () => {
        expect(toArticleBody("<h2>Uno</h2>")).toMatchObject({ lead: "", html: "<h2 id=\"uno\">Uno</h2>" });
    });
});

describe("the class map", () => {
    it.each([
        ["contenedor", "hl-note"],
        ["cita-larga", "hl-quote"],
        ["cita-corta", "hl-quote-short"],
        ["texto-importante", "hl-callout"],
        ["texto-destacado", "hl-highlight"],
        ["wp-block-table", "wp-block-table"],
    ])("renames the theme's %s to %s", (from, to) => {
        expect(html(`<div class="${from}"><p>Texto</p></div>`)).toBe(`<div class="${to}"><p>Texto</p></div>`);
    });

    // Tailwind utilities are global, so a pasted `hidden` would hide the paragraph
    it("drops every other class", () => {
        expect(html("<p class=\"hidden contenedor\">Texto</p>")).toBe("<p class=\"hl-note\">Texto</p>");
    });

    it("maps a class on a tag the default schema narrows to its own classes", () => {
        expect(html("<ul class=\"contenedor\"><li>Uno</li></ul>")).toBe("<ul class=\"hl-note\"><li>Uno</li></ul>");
    });
});

describe("headings and the TOC", () => {
    it("gives each h2 and h3 an ASCII id and lists them in order", () => {
        const body = toArticleBody("<h2>Introducción</h2><h3>El tipo  <em>objetivo</em></h3>");

        expect(body.toc).toEqual([
            { id: "introduccion", label: "Introducción", level: 2 },
            { id: "el-tipo-objetivo", label: "El tipo objetivo", level: 3 },
        ]);
        expect(html("<h2>Introducción</h2>")).toContain("<h2 id=\"introduccion\">");
    });

    // 13 posts already carry heading ids, and old deep links point at them
    it("keeps a heading's existing id", () => {
        expect(toArticleBody("<h2 id=\"conclusiones-finales\">Conclusiones</h2>").toc[0]?.id).toBe("conclusiones-finales");
    });

    it("never repeats an id", () => {
        expect(toArticleBody("<h2>Dolo</h2><h2>Dolo</h2>").toc.map(({ id }) => id)).toEqual(["dolo", "dolo-2"]);
    });

    it("leaves out h4 and deeper, and headings with no text", () => {
        expect(toArticleBody("<h2> </h2><h4>Detalle</h4>").toc).toEqual([]);
    });

    it("falls back to a readable id for a heading with no letters", () => {
        expect(toArticleBody("<h2>§</h2>").toc[0]?.id).toBe("seccion");
    });
});

describe("the bibliography", () => {
    it("splits from the heading to the end, one fragment per reference", () => {
        const source = "<h2>Conclusiones</h2><p>Fin.</p>"
          + "<h2>Bibliografía</h2><p>ROXIN, C., <em>Derecho penal</em>.</p><ul><li>MIR PUIG, S.</li><li> </li></ul>";
        const body = toArticleBody(source);

        expect(body.bibliography).toEqual(["ROXIN, C., <em>Derecho penal</em>.", "MIR PUIG, S."]);
        expect(html(source)).not.toContain("Bibliografía");
        expect(body.toc.map(({ label }) => label)).toEqual(["Conclusiones"]);
    });

    it.each(["Bibliografía", "BIBLIOGRAFÍA:", "Fuentes", "Referencias bibliográficas"])("recognises a %s heading", (heading) => {
        expect(toArticleBody(`<h3>${heading}</h3><p>Una obra.</p>`).bibliography).toEqual(["Una obra."]);
    });

    // "Fuentes" is also a subject in a law blog, and cutting there would drop the rest of the article
    it("does not take a section about the sources of law for the bibliography", () => {
        expect(toArticleBody("<h2>Las fuentes del Derecho</h2><p>La ley.</p>").bibliography).toEqual([]);
    });

    it("leaves an empty bibliography heading in the body rather than hiding it", () => {
        expect(html("<p>Intro</p><h2>Bibliografía</h2>")).toContain("Bibliografía");
    });

    it("sanitises every reference, not only the body", () => {
        expect(toArticleBody("<h2>Bibliografía</h2><p onclick=\"x()\"><a href=\"javascript:x()\">Obra</a></p>").bibliography)
            .toEqual(["<a>Obra</a>"]);
    });
});

describe("footnotes", () => {
    const TEXT = "<p>El dolo<a href=\"#_ftn1\" id=\"_ftnref1\"><u>[1]</u></a> y la culpa<a id=\"_ftnref2\" href=\"#_ftn2\">[2]</a>.</p>";
    const NOTES = "<p><a href=\"#_ftnref1\" id=\"_ftn1\">[1]</a> ROXIN, <em>Derecho penal</em>.</p><p><a href=\"#_ftnref2\" id=\"_ftn2\">[2]</a>&nbsp;MIR PUIG.</p>";

    it("turns `_ftn` references into the links the notes list answers", () => {
        expect(html(TEXT + NOTES)).toBe("<p>El dolo<sup><a href=\"#nota-1\" id=\"ref-1\">1</a></sup> y la culpa<sup><a href=\"#nota-2\" id=\"ref-2\">2</a></sup>.</p>");
    });

    it("keeps each note's text without its marker", () => {
        expect(toArticleBody(TEXT + NOTES).notes).toEqual([{ id: "1", html: "ROXIN, <em>Derecho penal</em>." }, { id: "2", html: "MIR PUIG." }]);
    });

    it("takes the notes out before the bibliography, so they aren't read as references", () => {
        const body = toArticleBody(`${TEXT}<h2>Bibliografía</h2><p>ROXIN, C.</p><hr>${NOTES}`);

        expect(body.notes).toHaveLength(2);
        expect(body.bibliography).toEqual(["ROXIN, C."]);
    });

    // Ordinals such as 30.<sup>a</sup> and stray reference numbers are the only <sup>s in the corpus
    it("leaves every other shape as written", () => {
        const source = "<p>El dolo<sup>1</sup>, en la 30.<sup>a</sup> edición.</p><p><sup>1</sup> ROXIN.</p>";

        expect(html(source)).toBe(source);
        expect(toArticleBody(source).notes).toEqual([]);
    });
});
