import { mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeAll, describe, expect, it } from "vitest";
import PublishReasons from "./PublishReasons.vue";

const REASONS = ["visibility", "review", "free"];

const MESSAGES = {
    publish: {
        reasons: Object.fromEntries(
            REASONS.map((key) => [key, { body: `${key}-body`, title: key }]),
        ),
    },
};

describe("publish reasons", () => {
    beforeAll(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    it("pairs each reason's title with its own body", async () => {
        const wrapper = await mountSuspended(PublishReasons);

        expect(wrapper.findAll("li").map((reason) => reason.text())).toEqual(
            REASONS.map((key) => `${key}${key}-body`),
        );
    });
});
