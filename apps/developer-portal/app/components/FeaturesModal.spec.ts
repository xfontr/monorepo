import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import type { Feature } from "#shared/workflows.ts";
import FeaturesModal from "./FeaturesModal.vue";

const FEATURES: Feature[] = [
    {
        id: "blog",
        title: "Blog",
        summary: "",
        enabled: false,
        blocks: ["Article", "Listings"],
        within: null,
    },
    {
        id: "comments",
        title: "Comments",
        summary: "Readers comment.",
        enabled: true,
        blocks: ["Comments"],
        within: "blog",
    },
    {
        id: "storybook",
        title: "Storybook",
        summary: "Stories.",
        enabled: true,
        blocks: ["Storybook"],
        within: null,
    },
];

const stubs = {
    UModal: { props: { open: Boolean }, template: "<div v-if='open'><slot name='body' /></div>" },
};

const mount = (editable: boolean) =>
    mountSuspended(FeaturesModal, {
        props: { features: FEATURES, editable, open: true },
        global: { stubs },
    });

describe("FeaturesModal", () => {
    it("lists the blog beside every other feature, naming the blocks it brings in", async () => {
        const wrapper = await mount(true);
        const rows = wrapper.findAll("li").map((row) => row.text());

        expect(rows).toHaveLength(3);
        expect(rows[0]).toContain("Article, Listings");
    });

    it("won't switch on a feature inside one that is off, and says which it needs", async () => {
        const wrapper = await mount(true);
        const comments = wrapper.findAll("li")[1]!;

        expect(comments.text()).toContain("needs Blog");
        expect(comments.find("[role='switch']").attributes("disabled")).toBeDefined();
    });

    it("emits the switch so the page can write the project file", async () => {
        const wrapper = await mount(true);

        await wrapper.findAll("li")[2]!.find("[role='switch']").trigger("click");

        expect(wrapper.emitted("toggle")).toEqual([["storybook", false]]);
    });

    it("shows each feature's state without a switch on the static site", async () => {
        const wrapper = await mount(false);

        expect(wrapper.find("[role='switch']").exists()).toBe(false);
        expect(wrapper.text()).toContain("pnpm dev");
    });
});
