import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import Kicker from "./Kicker.vue";

describe("kicker", () => {
    it("renders a link only when given somewhere to go", async () => {
        const linked = await mountSuspended(Kicker, { props: { to: "/materias/penal" }, slots: { default: () => "Derecho penal" } });
        const plain = await mountSuspended(Kicker, { slots: { default: () => "Derecho penal" } });

        expect(linked.find("a").attributes("href")).toBe("/materias/penal");
        expect(plain.find("a").exists()).toBe(false);
        expect(plain.text()).toBe("Derecho penal");
    });

    it("keeps its colour on a link instead of taking Nuxt UI's link colours", async () => {
        const wrapper = await mountSuspended(Kicker, { props: { to: "/materias", muted: true }, slots: { default: () => "Materia" } });

        expect(wrapper.find("a").classes()).toContain("text-muted");
        expect(wrapper.find("a").classes()).not.toContain("text-primary");
    });
});
