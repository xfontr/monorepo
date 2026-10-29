import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { h, nextTick } from "vue";
import Reveal from "./Reveal.vue";

const ITEMS = Array.from({ length: 5 }, (_, index) => `Elemento ${index}`);

const links = ({ items }: { items: unknown[] }) =>
    h(
        "ul",
        items.map((item) => h("li", h("a", { href: "#" }, String(item)))),
    );

const mountReveal = (items = ITEMS) =>
    mountSuspended(Reveal, {
        props: { items, limit: 3, label: "Mostrar todos" },
        slots: { default: links },
        attachTo: document.body,
    });

const shown = (wrapper: Awaited<ReturnType<typeof mountReveal>>) =>
    wrapper.findAll("a").map((link) => link.text());

describe("reveal", () => {
    it("hands the slot only the first items and offers the rest behind one button", async () => {
        const wrapper = await mountReveal();

        expect(shown(wrapper)).toEqual(ITEMS.slice(0, 3));
        expect(wrapper.find("button").text()).toBe("Mostrar todos");
    });

    it("reveals every item and moves focus to the first one revealed", async () => {
        const wrapper = await mountReveal();

        await wrapper.find("button").trigger("click");
        await nextTick();

        expect(shown(wrapper)).toEqual(ITEMS);
        expect(wrapper.find("button").exists()).toBe(false);
        expect(document.activeElement?.textContent).toBe(ITEMS[3]);

        wrapper.unmount();
    });

    it("offers no button when every item already fits", async () => {
        const wrapper = await mountReveal(ITEMS.slice(0, 3));

        expect(wrapper.find("button").exists()).toBe(false);
    });
});
