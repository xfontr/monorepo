import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import ArticleNotes from "./Notes.vue";

const global = {
    mocks: {
        $t: (key: string, params?: Record<string, unknown>) =>
            `t(${key}${params ? `, ${JSON.stringify(params)}` : ""})`,
    },
};

const NOTES = [
    { id: "1", html: "Artículo 10 del <em>Código Penal</em>." },
    { id: "2", html: 'Welzel, <a href="https://example.test/welzel">Das neue Bild</a>.' },
];

describe("article notes", () => {
    // The body's superscripts link to `#nota-N` and are themselves `#ref-N`, so both ids are a contract
    it("gives each note the id the body links to, and links back to the body's reference", async () => {
        const wrapper = await mountSuspended(ArticleNotes, { props: { notes: NOTES }, global });

        const items = wrapper.findAll("li");

        expect(items.map((item) => item.attributes("id"))).toEqual(["nota-1", "nota-2"]);
        expect(items.map((item) => item.find("a").attributes("href"))).toEqual([
            "#ref-1",
            "#ref-2",
        ]);
    });

    it("names the back-link by its job, since a bare number means nothing out loud", async () => {
        const wrapper = await mountSuspended(ArticleNotes, { props: { notes: NOTES }, global });

        expect(wrapper.find("li a").attributes("aria-label")).toBe(
            't(articleNotes.back, {"number":"1"})',
        );
    });

    it("renders each note's HTML rather than escaping it", async () => {
        const wrapper = await mountSuspended(ArticleNotes, { props: { notes: NOTES }, global });

        expect(wrapper.find("li em").text()).toBe("Código Penal");
        expect(wrapper.findAll("li")[1]!.findAll("a")[1]!.attributes("href")).toBe(
            "https://example.test/welzel",
        );
    });

    it("labels the section with its own heading", async () => {
        const wrapper = await mountSuspended(ArticleNotes, { props: { notes: NOTES }, global });

        const heading = wrapper.find("h2");

        expect(heading.text()).toBe("t(articleNotes.title)");
        expect(wrapper.find("section").attributes("aria-labelledby")).toBe(
            heading.attributes("id"),
        );
    });

    it("renders nothing when the text has no notes, which is most posts", async () => {
        const wrapper = await mountSuspended(ArticleNotes, { props: { notes: [] }, global });

        expect(wrapper.find("section").exists()).toBe(false);
    });
});
