import { mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeAll, describe, expect, it } from "vitest";
import PublishProposal from "./PublishProposal.vue";

const MESSAGES = {
    publish: {
        proposal: {
            checklist: {
                file: "file",
                kind: "kind",
                name: "name",
                summary: "summary",
                title: "title",
            },
            lead: "write to {email}",
            mail: { body: "Nombre:\nResumen:", subject: "Propuesta de publicación" },
            policy: "policy",
            privacy: "privacy {policy}",
            reply: "reply",
            send: "send",
            title: "proposal",
        },
    },
};

const ADDRESS = "colaboraciones@huellalegal.com";

describe("publish proposal", () => {
    beforeAll(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    it("sends the button and the address to the same mailto, so neither opens a blank message", async () => {
        const wrapper = await mountSuspended(PublishProposal);
        const hrefs = wrapper.findAll("a[href^='mailto:']").map((link) => link.attributes("href"));

        expect(hrefs).toHaveLength(2);
        expect(new Set(hrefs).size).toBe(1);
        expect(wrapper.text()).toContain(`write to ${ADDRESS}`);
    });

    it("encodes spaces as %20 and line breaks as CRLF, which every mail client decodes", async () => {
        const wrapper = await mountSuspended(PublishProposal);
        const href = wrapper.get("a[href^='mailto:']").attributes("href");

        expect(href).toBe(
            `mailto:${ADDRESS}?subject=Propuesta%20de%20publicaci%C3%B3n&body=Nombre%3A%0D%0AResumen%3A`,
        );
    });

    it("lists what a proposal must include, since no form asks for it", async () => {
        const wrapper = await mountSuspended(PublishProposal);

        expect(wrapper.findAll("li").map((item) => item.text())).toEqual([
            "name",
            "kind",
            "title",
            "summary",
            "file",
        ]);
    });

    it("links the privacy policy beside the call to action", async () => {
        const wrapper = await mountSuspended(PublishProposal);

        expect(wrapper.get("a[href='/aviso-legal/#privacidad']").text()).toBe("policy");
    });
});
