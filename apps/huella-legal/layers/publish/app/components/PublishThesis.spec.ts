import { mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeAll, describe, expect, it } from "vitest";
import PublishThesis from "./PublishThesis.vue";

const MESSAGES = { publish: { thesis: { action: "action", body: "body", title: "thesis" } } };

describe("publish thesis", () => {
    beforeAll(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    it("links the published theses rather than every publication", async () => {
        const wrapper = await mountSuspended(PublishThesis);

        expect(wrapper.get("a").attributes("href")).toBe("/publicaciones/?format=tfg-tfm");
    });
});
