import { faker, fakeAsset, fakeAuthor } from "@monorepo/content/testing";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import type { ArticleSummary } from "../../../shared/types/ArticleSummary";
import SummaryCard from "./Card.vue";

const global = { mocks: { $t: (key: string) => `t(${key})` } };

const ARTICLE: ArticleSummary = {
    id: "1",
    slug: "la-teoria-juridica-del-delito",
    title: "La teoría jurídica del delito",
    excerpt: faker.lorem.sentence(),
    publishedAt: "2024-03-12T09:00:00Z",
    authors: [fakeAuthor({ slug: "ana-gil", name: "Ana Gil" })],
    category: { id: "2", slug: "derecho-penal", name: "Derecho penal" },
    tags: [],
    format: "articulo",
    readingMinutes: 24,
};

const WITH_IMAGE: ArticleSummary = { ...ARTICLE, image: fakeAsset() };

const mount = (props: InstanceType<typeof SummaryCard>["$props"]) => mountSuspended(SummaryCard, { props, global });

describe("article card", () => {
    it("links the title, and only the title, to the article's root permalink", async () => {
        const wrapper = await mount({ article: ARTICLE });

        const links = wrapper.findAll("a").filter((link) => link.attributes("href") === "/la-teoria-juridica-del-delito/");

        expect(links.map((link) => link.text())).toEqual(["La teoría jurídica del delito"]);
        expect(links[0]!.element.closest("h3")).not.toBeNull();
    });

    it("links the category and each author to their own pages, never nested in the title link", async () => {
        const wrapper = await mount({ article: ARTICLE });

        const hrefs = wrapper.findAll("a").map((link) => link.attributes("href"));

        expect(hrefs).toEqual(["/materias/derecho-penal/", "/la-teoria-juridica-del-delito/", "/colaboradores/ana-gil/"]);
        expect(wrapper.find("a a").exists()).toBe(false);
    });

    it("drops the kicker for an uncategorised post instead of printing an empty link", async () => {
        const wrapper = await mount({ article: { ...ARTICLE, category: undefined } });

        expect(wrapper.find("a[href^='/materias/']").exists()).toBe(false);
    });

    it("keeps the compact card to title and names, without excerpt or reading time", async () => {
        const wrapper = await mount({ article: ARTICLE, variant: "compact" });

        expect(wrapper.text()).not.toContain(ARTICLE.excerpt);
        expect(wrapper.text()).not.toContain("byline.readingTime");
    });

    it.each(["standard", "lead", "row"] as const)("shows the excerpt and reading time on the %s card", async (variant) => {
        const wrapper = await mount({ article: ARTICLE, variant });

        expect(wrapper.text()).toContain(ARTICLE.excerpt);
        expect(wrapper.text()).toContain("byline.readingTime");
    });

    it("hides the image from assistive tech, since the title beside it already names the article", async () => {
        const wrapper = await mount({ article: WITH_IMAGE, variant: "media" });

        const image = wrapper.find("img");

        expect(image.attributes("src")).toBe(WITH_IMAGE.image!.url);
        expect(image.attributes("alt")).toBe("");
    });

    it("loads the lead image eagerly and the rest lazily, since the lead is the one above the fold", async () => {
        const lead = await mount({ article: WITH_IMAGE, variant: "lead" });
        const media = await mount({ article: WITH_IMAGE, variant: "media" });

        expect(lead.find("img").attributes("loading")).toBe("eager");
        expect(media.find("img").attributes("loading")).toBe("lazy");
    });

    it("keeps the media slot for an imageless post on the media and row cards, so the grid stays aligned", async () => {
        const media = await mount({ article: ARTICLE, variant: "media" });
        const row = await mount({ article: ARTICLE, variant: "row" });

        expect(media.find("[aria-hidden=true]").text()).toContain("§");
        expect(row.find("[aria-hidden=true]").text()).toContain("§");
    });

    it("gives an imageless lead no media at all rather than a placeholder above the fold", async () => {
        const wrapper = await mount({ article: ARTICLE, variant: "lead" });

        expect(wrapper.find("img").exists()).toBe(false);
        expect(wrapper.text()).not.toContain("§");
    });

    it("sets the lead beside its image from lg up, but keeps an imageless lead full width", async () => {
        const withImage = await mount({ article: WITH_IMAGE, variant: "lead" });
        const without = await mount({ article: ARTICLE, variant: "lead" });

        expect(withImage.find("article").classes()).toContain("lg:grid-cols-12");
        expect(without.find("article").classes()).not.toContain("lg:grid-cols-12");
    });
});
