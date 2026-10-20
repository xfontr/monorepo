import { mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeAll, describe, expect, it } from "vitest";
import NewsletterBand from "./NewsletterBand.vue";

// `<i18n-t>` reads the real i18n instance rather than a `$t` mock, so the spec feeds it messages
const MESSAGES = {
    newsletterBand: {
        kicker: "kicker",
        title: "title",
    },
    newsletterForm: {
        email: { label: "email", placeholder: "placeholder" },
        notice: "notice {privacy}",
        privacy: "privacy",
        submit: "submit",
    },
};

describe("newsletter band", () => {
    beforeAll(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    it.each(["paper", "slate"] as const)(
        "renders the %s tone as a landmark named by its title",
        async (tone) => {
            const wrapper = await mountSuspended(NewsletterBand, { props: { tone } });

            const section = wrapper.find("section");

            expect(section.attributes("aria-labelledby")).toBe(wrapper.find("h2").attributes("id"));
            expect(wrapper.find("h2").text()).toBe("title");
        },
    );

    it("leaves the anchor to the page that places it, so only the linked band carries one", async () => {
        const bare = await mountSuspended(NewsletterBand);
        const anchored = await mountSuspended(NewsletterBand, { attrs: { id: "newsletter" } });

        expect(bare.find("section").attributes("id")).toBeUndefined();
        expect(anchored.find("section").attributes("id")).toBe("newsletter");
    });

    it("hands its tone to an inline form, so the slate band gets the slate field", async () => {
        const wrapper = await mountSuspended(NewsletterBand, { props: { tone: "slate" } });

        expect(wrapper.findComponent({ name: "NewsletterForm" }).props()).toEqual({
            layout: "inline",
            tone: "slate",
        });
    });
});
