import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import SubjectsFormats from "./Formats.vue";

const global = { mocks: { $t: (key: string) => `t(${key})` } };

const props = {
    formats: [
        { value: "articulo" as const, count: 20 },
        { value: "tfg-tfm" as const, count: 4 },
    ],
};

describe("subjects formats", () => {
    it("links each format to the archive filtered by it", async () => {
        const wrapper = await mountSuspended(SubjectsFormats, { props, global });

        expect(wrapper.findAll("li a").map((link) => link.attributes("href"))).toEqual([
            "/publicaciones/?format=articulo",
            "/publicaciones/?format=tfg-tfm",
        ]);
    });

    it("sets the thesis band apart on the dark surface, with its own kicker", async () => {
        const wrapper = await mountSuspended(SubjectsFormats, { props, global });
        const [article, thesis] = wrapper.findAll("li");

        expect(thesis!.classes()).toContain("bg-inverted");
        expect(thesis!.text()).toContain("t(subjectsFormats.academic)");
        expect(article!.classes()).not.toContain("bg-inverted");
        expect(article!.text()).toContain("t(subjectsFormats.format)");
    });

    it("words each format from its own keys", async () => {
        const wrapper = await mountSuspended(SubjectsFormats, { props, global });

        expect(wrapper.find("li").text()).toContain("t(subjectsFormats.formats.article.title)");
        expect(wrapper.find("li").text()).toContain(
            "t(subjectsFormats.formats.article.description)",
        );
    });

    it("invites a thesis to the publish page's thesis section", async () => {
        const wrapper = await mountSuspended(SubjectsFormats, { props, global });

        expect(wrapper.find("ul + p a").attributes("href")).toBe("/publicar/#tesis");
    });
});
