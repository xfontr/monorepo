import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import SortSelect from "./SortSelect.vue";

const global = { mocks: { $t: (key: string) => `t(${key})` } };

describe("sort select", () => {
    it("names the control for what it sorts, since the visible prefix is hidden from assistive tech", async () => {
        const wrapper = await mountSuspended(SortSelect, {
            props: { modelValue: "newest" },
            global,
        });

        expect(wrapper.find("[role=combobox]").attributes("aria-label")).toBe(
            "t(sortSelect.label)",
        );
        expect(wrapper.find("span[aria-hidden=true]").text()).toBe("t(sortSelect.prefix)");
    });

    it("shows the label of the chosen order", async () => {
        const wrapper = await mountSuspended(SortSelect, {
            props: { modelValue: "oldest" },
            global,
        });

        expect(wrapper.find("[role=combobox]").text()).toContain("t(sortSelect.oldest)");
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
