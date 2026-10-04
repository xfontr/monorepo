import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import EmptyState from "./EmptyState.vue";

const global = { mocks: { $t: (key: string, params?: Record<string, unknown>) => `t(${key}${params ? `, ${JSON.stringify(params)}` : ""})` } };

const PROPS = { subject: "Derecho administrativo", publishTo: "/publicar", browseTo: "/materias" };

describe("empty state", () => {
    it("names the subject in the heading and the landmark", async () => {
        const wrapper = await mountSuspended(EmptyState, { props: PROPS, global });

        const title = "t(emptyState.title, {\"subject\":\"Derecho administrativo\"})";

        expect(wrapper.find("h2").text()).toBe(title);
        expect(wrapper.find("section").attributes("aria-label")).toBe(title);
    });

    it("offers to publish first, then a way out to the other subjects", async () => {
        const wrapper = await mountSuspended(EmptyState, { props: PROPS, global });

        const links = wrapper.findAll("a").map((link) => [link.text(), link.attributes("href")]);

        expect(links).toEqual([["t(emptyState.publish)", "/publicar"], ["t(emptyState.browse)", "/materias"]]);
    });
});
