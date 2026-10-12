import type { BreadcrumbItem } from "@nuxt/ui";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { h } from "vue";
import ArchiveIntro from "./Intro.vue";

const global = { mocks: { $t: (key: string) => `t(${key})` } };

const props: { breadcrumbs: BreadcrumbItem[] } = {
    breadcrumbs: [
        { label: "Publicaciones", to: { name: "publications" } },
        { label: "Derecho penal" },
    ],
};

describe("archive intro", () => {
    it("starts every breadcrumb at home and leaves the current page unlinked", async () => {
        const wrapper = await mountSuspended(ArchiveIntro, { props, global });

        expect(wrapper.findAll("nav a").map((link) => link.attributes("href"))).toEqual([
            "/",
            "/publicaciones/",
        ]);
        expect(wrapper.find("nav").text()).toContain("Derecho penal");
    });

    it("renders whatever heading the page puts under the breadcrumb", async () => {
        const wrapper = await mountSuspended(ArchiveIntro, {
            props,
            global,
            slots: { default: () => h("h1", "Derecho penal") },
        });

        expect(wrapper.find("h1").text()).toBe("Derecho penal");
    });
});
