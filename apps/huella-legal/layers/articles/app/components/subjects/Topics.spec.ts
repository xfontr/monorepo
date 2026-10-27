import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import SubjectsTopics from "./Topics.vue";

const global = { mocks: { $t: (key: string) => `t(${key})` } };

const topic = (id: string, slug: string, name: string, count: number) => ({
    value: { id, slug, name },
    count,
});

const props = {
    topics: [
        topic("1", "arrendamiento", "Arrendamiento", 2),
        topic("2", "arbitros", "Árbitros", 1),
        topic("3", "dolo", "Dolo", 5),
    ],
};

describe("subjects topics", () => {
    it("files the topics under their initial letter, accents folded", async () => {
        const wrapper = await mountSuspended(SubjectsTopics, { props, global });

        expect(
            wrapper
                .findAll("section section")
                .map((letter) => [
                    letter.find("p").text(),
                    letter.findAll("li").map((item) => item.find("span").text()),
                ]),
        ).toEqual([
            ["A", ["Arrendamiento", "Árbitros"]],
            ["D", ["Dolo"]],
        ]);
    });

    it("links every topic to its tag listing", async () => {
        const wrapper = await mountSuspended(SubjectsTopics, { props, global });

        expect(wrapper.findAll("li a").map((link) => link.attributes("href"))).toEqual([
            "/etiquetas/arrendamiento/",
            "/etiquetas/arbitros/",
            "/etiquetas/dolo/",
        ]);
    });

    it("hides each count from screen readers behind a worded one, so a bare number is never read out", async () => {
        const wrapper = await mountSuspended(SubjectsTopics, { props, global });
        const link = wrapper.find("li a");

        expect(link.find("[aria-hidden='true']").text()).toBe("2");
        expect(link.find(".sr-only").text()).toBe("t(subjectsTopics.count)");
    });
});
