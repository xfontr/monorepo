import { fakeEntry } from "@monorepo/content/testing";
import { describe, expect, it } from "vitest";
import { toArticle } from "./article";
import { toArticleBody } from "./articleBody";
import { toArticleSummary } from "./articleSummary";

const PUBLICATION = {
    siteUrl: "https://revista.test",
    journal: { name: "Huella Legal", issn: "0000-0000" },
};

describe("toArticle", () => {
    it("carries the summary, the processed body, and the entry's SEO", () => {
        const entry = fakeEntry({
            body: { format: "html", value: "<p>Uno</p><h2>Dos</h2>" },
            seo: { title: "Uno | Huella" },
        });

        expect(toArticle(entry, PUBLICATION)).toMatchObject({
            ...toArticleSummary(entry),
            body: toArticleBody("<p>Uno</p><h2>Dos</h2>"),
            seo: { title: "Uno | Huella" },
        });
    });

    it("renders a block body as empty rather than failing the page", () => {
        const entry = fakeEntry({ body: { format: "blocks", value: [] } });

        expect(toArticle(entry, PUBLICATION).body).toEqual({
            lead: "",
            html: "",
            toc: [],
            notes: [],
            bibliography: [],
        });
    });

    // The canonical address keeps WordPress's trailing slash, so a citation never costs a redirect
    it.each(["https://revista.test", "https://revista.test/"])(
        "cites the post at its permalink on %s",
        (url) => {
            const { permalink, citations } = toArticle(fakeEntry({ slug: "la-culpa" }), {
                ...PUBLICATION,
                siteUrl: url,
            });

            expect(permalink).toBe("https://revista.test/la-culpa/");
            expect(
                citations.map(({ text }) => text.endsWith(" https://revista.test/la-culpa/")),
            ).toEqual([true, true]);
        },
    );
});
