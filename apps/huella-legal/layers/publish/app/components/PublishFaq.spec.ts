import { mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it } from "vitest";
import PublishFaq from "./PublishFaq.vue";

const QUESTIONS = ["length", "topics", "format", "changes", "advertising"];

const MESSAGES = {
    publish: {
        faq: {
            items: Object.fromEntries(
                QUESTIONS.map((key) => [
                    key,
                    { answer: `${key}-answer`, question: `${key}-question` },
                ]),
            ),
            guide: "guide",
            title: "faq",
        },
    },
};

describe("publish faq", () => {
    beforeEach(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    it("opens the first question only, so the list reads as questions at a glance", async () => {
        const wrapper = await mountSuspended(PublishFaq);
        const triggers = wrapper.findAll("button");

        expect(triggers.map((trigger) => trigger.text())).toEqual(
            QUESTIONS.map((key) => `${key}-question`),
        );
        expect(triggers.map((trigger) => trigger.attributes("aria-expanded"))).toEqual([
            "true",
            "false",
            "false",
            "false",
            "false",
        ]);
        expect(wrapper.text()).toContain("length-answer");
    });

    it("links the publishing guide, so the criteria behind a decision stay one click away", async () => {
        const wrapper = await mountSuspended(PublishFaq);
        const link = wrapper.find("a");

        expect(link.text()).toBe("guide");
        expect(link.attributes("href")).toBe("/guia-de-publicaciones/");
    });
});
