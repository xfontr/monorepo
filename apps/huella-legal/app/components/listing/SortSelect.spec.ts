import { mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeAll, describe, expect, it } from "vitest";
import SortSelect from "./SortSelect.vue";

const global = { mocks: { $t: (key: string) => `t(${key})` } };

const MESSAGES = {
    sortSelect: { label: "sort label", newest: "newest", oldest: "oldest", prefix: "prefix" },
};

describe("sort select", () => {
    beforeAll(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    it("names the control for what it sorts, since the visible prefix is hidden from assistive tech", async () => {
        const wrapper = await mountSuspended(SortSelect, {
            props: { modelValue: "newest" },
            global,
        });

        expect(wrapper.find("[role=combobox]").attributes("aria-label")).toBe("sort label");
        expect(wrapper.find("span[aria-hidden=true]").text()).toBe("t(sortSelect.prefix)");
    });

    it("shows the label of the chosen order", async () => {
        const wrapper = await mountSuspended(SortSelect, {
            props: { modelValue: "oldest" },
            global,
        });

        expect(wrapper.find("[role=combobox]").text()).toContain("oldest");
    });

    // "Más antiguas" agrees with publicaciones; comments need "Más antiguos"
    it("words the control and its options with the copy it is given", async () => {
        const wrapper = await mountSuspended(SortSelect, {
            props: {
                modelValue: "oldest",
                copy: { label: "Ordenar comentarios", newest: "Recientes", oldest: "Antiguos" },
            },
            global,
        });

        const combobox = wrapper.find("[role=combobox]");

        expect(combobox.attributes("aria-label")).toBe("Ordenar comentarios");
        expect(combobox.text()).toContain("Antiguos");
    });

    it("emits a stable value rather than the label, so the URL never changes with the copy", async () => {
        const wrapper = await mountSuspended(SortSelect, {
            props: { modelValue: "newest" },
            global,
        });

        wrapper.findComponent({ name: "USelect" }).vm.$emit("update:modelValue", "oldest");

        expect(wrapper.emitted("update:modelValue")).toEqual([["oldest"]]);
    });
});
