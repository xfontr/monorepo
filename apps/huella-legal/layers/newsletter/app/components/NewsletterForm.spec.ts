import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeAll, describe, expect, it } from "vitest";
import NewsletterForm from "./NewsletterForm.vue";

const MESSAGES = {
    newsletterForm: {
        email: {
            errors: { invalid: "invalid", required: "required" },
            label: "email",
            placeholder: "placeholder",
        },
        submit: "submit",
    },
};

describe("newsletter form", () => {
    beforeAll(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    it("emits the trimmed address on submit and leaves sending it to the caller", async () => {
        const wrapper = await mountSuspended(NewsletterForm);

        await wrapper.find("input").setValue(" lucia@ejemplo.es ");
        await wrapper.find("form").trigger("submit");
        await flushPromises();

        expect(wrapper.emitted("submit")).toEqual([["lucia@ejemplo.es"]]);
    });

    it.each([
        ["an empty field", "", "required"],
        ["a blank field", "   ", "required"],
        ["an address with no domain", "lucia@", "invalid"],
    ])("withholds the submit and shows the field error on %s", async (_, email, message) => {
        const wrapper = await mountSuspended(NewsletterForm);

        await wrapper.find("input").setValue(email);
        await wrapper.find("form").trigger("submit");
        await flushPromises();

        expect(wrapper.emitted("submit")).toBeUndefined();
        expect(wrapper.find("[data-slot=error]").text()).toBe(message);
    });

    it("marks the form busy and locks the field while pending, without unmounting what was typed", async () => {
        const wrapper = await mountSuspended(NewsletterForm);

        await wrapper.find("input").setValue("lucia@ejemplo.es");
        await wrapper.setProps({ pending: true });

        expect(wrapper.find("form").attributes("aria-busy")).toBe("true");
        expect(wrapper.find("input").attributes("disabled")).toBeDefined();
        expect(wrapper.find("input").element.value).toBe("lucia@ejemplo.es");
        expect(wrapper.findComponent({ name: "UButton" }).props("loading")).toBe(true);
    });

    it("wires the caller's error to the field, so it is read with the input", async () => {
        const wrapper = await mountSuspended(NewsletterForm, { props: { error: "Falta el dominio" } });

        const input = wrapper.find("input");
        const error = wrapper.find("[data-slot=error]");

        expect(error.text()).toBe("Falta el dominio");
        expect(input.attributes("aria-invalid")).toBe("true");
        expect(input.attributes("aria-describedby")).toContain(error.attributes("id"));
    });

    it.each([
        ["stacked", true],
        ["inline", false],
    ] as const)("stretches the button only in the %s layout", async (layout, block) => {
        const wrapper = await mountSuspended(NewsletterForm, { props: { layout } });

        expect(wrapper.findComponent({ name: "UButton" }).props("block")).toBe(block);
    });

    it.each([
        ["paper", "primary"],
        ["slate", "secondary"],
    ] as const)("gives the %s tone a %s button, so it keeps contrast on its background", async (tone, color) => {
        const wrapper = await mountSuspended(NewsletterForm, { props: { tone } });

        expect(wrapper.findComponent({ name: "UButton" }).props("color")).toBe(color);
    });

    it("renders the note inside the form, so it sits with the field it explains", async () => {
        const wrapper = await mountSuspended(NewsletterForm, { slots: { note: () => h("p", "note") } });

        expect(wrapper.find("form p").text()).toBe("note");
    });
});
