import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import Button from "./Button.vue";

describe("Button", () => {
    it("renders a button rather than a clickable div, so it is reachable by keyboard", () => {
        const wrapper = mount(Button);
        const button = wrapper.find("button");

        expect(button.exists()).toBe(true);
        expect(button.attributes("type")).toBe("button");
    });
});
