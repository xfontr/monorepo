import { faker, fakeAuthor } from "@monorepo/content/testing";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import type { ArticleSummary } from "../../../shared/types/ArticleSummary";
import SummaryList from "./List.vue";

const global = { mocks: { $t: (key: string) => `t(${key})` } };

const article = (id: string): ArticleSummary => ({
    id,
    slug: `articulo-${id}`,
    title: `Artículo ${id}`,
    excerpt: faker.lorem.sentence(),
    authors: [fakeAuthor()],
    tags: [],
    format: "articulo",
    readingMinutes: 5,
});

const ARTICLES = ["1", "2"].map(article);

describe("article list", () => {
    it("keeps the cards in an ordered list, since a listing's order is its sort", async () => {
        const wrapper = await mountSuspended(SummaryList, {
            props: { articles: ARTICLES },
            global,
        });

        expect(wrapper.element.tagName).toBe("OL");
        expect(wrapper.findAll("li h3").map((title) => title.text())).toEqual([
            "Artículo 1",
            "Artículo 2",
        ]);
    });

    it("passes its variant to every card, so a compact list loses the excerpts", async () => {
        const wrapper = await mountSuspended(SummaryList, {
            props: { articles: ARTICLES, variant: "compact" },
            global,
        });

        expect(wrapper.text()).not.toContain(ARTICLES[0]!.excerpt);
    });
});
