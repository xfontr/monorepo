import { mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeAll, describe, expect, it } from "vitest";
import PublishProposal from "./PublishProposal.vue";

const MESSAGES = {
    publish: { proposal: { lead: "or write to {email}", title: "proposal" } },
};

const ADDRESS = "colaboraciones@huellalegal.com";

describe("publish proposal", () => {
    beforeAll(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    it("keeps the editorial inbox as a mailto beside the form, for an author who'd rather write", async () => {
        const wrapper = await mountSuspended(PublishProposal, {
            global: { stubs: { PublishForm: true } },
        });

        expect(wrapper.get("a[href^='mailto:']").attributes("href")).toBe(`mailto:${ADDRESS}`);
        expect(wrapper.text()).toContain(`or write to ${ADDRESS}`);
    });

    it("names its section by its heading", async () => {
        const wrapper = await mountSuspended(PublishProposal, {
            global: { stubs: { PublishForm: true } },
        });

        expect(wrapper.get("section").attributes("aria-labelledby")).toBe(
            wrapper.get("h2").attributes("id"),
        );
    });
});
