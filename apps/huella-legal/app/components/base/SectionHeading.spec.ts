import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import SectionHeading from "./SectionHeading.vue";

const SEE_ALL = { label: "Ver todo", to: "/publicaciones" };

describe("section heading", () => {
    it("carries the id on the heading itself, so aria-labelledby and anchors reach it", async () => {
        const wrapper = await mountSuspended(SectionHeading, { props: { title: "Recientes", id: "recientes" } });

        expect(wrapper.find("h2").attributes("id")).toBe("recientes");
        expect(wrapper.find("h2").text()).toBe("Recientes");
    });

    it("draws the see-all link only when given one", async () => {
        const plain = await mountSuspended(SectionHeading, { props: { title: "Recientes" } });
        const linked = await mountSuspended(SectionHeading, { props: { title: "Recientes", action: SEE_ALL } });

        expect(plain.find("a").exists()).toBe(false);
        expect(linked.find("a").attributes("href")).toBe("/publicaciones");
        expect(linked.find("a").text()).toBe("Ver todo");
    });

    it("describes the see-all link by its heading, so a links list never reads \"Ver todo\" twice", async () => {
        const named = await mountSuspended(SectionHeading, { props: { title: "Recientes", action: SEE_ALL, id: "recientes" } });
        const unnamed = await mountSuspended(SectionHeading, { props: { title: "Recientes", action: SEE_ALL } });

        expect(named.find("a").attributes("aria-describedby")).toBe("recientes");
        expect(unnamed.find("a").attributes("aria-describedby")).toBe(unnamed.find("h2").attributes("id"));
        expect(unnamed.find("h2").attributes("id")).toBeTruthy();
    });

    it("prints the kicker above the title only when given one", async () => {
        const wrapper = await mountSuspended(SectionHeading, { props: { title: "Recientes", kicker: "Archivo" } });

        expect(wrapper.find("p").text()).toBe("Archivo");
        expect(wrapper.find("h2").classes()).toContain("mt-1");
    });
});
