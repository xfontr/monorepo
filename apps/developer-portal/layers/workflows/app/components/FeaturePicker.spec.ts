import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import type { Feature } from "#layers/workflows/shared/workflows.ts";
import FeaturePicker from "./FeaturePicker.vue";

const feature = (overrides: Partial<Feature>): Feature => ({
    id: "",
    title: "",
    summary: "",
    enabled: true,
    blocks: [],
    points: 0,
    within: null,
    ...overrides,
});

const FEATURES = [
    feature({ id: "comments", title: "Comments", enabled: true, within: "blog" }),
    feature({
        id: "blog",
        title: "Blog",
        enabled: false,
        blocks: [
            { title: "Post page", complexity: 8 },
            { title: "Listings", complexity: 5 },
        ],
        points: 13,
    }),
    feature({
        id: "search",
        title: "Search",
        enabled: false,
        blocks: [{ title: "Search", complexity: 3 }],
        points: 3,
    }),
];

const mount = (editable: boolean) =>
    mountSuspended(FeaturePicker, { props: { features: FEATURES, editable } });

describe("FeaturePicker", () => {
    it("puts a feature right after the one it sits inside, wherever the list had it", async () => {
        const wrapper = await mount(true);
        const titles = wrapper.findAll("[role='switch']").map((card) => card.text());

        expect(titles[0]).toContain("Blog");
        expect(titles[1]).toContain("Comments");
    });

    it("locks a feature whose parent is off, saying which one it needs", async () => {
        const wrapper = await mount(true);
        const comments = wrapper.findAll("[role='switch']")[1];

        expect(comments?.attributes("disabled")).toBeDefined();
        expect(comments?.text()).toContain("Needs Blog");
    });

    it("prices a feature and each of its blocks, so a reader sees what switching it on costs", async () => {
        const blog = (await mount(true)).findAll("[role='switch']")[0]?.text();

        expect(blog).toContain("13 SP");
        expect(blog).toContain("Post page · 8 SP");
        expect(blog).toContain("Listings · 5 SP");
    });

    it("toggles a feature from anywhere on its card", async () => {
        const wrapper = await mount(true);
        await wrapper.findAll("[role='switch']")[2]?.trigger("click");

        expect(wrapper.emitted("toggle")).toEqual([["search", true]]);
    });

    it("toggles nothing on the static site", async () => {
        const wrapper = await mount(false);

        expect(
            wrapper
                .findAll("[role='switch']")
                .every((card) => card.attributes("disabled") !== undefined),
        ).toBe(true);
    });
});
