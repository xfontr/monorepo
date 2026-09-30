import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import App from "./app.vue";

const global = {
    stubs: {
        NuxtLayout: { template: "<div data-shell='layout'><slot /></div>" },
        NuxtPage: { template: "<div data-shell='page' />" },
    },
};

describe("app shell", () => {
    it("renders every page inside the layout, so none ships without the document head", () => {
        const wrapper = mount(App, { global });

        expect(wrapper.find("[data-shell='layout'] [data-shell='page']").exists()).toBe(true);
    });
});
