import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import App from "./app.vue";

describe("app shell", () => {
    it("composes the application provider, layout and page", async () => {
        const wrapper = mount(App, {
            global: { stubs: {
                UApp: { template: "<div data-shell='app'><slot /></div>" }, NuxtLayout: { template: "<div data-shell='layout'><slot /></div>" }, NuxtPage: { template: "<div data-shell='page' />" },
            } },
        });
        expect(wrapper.find("[data-shell='layout']").exists()).toBe(true);
        expect(wrapper.find("[data-shell='page']").exists()).toBe(true);
    });
});
