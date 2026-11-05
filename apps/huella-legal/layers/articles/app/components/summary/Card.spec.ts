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

const mount = (props: InstanceType<typeof SummaryCard>["$props"]) =>
    mountSuspended(SummaryCard, { props, global });

describe("article card", () => {
    it("links the title, and only the title, to the article's root permalink", async () => {
        const wrapper = await mount({ article: ARTICLE });

        const links = wrapper
            .findAll("a")
            .filter((link) => link.attributes("href") === "/la-teoria-juridica-del-delito/");

        expect(links.map((link) => link.text())).toEqual(["La teoría jurídica del delito"]);
        expect(links[0]!.element.closest("h3")).not.toBeNull();
    });

    it("links the category and each author to their own pages, never nested in the title link", async () => {
        const wrapper = await mount({ article: ARTICLE });

        const hrefs = wrapper.findAll("a").map((link) => link.attributes("href"));

        expect(hrefs).toEqual([
            "/areas/derecho-penal/",
            "/la-teoria-juridica-del-delito/",
            "/colaboradores/ana-gil/",
        ]);
        expect(wrapper.find("a a").exists()).toBe(false);
    });

    it("drops the kicker for an uncategorised post instead of printing an empty link", async () => {
        const wrapper = await mount({ article: { ...ARTICLE, category: undefined } });

        expect(wrapper.find("a[href^='/areas/']").exists()).toBe(false);
    });

    it.each(["standard", "media", "row"] as const)(
        "shows the excerpt and reading time on the %s card",
        async (variant) => {
            const wrapper = await mount({ article: ARTICLE, variant });

            expect(wrapper.text()).toContain(ARTICLE.excerpt);
            expect(wrapper.text()).toContain("byline.readingTime");
        },
    );

    it("links a commented post's count to its thread, above the title's stretched link", async () => {
        const wrapper = await mount({ article: { ...ARTICLE, commentCount: 4 } });

        const link = wrapper.find('a[href="/la-teoria-juridica-del-delito/#comentarios"]');

        expect(link.text()).toBe("t(byline.comments)");
    });

    it("prints no count for a post nobody has commented on", async () => {
        const wrapper = await mount({ article: ARTICLE });

        expect(wrapper.text()).not.toContain("byline.comments");
    });

    it("hides the image from assistive tech, since the title beside it already names the article", async () => {
        const wrapper = await mount({ article: WITH_IMAGE, variant: "media" });

        const image = wrapper.find("img");

        expect(image.attributes("src")).toBe(WITH_IMAGE.image!.url);
        expect(image.attributes("alt")).toBe("");
    });

    it("loads its image lazily, since no card is the page's LCP", async () => {
        const wrapper = await mount({ article: WITH_IMAGE, variant: "media" });

        expect(wrapper.find("img").attributes("loading")).toBe("lazy");
    });

    it("asks for each card's image at its frame's ratio, so the CDN crops what the frame would hide", async () => {
        const article = { ...ARTICLE, image: fakeAsset({ width: 1200, height: 1200 }) };
        const media = await mount({ article, variant: "media" });
        const row = await mount({ article, variant: "row" });

        expect(media.find("img").attributes("height")).toBe("800");
        expect(row.find("img").attributes("height")).toBe("900");
    });

    it("keeps the media slot for an imageless post on the media and row cards, so the grid stays aligned", async () => {
        const media = await mount({ article: ARTICLE, variant: "media" });
        const row = await mount({ article: ARTICLE, variant: "row" });

        expect(media.find("[aria-hidden=true]").text()).toContain("§");
        expect(row.find("[aria-hidden=true]").text()).toContain("§");
    });

    it("draws no media slot on the standard card, even for a post with an image", async () => {
        const wrapper = await mount({ article: WITH_IMAGE });

        expect(wrapper.find("img").exists()).toBe(false);
        expect(wrapper.text()).not.toContain("§");
    });
});
