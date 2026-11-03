import { mockNuxtImport, mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { createError } from "h3";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CalculoIntereses from "./calculo-intereses.vue";

const wordpress = vi.hoisted(() => ({ fails: false }));

registerEndpoint("/api/pages/calculo-intereses", () => {
    if (wordpress.fails) throw createError({ statusCode: 502 });

    return {
        id: "1",
        slug: "calculo-intereses",
        title: "Cálculo de intereses",
        permalink: "/calculo-intereses/",
        body: {
            lead: "<p>lead</p>",
            html: "<h2>guide-heading</h2>",
            toc: [],
            notes: [],
            bibliography: [],
        },
    };
});

mockNuxtImport("useSeoMeta", () => () => {});

beforeEach(() => {
    wordpress.fails = false;
    clearNuxtData();
});

describe("calculo-intereses page", () => {
    it("renders the WordPress page's body as the guide", async () => {
        const wrapper = await mountSuspended(CalculoIntereses);

        expect(wrapper.findAll("h2").map((heading) => heading.text())).toContain("guide-heading");
    });

    it("still renders the calculator when WordPress fails, only without the guide", async () => {
        wordpress.fails = true;

        const wrapper = await mountSuspended(CalculoIntereses);

        expect(wrapper.find("[role=tablist]").exists()).toBe(true);
        expect(wrapper.text()).not.toContain("guide-heading");
    });
});
