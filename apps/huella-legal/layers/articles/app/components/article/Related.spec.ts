import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import ArticleRelated from "./Related.vue";

const global = {
    mocks: {
        $t: (key: string, params?: Record<string, unknown>) =>
            `t(${key}${params ? `, ${JSON.stringify(params)}` : ""})`,
    },
};

const CATEGORY = { id: "2", slug: "derecho-penal", name: "Derecho penal" };

const SUMMARY: ArticleSummary = {
    id: "5",
    slug: "el-dolo",
    title: "El dolo",
    authors: [],
    tags: [],
    format: "articulo",
    readingMinutes: 6,
};

describe("article related", () => {
    it("names the band after the category, so the region reads as more of the same subject", async () => {
        const wrapper = await mountSuspended(ArticleRelated, {
            props: { category: CATEGORY, articles: [SUMMARY] },
            global,
        });

        const heading = wrapper.find("h2");

        expect(heading.text()).toBe('t(article.related.title, {"subject":"Derecho penal"})');
        expect(wrapper.find("section").attributes("aria-labelledby")).toBe(
            heading.attributes("id"),
        );
    });

    it("links to the whole category as well as to each related article", async () => {
        const wrapper = await mountSuspended(ArticleRelated, {
            props: { category: CATEGORY, articles: [SUMMARY] },
            global,
        });

        const hrefs = wrapper.findAll("a").map((link) => link.attributes("href"));

        expect(hrefs).toContain("/materias/derecho-penal/");
        expect(hrefs).toContain("/el-dolo/");
    });

    // The list is lazy and may fail, and a heading over nothing reads as a broken page
    it("renders nothing while there is no related article", async () => {
        const wrapper = await mountSuspended(ArticleRelated, {
            props: { category: CATEGORY, articles: [] },
            global,
        });

        expect(wrapper.find("section").exists()).toBe(false);
    });
});
