import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import StatusPill from "./StatusPill.vue";

const NuxtLinkStub = { props: { to: String }, template: "<a :href=\"to\"><slot /></a>" };

describe("StatusPill", () => {
    it("uses a span for a non-navigable status", async () => {
        const wrapper = await mountSuspended(StatusPill, { props: { label: "Implemented" } });

        expect(wrapper.element.tagName).toBe("SPAN");
        expect(wrapper.text()).toBe("Implemented");
        expect(wrapper.classes()).toContain("text-dimmed");
    });

    it("preserves the destination, hint and tone on a navigable status", async () => {
        const wrapper = await mountSuspended(StatusPill, {
            props: { label: "Superseded", to: "/decisions/0002", hint: "Replaced", tone: "bad" },
            global: { stubs: { NuxtLink: NuxtLinkStub } },
        });

        expect(wrapper.element.tagName).toBe("A");
        expect(wrapper.attributes("href")).toBe("/decisions/0002");
        expect(wrapper.attributes("title")).toBe("Replaced");
        expect(wrapper.classes()).toContain("tone-bad");
        expect(wrapper.classes()).not.toContain("text-dimmed");
    });
});
