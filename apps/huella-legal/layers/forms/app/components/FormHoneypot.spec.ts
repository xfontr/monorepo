import { mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeAll, describe, expect, it } from "vitest";
import FormHoneypot from "./FormHoneypot.vue";

const MESSAGES = { formHoneypot: { label: "honeypot" } };

const mount = () =>
    mountSuspended(FormHoneypot, {
        props: { modelValue: "", "onUpdate:modelValue": () => undefined },
    });

describe("FormHoneypot", () => {
    beforeAll(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    it("hands the form whatever a bot types into it", async () => {
        const wrapper = await mount();

        await wrapper.find("input[name=sitio]").setValue("https://spam.test");

        expect(wrapper.emitted("update:modelValue")).toEqual([["https://spam.test"]]);
    });

    it("keeps the field out of the tab order and away from screen readers", async () => {
        const wrapper = await mount();

        const honeypot = wrapper.find("input[name=sitio]");

        expect(honeypot.attributes("tabindex")).toBe("-1");
        expect(honeypot.element.closest("[aria-hidden=true]")).not.toBeNull();
    });
});
