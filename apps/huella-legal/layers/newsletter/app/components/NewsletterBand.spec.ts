import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeAll, describe, expect, it } from "vitest";
import NewsletterBand from "./NewsletterBand.vue";

// `<i18n-t>` reads the real i18n instance rather than a `$t` mock, so the spec feeds it messages
const MESSAGES = {
    newsletterBand: {
        kicker: "kicker",
        note: "note {privacy}",
        privacy: "privacy",
        title: "title",
    },
    newsletterForm: {
        email: { errors: { invalid: "invalid", required: "required" }, label: "email", placeholder: "placeholder" },
        submit: "submit",
    },
};

const PROPS = { privacyTo: "/privacidad" };

describe("newsletter band", () => {
    beforeAll(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    it.each(["paper", "slate"] as const)("renders the %s tone as a landmark named by its title", async (tone) => {
        const wrapper = await mountSuspended(NewsletterBand, { props: { ...PROPS, tone } });

        const section = wrapper.find("section");

        expect(section.attributes("aria-labelledby")).toBe(wrapper.find("h2").attributes("id"));
        expect(wrapper.find("h2").text()).toBe("title");
    });

    it("leaves the anchor to the page that places it, so only the linked band carries one", async () => {
        const bare = await mountSuspended(NewsletterBand, { props: PROPS });
        const anchored = await mountSuspended(NewsletterBand, { props: PROPS, attrs: { id: "newsletter" } });

        expect(bare.find("section").attributes("id")).toBeUndefined();
        expect(anchored.find("section").attributes("id")).toBe("newsletter");
    });

    it("links the privacy policy from the note under the field", async () => {
        const wrapper = await mountSuspended(NewsletterBand, { props: PROPS });

        expect(wrapper.find("form a").attributes("href")).toBe("/privacidad");
    });

    it("hands its tone and state to the form, so the slate band gets the slate field", async () => {
        const wrapper = await mountSuspended(NewsletterBand, { props: { ...PROPS, tone: "slate", pending: true, error: "Ya estás suscrita" } });

        expect(wrapper.findComponent({ name: "NewsletterForm" }).props()).toMatchObject({
            layout: "inline",
            tone: "slate",
            pending: true,
            error: "Ya estás suscrita",
        });
    });

    it("passes the submit through, so the caller drives the band like the form", async () => {
        const wrapper = await mountSuspended(NewsletterBand, { props: PROPS });

        await wrapper.find("input").setValue("lucia@ejemplo.es");
        await wrapper.find("form").trigger("submit");
        await flushPromises();

        expect(wrapper.emitted("submit")).toEqual([["lucia@ejemplo.es"]]);
    });
});
