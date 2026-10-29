import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import HomeSubjects from "./Subjects.vue";

const global = {
    mocks: {
        $t: (key: string, params?: Record<string, unknown>) =>
            `t(${key}${params ? `, ${JSON.stringify(params)}` : ""})`,
    },
};

const props = {
    subjects: [
        { value: { id: "1", slug: "derecho-penal", name: "Derecho penal" }, count: 3 },
        { value: { id: "2", slug: "derecho-civil", name: "Derecho civil" }, count: 1 },
    ],
    formats: [
        { value: "articulo" as const, count: 3 },
        { value: "tfg-tfm" as const, count: 1 },
    ],
};

describe("home subjects", () => {
    it("links every subject to its own listing", async () => {
        const wrapper = await mountSuspended(HomeSubjects, { props, global });

        expect(wrapper.findAll("li a").map((link) => link.attributes("href"))).toEqual([
            "/areas/derecho-penal/",
            "/areas/derecho-civil/",
        ]);
    });

    // A bare number after the name reads as part of it to a screen reader
    it("speaks each count as a number of publications", async () => {
        const wrapper = await mountSuspended(HomeSubjects, { props, global });

        expect(wrapper.find("li .sr-only").text()).toBe('t(homeSubjects.count, {"count":3})');
    });

    it("links each format to the archive filtered by it", async () => {
        const wrapper = await mountSuspended(HomeSubjects, { props, global });

        expect(wrapper.findAll("nav a").map((link) => link.attributes("href"))).toEqual([
            "/publicaciones/?format=articulo",
            "/publicaciones/?format=tfg-tfm",
        ]);
    });

    it("drops the format line when there is only one format to filter by", async () => {
        const wrapper = await mountSuspended(HomeSubjects, {
            props: { ...props, formats: props.formats.slice(0, 1) },
            global,
        });

        expect(wrapper.find("nav").exists()).toBe(false);
    });
});
