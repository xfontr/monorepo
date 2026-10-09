import { mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeAll, describe, expect, it } from "vitest";
import FormErrorSummary from "./FormErrorSummary.vue";

// `<i18n-t>` reads the real i18n instance rather than a `$t` mock, so the spec feeds it messages
const MESSAGES = {
    formErrorSummary: {
        item: "{field} — {message}",
        title: "one field | {count} fields",
    },
};

const ERRORS = [
    { id: "email", label: "Correo electrónico", message: "falta el dominio." },
    { id: "resumen", label: "Resumen", message: "es obligatorio." },
];

describe("form error summary", () => {
    beforeAll(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    it("is announced as an alert, so a failed submit is heard without moving focus", async () => {
        const wrapper = await mountSuspended(FormErrorSummary, { props: { errors: ERRORS } });

        expect(wrapper.find("[role=alert]").exists()).toBe(true);
    });

    it("counts the fields in the title with the plural form", async () => {
        const one = await mountSuspended(FormErrorSummary, {
            props: { errors: ERRORS.slice(0, 1) },
        });
        const two = await mountSuspended(FormErrorSummary, { props: { errors: ERRORS } });

        expect(one.get("[data-slot=title]").text()).toBe("one field");
        expect(two.get("[data-slot=title]").text()).toBe("2 fields");
    });

    it("links each error to its field's id, so the reader jumps straight to what to fix", async () => {
        const wrapper = await mountSuspended(FormErrorSummary, { props: { errors: ERRORS } });

        const items = wrapper.findAll("li");

        expect(items.map((item) => item.text())).toEqual([
            "Correo electrónico — falta el dominio.",
            "Resumen — es obligatorio.",
        ]);
        expect(items.map((item) => item.find("a").attributes("href"))).toEqual([
            "#email",
            "#resumen",
        ]);
    });

    it("renders nothing when there are no errors, rather than an empty alert", async () => {
        const wrapper = await mountSuspended(FormErrorSummary, { props: { errors: [] } });

        expect(wrapper.find("[role=alert]").exists()).toBe(false);
    });
});
