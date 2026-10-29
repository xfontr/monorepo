import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import ArticleBibliography from "./Bibliography.vue";

const global = { mocks: { $t: (key: string) => `t(${key})` } };

const ENTRIES = [
    "MIR PUIG, S., <em>Derecho penal. Parte general</em>, Reppertor, 2016.",
    "ROXIN, C., <em>Strafrecht</em>, Beck, 2006.",
];

describe("article bibliography", () => {
    it("renders each reference's HTML in order, keeping its italics", async () => {
        const wrapper = await mountSuspended(ArticleBibliography, {
            props: { entries: ENTRIES },
            global,
        });

        const items = wrapper.findAll("li");

        expect(items).toHaveLength(2);
        expect(items[0]!.find("em").text()).toBe("Derecho penal. Parte general");
        expect(items[1]!.text()).toContain("ROXIN");
    });

    it("keeps two identical references, since a text can repeat one", async () => {
        const wrapper = await mountSuspended(ArticleBibliography, {
            props: { entries: [ENTRIES[0]!, ENTRIES[0]!] },
            global,
        });

        expect(wrapper.findAll("li")).toHaveLength(2);
    });

    it("labels the section with its own heading", async () => {
        const wrapper = await mountSuspended(ArticleBibliography, {
            props: { entries: ENTRIES },
            global,
        });

        const heading = wrapper.find("h2");

        expect(heading.text()).toBe("t(articleBibliography.title)");
        expect(wrapper.find("section").attributes("aria-labelledby")).toBe(
            heading.attributes("id"),
        );
    });

    it("renders nothing for a text with no bibliography", async () => {
        const wrapper = await mountSuspended(ArticleBibliography, {
            props: { entries: [] },
            global,
        });

        expect(wrapper.find("section").exists()).toBe(false);
    });
});
