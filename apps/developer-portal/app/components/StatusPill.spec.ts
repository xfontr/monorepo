import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import StatusPill from "./StatusPill.vue";

describe("StatusPill", () => {
    it("uses a span for a non-navigable status", async () => {
        const wrapper = await mountSuspended(StatusPill, { props: { label: "Implemented" } });

        expect(wrapper.element.tagName).toBe("SPAN");
        expect(wrapper.text()).toBe("Implemented");
        expect(wrapper.classes()).toContain("text-dimmed");
    });

    // Unstubbed on purpose: a by-name `NuxtLink` stub is what let a string `:is` render as a bare `<nuxtlink>` element.
    it("renders a real link, not an unknown NuxtLink element, on a navigable status", async () => {
        const wrapper = await mountSuspended(StatusPill, {
            props: { label: "Superseded", to: "/decisions/0002", hint: "Replaced", tone: "bad" },
        });

        expect(wrapper.element.tagName).toBe("A");
        expect(wrapper.attributes("href")).toBe("/decisions/0002");
        expect(wrapper.attributes("title")).toBe("Replaced");
        expect(wrapper.classes()).toContain("tone-bad");
        expect(wrapper.classes()).not.toContain("text-dimmed");
    });
});
