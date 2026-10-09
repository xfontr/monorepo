import { fakeAuthor } from "@monorepo/content/testing";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import type { ArticleSummary } from "../../../shared/types/ArticleSummary";
import SummaryGrid from "./Grid.vue";

const global = { mocks: { $t: (key: string) => `t(${key})` } };

const article = (id: string): ArticleSummary => ({
    id,
    slug: `articulo-${id}`,
    title: `Artículo ${id}`,
    authors: [fakeAuthor()],
    tags: [],
    format: "articulo",
    readingMinutes: 5,
});

const THREE = ["1", "2", "3"].map(article);

describe("article grid", () => {
    it("renders the cards as a list, so screen readers announce how many there are", async () => {
        const wrapper = await mountSuspended(SummaryGrid, { props: { articles: THREE }, global });

        expect(wrapper.element.tagName).toBe("UL");
        expect(wrapper.findAll("ul > li > article")).toHaveLength(3);
    });

    it("keeps every card unless asked, since hiding one drops an article at `md`", async () => {
        const wrapper = await mountSuspended(SummaryGrid, { props: { articles: THREE }, global });

        expect(wrapper.find(".md\\:hidden").exists()).toBe(false);
    });

    it("hides an odd last card on request while three columns drop to two, so no card sits alone on its row", async () => {
        const wrapper = await mountSuspended(SummaryGrid, {
            props: { articles: THREE, hideOrphan: true },
            global,
        });

        const hidden = [...wrapper.element.children].map((item) =>
            item.classList.contains("md:hidden"),
        );

        expect(hidden).toEqual([false, false, true]);
    });

    it("never hides a lone card, which would leave the grid empty at `md`", async () => {
        const wrapper = await mountSuspended(SummaryGrid, {
            props: { articles: THREE.slice(0, 1), hideOrphan: true },
            global,
        });

        expect(wrapper.find(".md\\:hidden").exists()).toBe(false);
    });

    it("hides nothing in a two-column grid, which never changes column count", async () => {
        const wrapper = await mountSuspended(SummaryGrid, {
            props: { articles: THREE, columns: 2, hideOrphan: true },
            global,
        });

        expect(wrapper.find(".md\\:hidden").exists()).toBe(false);
        expect(wrapper.classes()).not.toContain("lg:grid-cols-3");
    });

    it("draws media cards unless told otherwise, since every grid in the design leads with an image", async () => {
        const media = await mountSuspended(SummaryGrid, {
            props: { articles: THREE.slice(0, 1) },
            global,
        });
        const standard = await mountSuspended(SummaryGrid, {
            props: { articles: THREE.slice(0, 1), variant: "standard" },
            global,
        });

        expect(media.text()).toContain("§");
        expect(standard.text()).not.toContain("§");
    });
});
