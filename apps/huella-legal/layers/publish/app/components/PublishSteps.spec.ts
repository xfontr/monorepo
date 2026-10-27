import { mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeAll, describe, expect, it } from "vitest";
import PublishSteps from "./PublishSteps.vue";

const STEPS = ["summary", "reading", "evaluation", "decision", "publication"];

const MESSAGES = {
    publish: {
        steps: {
            items: Object.fromEntries(
                STEPS.map((key) => [key, { body: `${key}-body`, title: key }]),
            ),
            title: "steps",
        },
    },
};

describe("publish steps", () => {
    beforeAll(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    it("numbers the steps in the order an author goes through them", async () => {
        const wrapper = await mountSuspended(PublishSteps);

        expect(wrapper.findAll("li").map((step) => step.text())).toEqual(
            STEPS.map((key, index) => `${index + 1}${key}${key}-body`),
        );
    });

    it("hides the drawn numbers from screen readers, since the ordered list already numbers them", async () => {
        const wrapper = await mountSuspended(PublishSteps);

        expect(
            wrapper.findAll("li").map((step) => step.get("[aria-hidden='true']").text()),
        ).toEqual(STEPS.map((_, index) => `${index + 1}`));
    });

    it("names its landmark with its heading", async () => {
        const wrapper = await mountSuspended(PublishSteps);

        expect(wrapper.get("section").attributes("aria-labelledby")).toBe(
            wrapper.get("h2").attributes("id"),
        );
    });
});
