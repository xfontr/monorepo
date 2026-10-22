import { mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeAll, describe, expect, it } from "vitest";
import NewsletterCard from "./NewsletterCard.vue";

const MESSAGES = {
    newsletterCard: {
        kicker: "kicker",
        lead: "lead",
        subjectLead: "lead: {subject}",
    },
    newsletterForm: {
        email: { label: "email", placeholder: "placeholder" },
        notice: "notice {privacy}",
        privacy: "privacy",
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
        const wrapper = await mountSuspended(NewsletterCard, {
            props: { subject: "derecho penal" },
        });

        expect(wrapper.find("p").text()).toBe("lead: derecho penal");
    });

    it("stacks its form, since the sidebar is too narrow for a row", async () => {
        const wrapper = await mountSuspended(NewsletterCard);

        expect(wrapper.findComponent({ name: "NewsletterForm" }).props("layout")).toBe("stacked");
    });

    // The sidebar form has no band around it, so the form must bring its own notice
    it("carries the privacy notice like every other newsletter form", async () => {
        const wrapper = await mountSuspended(NewsletterCard);

        expect(wrapper.find("form p").text()).toContain("notice");
    });
});
