import { fakeAuthor } from "@monorepo/content/testing";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import type { Article } from "../../shared/types/Article";
import ArticleBackMatter from "./ArticleBackMatter.vue";

const global = { mocks: { $t: (key: string) => `t(${key})` } };

const ARTICLE: Article = {
    id: "1",
    slug: "la-culpa",
    title: "La culpa",
    authors: [fakeAuthor({ slug: "marta-gil" }), fakeAuthor({ slug: "luis-martin" })],
    tags: [{ id: "3", slug: "dolo", name: "Dolo" }, { id: "4", slug: "imprudencia", name: "Imprudencia" }],
    format: "ensayo",
    readingMinutes: 12,
    body: { lead: "", html: "", toc: [], notes: [], bibliography: [] },
    permalink: "https://revista.test/la-culpa/",
    citations: [{ style: "APA 7", text: "Gil, M. (2024). La culpa. Huella Legal." }],
};

describe("article back matter", () => {
    // ArticleHeader's share bar and byline link to these two ids
    it("keeps the citation at #citar and the author cards at #autor", async () => {
        const wrapper = await mountSuspended(ArticleBackMatter, { props: { article: ARTICLE }, global });

        expect(wrapper.find("#citar").text()).toContain(ARTICLE.citations[0]!.text);
        expect(wrapper.find("#autor").findAll("section")).toHaveLength(2);
    });

    it("links each author card to that author's profile", async () => {
        const wrapper = await mountSuspended(ArticleBackMatter, { props: { article: ARTICLE }, global });

        expect(wrapper.find("#autor").findAll("a").map((link) => link.attributes("href"))).toEqual(["/colaboradores/marta-gil/", "/colaboradores/luis-martin/"]);
    });

    it("lists the tags in one line", async () => {
        const wrapper = await mountSuspended(ArticleBackMatter, { props: { article: ARTICLE }, global });

        expect(wrapper.text()).toContain("Dolo · Imprudencia");
    });

    it("leaves out the tags line for an article without tags", async () => {
        const wrapper = await mountSuspended(ArticleBackMatter, { props: { article: { ...ARTICLE, tags: [] } }, global });

        expect(wrapper.text()).not.toContain("t(article.tags)");
    });
});
