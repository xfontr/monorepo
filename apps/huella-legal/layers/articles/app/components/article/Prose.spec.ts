import { fakeAsset } from "@monorepo/content/testing";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import ArticleProse from "./Prose.vue";

const PROPS = {
    lead: "<p>El deber de <em>cuidado</em>.</p>",
    html: "<h2 id=\"la-culpa\">La culpa</h2><p>Sigue el cuerpo.</p>",
};

describe("article prose", () => {
    it("renders the lead and the body as the mapper's HTML, not as escaped text", async () => {
        const wrapper = await mountSuspended(ArticleProse, { props: PROPS });

        expect(wrapper.find("em").text()).toBe("cuidado");
        expect(wrapper.find("h2#la-culpa").exists()).toBe(true);
    });

    // The figure sits after the lead because the lead is the standfirst's continuation in the design
    it("places the image between the lead and the body", async () => {
        const image = fakeAsset();
        const wrapper = await mountSuspended(ArticleProse, { props: { ...PROPS, image } });

        const children = [...wrapper.element.children].map((child) => child.tagName);

        expect(children).toEqual(["DIV", "FIGURE", "DIV"]);
        expect(wrapper.find("img").attributes()).toMatchObject({ src: image.url, alt: image.alt });
    });

    it("leaves out the figure for an article without an image", async () => {
        const wrapper = await mountSuspended(ArticleProse, { props: PROPS });

        expect(wrapper.find("figure").exists()).toBe(false);
    });
});
