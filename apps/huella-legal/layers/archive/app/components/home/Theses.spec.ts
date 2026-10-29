import { fakeAuthor } from "@monorepo/content/testing";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import HomeTheses from "./Theses.vue";

const global = { mocks: { $t: (key: string) => `t(${key})` } };

const THESIS: ArticleSummary = {
    id: "1",
    slug: "un-tfg",
    title: "Un TFG",
    authors: [fakeAuthor({ name: "Ana Gil" })],
    category: { id: "2", slug: "derecho-penal", name: "Derecho penal" },
    tags: [],
    format: "tfg-tfm",
    readingMinutes: 40,
};

describe("home theses", () => {
    it("links each thesis to its root permalink, under its subject", async () => {
        const wrapper = await mountSuspended(HomeTheses, { props: { articles: [THESIS] }, global });

        const item = wrapper.find("li");

        expect(item.find("a").attributes("href")).toBe("/un-tfg/");
        expect(item.text()).toContain("Derecho penal");
        expect(item.text()).toContain("Ana Gil");
    });

    it("leads to the thesis archive and to the thesis section of the publishing guide", async () => {
        const wrapper = await mountSuspended(HomeTheses, { props: { articles: [THESIS] }, global });

        const hrefs = wrapper.findAll("a").map((link) => link.attributes("href"));

        expect(hrefs).toContain("/publicaciones/?format=tfg-tfm");
        expect(hrefs).toContain("/publicar/#tesis");
    });

    // A dark band with a heading over nothing reads as a broken page
    it("renders nothing until the first thesis is published", async () => {
        const wrapper = await mountSuspended(HomeTheses, { props: { articles: [] }, global });

        expect(wrapper.find("section").exists()).toBe(false);
    });
});
