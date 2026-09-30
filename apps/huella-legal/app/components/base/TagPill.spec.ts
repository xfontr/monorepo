import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import TagPill from "./TagPill.vue";

mockNuxtImport("useI18n", () => () => ({
    t: (key: string, params: Record<string, unknown>) => `t(${key}, ${JSON.stringify(params)})`,
}));

describe("tag pill", () => {
    it("marks the active pill as the current page, which Nuxt UI skips for a forced active", async () => {
        const active = await mountSuspended(TagPill, { props: { label: "Derecho penal", to: "/materias/penal", active: true } });
        const idle = await mountSuspended(TagPill, { props: { label: "Derecho civil", to: "/materias/civil" } });

        expect(active.find("a").attributes("aria-current")).toBe("page");
        expect(idle.find("a").attributes("aria-current")).toBeUndefined();
    });

    it("fills the active pill instead of outlining it", async () => {
        const wrapper = await mountSuspended(TagPill, { props: { label: "Derecho penal", to: "/materias/penal", active: true } });

        expect(wrapper.find("a").classes()).toContain("bg-primary");
    });

    it("reads the count as a phrase, since a bare number means nothing out loud", async () => {
        const wrapper = await mountSuspended(TagPill, { props: { label: "Derecho penal", to: "/materias/penal", count: 12 } });

        expect(wrapper.find("[aria-hidden=true]").text()).toBe("12");
        expect(wrapper.find(".sr-only").text()).toBe("t(tagPill.count, {\"count\":12})");
    });

    it("shows no count when none is given", async () => {
        const wrapper = await mountSuspended(TagPill, { props: { label: "Derecho penal", to: "/materias/penal" } });

        expect(wrapper.find(".sr-only").exists()).toBe(false);
    });
});
