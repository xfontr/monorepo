import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeAll, describe, expect, it } from "vitest";
import NewsletterCard from "./NewsletterCard.vue";

const MESSAGES = {
    newsletterCard: {
        kicker: "kicker",
        lead: "lead",
        subjectLead: "lead: {subject}",
    },
    newsletterForm: {
        email: { errors: { invalid: "invalid", required: "required" }, label: "email", placeholder: "placeholder" },
        submit: "submit",
    },
};

describe("newsletter card", () => {
    beforeAll(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    it("stays out of the landmarks, since it sits inside the page's sidebar", async () => {
        const wrapper = await mountSuspended(NewsletterCard);

        expect(wrapper.find("section").exists()).toBe(false);
        expect(wrapper.find("p").text()).toBe("lead");
    });

    it("names the subject in its lead when it sits on a subject page", async () => {
        const wrapper = await mountSuspended(NewsletterCard, { props: { subject: "derecho penal" } });

        expect(wrapper.find("p").text()).toBe("lead: derecho penal");
    });

    it("hands its state to a stacked form", async () => {
        const wrapper = await mountSuspended(NewsletterCard, { props: { pending: true, error: "Ya estás suscrita" } });

        expect(wrapper.findComponent({ name: "NewsletterForm" }).props()).toMatchObject({
            layout: "stacked",
            pending: true,
            error: "Ya estás suscrita",
        });
    });

    it("passes the submit through, so the caller drives the card like the form", async () => {
        const wrapper = await mountSuspended(NewsletterCard);

        await wrapper.find("input").setValue("lucia@ejemplo.es");
        await wrapper.find("form").trigger("submit");
        await flushPromises();

        expect(wrapper.emitted("submit")).toEqual([["lucia@ejemplo.es"]]);
    });
});
