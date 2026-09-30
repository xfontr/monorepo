import { fakeEntry } from "@monorepo/content/testing";
import { describe, expect, it } from "vitest";
import { toArticle } from "./article";
import { toArticleBody } from "./articleBody";
import { toArticleSummary } from "./articleSummary";

describe("toArticle", () => {
    it("carries the summary, the processed body and the entry's SEO", () => {
        const entry = fakeEntry({ body: { format: "html", value: "<p>Uno</p><h2>Dos</h2>" }, seo: { title: "Uno | Huella" } });

        expect(toArticle(entry)).toEqual({
            ...toArticleSummary(entry),
            body: toArticleBody("<p>Uno</p><h2>Dos</h2>"),
            seo: { title: "Uno | Huella" },
        });
    });

    it("renders a block body as empty rather than failing the page", () => {
        const entry = fakeEntry({ body: { format: "blocks", value: [] } });

        expect(toArticle(entry).body).toEqual({ html: "", toc: [], bibliography: [] });
    });
});
