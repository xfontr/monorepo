import { fakeEntry } from "@monorepo/content/testing";
import { describe, expect, it } from "vitest";
import { toPage } from "./page";

const SITE = "https://revista.test";

const page = (html: string, overrides = {}) =>
    toPage(fakeEntry({ body: { format: "html", value: html }, ...overrides }), SITE);

describe("toPage", () => {
    it("splits the first paragraph off as the lead and keeps the rest as the body", () => {
        const { lead, html } = page("<p>Uno</p><h2>Dos</h2><p>Tres</p>").body;

        expect(lead).toBe("<p>Uno</p>");
        expect(html).toContain("Tres");
    });

    // The footer's legal links target these ids, so rewording a heading in WordPress breaks them
    it("gives each heading the id its slug makes, accents folded, and lists it in the TOC", () => {
        const { html, toc } = page(
            "<p>Uno</p><h2>Política de Privacidad</h2><h2>Cookies</h2>",
        ).body;

        expect(html).toContain('id="politica-de-privacidad"');
        expect(html).toContain('id="cookies"');
        expect(toc.map(({ id }) => id)).toEqual(["politica-de-privacidad", "cookies"]);
    });

    it("keeps footnotes and a closing reference list, which the view renders below the text", () => {
        const { notes, bibliography } = page(
            '<p>Uno<a href="#_ftn1">[1]</a></p><h2>Fuentes</h2><p>Una ley</p>' +
                '<hr><p><a href="#_ftnref1">[1]</a> Una nota</p>',
        ).body;

        expect(notes).toHaveLength(1);
        expect(bibliography).toEqual(["Una ley"]);
    });

    it("strips scripts, which is why the WordPress forms and calculator can't render here", () => {
        const { lead, html } = page(
            '<p>Uno</p><script>alert(1)</script><form action="x"></form>',
        ).body;

        expect(lead + html).not.toMatch(/script|<form/);
    });

    it("decodes the entities WordPress escapes in a title", () => {
        expect(page("<p>x</p>", { title: "Aviso &amp; privacidad" }).title).toBe(
            "Aviso & privacidad",
        );
    });

    it("builds the permalink from the configured site, with or without its trailing slash", () => {
        const slug = "aviso-legal";
        const entry = fakeEntry({ slug });

        expect(toPage(entry, SITE).permalink).toBe(`${SITE}/${slug}/`);
        expect(toPage(entry, `${SITE}/`).permalink).toBe(`${SITE}/${slug}/`);
    });

    it("has an empty body for a block document, which WordPress never serves", () => {
        const entry = fakeEntry({ body: { format: "blocks", value: [] } });

        expect(toPage(entry, SITE).body).toMatchObject({ lead: "", html: "", toc: [] });
    });
});
