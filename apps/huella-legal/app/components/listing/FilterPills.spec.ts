import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import FilterPills from "./FilterPills.vue";

const global = { mocks: { $t: (key: string, params: Record<string, unknown>) => `t(${key}, ${JSON.stringify(params)})` } };

const ITEMS = [
    { label: "Todo", to: "/publicaciones", count: 12, active: true },
    { label: "Artículos", to: "/publicaciones?formato=articulo", count: 9 },
    { label: "TFG", to: "/publicaciones?formato=tfg", count: 3 },
];

describe("filter pills", () => {
    it("is a named nav, so it is told apart from the site nav and the pagination", async () => {
        const wrapper = await mountSuspended(FilterPills, { props: { label: "Formato", items: ITEMS }, global });

        expect(wrapper.find("nav").attributes("aria-label")).toBe("Formato");
    });

    it("labels each filter with its own name, never the row's", async () => {
        const wrapper = await mountSuspended(FilterPills, { props: { label: "Formato", items: ITEMS }, global });

        expect(wrapper.findAll("a").map((link) => link.text().split(/\s/)[0])).toEqual(["Todo", "Artículos", "TFG"]);
    });

    it("links each filter to its own URL", async () => {
        const wrapper = await mountSuspended(FilterPills, { props: { label: "Formato", items: ITEMS }, global });

        expect(wrapper.findAll("a").map((link) => link.attributes("href"))).toEqual(ITEMS.map((item) => item.to));
    });

    it("marks only the active filter as current", async () => {
        const wrapper = await mountSuspended(FilterPills, { props: { label: "Formato", items: ITEMS }, global });

        expect(wrapper.findAll("a").map((link) => link.attributes("aria-current"))).toEqual(["true", undefined, undefined]);
    });

    it("reads each count as a phrase, since a bare number means nothing out loud", async () => {
        const wrapper = await mountSuspended(FilterPills, { props: { label: "Formato", items: ITEMS }, global });

        const tfg = wrapper.findAll("a")[2]!;

        expect(tfg.find("[aria-hidden=true]").text()).toBe("3");
        expect(tfg.find(".sr-only").text()).toBe("t(filterPills.count, {\"count\":3})");
    });
});
