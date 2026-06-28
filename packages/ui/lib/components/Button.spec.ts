import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Button from "./Button.vue";

describe("test", () => {
    it("render", () => {
        const wrapper = mount(Button);

        expect(wrapper.html()).include("test");
    });
});
