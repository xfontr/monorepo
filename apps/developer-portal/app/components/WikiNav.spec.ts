import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import WikiNav from "./WikiNav.vue";
import type { WikiSection } from "#shared/wiki.ts";

const sections: WikiSection[] = [{
    id: "docs",
    label: "Docs",
    icon: "i-lucide-library",
    blurb: "Docs",
    groups: [
        {
            key: "guides",
            label: "Guides",
            entries: [
                { path: "/docs/guides/readme", label: "Overview", kind: "doc" },
                { path: "/docs/guides/first-hour", label: "First hour", kind: "doc" },
            ],
        },
        {
            key: "concepts",
            label: "Concepts",
            entries: [{ path: "/docs/concepts/readme", label: "Concepts", kind: "doc" }],
        },
    ],
}];

describe("WikiNav", () => {
    it("opens only the group containing the current page and marks that entry selected", async () => {
        const wrapper = await mountSuspended(WikiNav, { props: { sections, current: "/docs/guides/first-hour" } });

        expect(wrapper.text()).toContain("First hour");
        expect(wrapper.find("a[href='/docs/docs/concepts/readme']").exists()).toBe(false);
        expect(wrapper.find("a[href='/docs/docs/guides/first-hour']").classes()).toContain("bg-elevated/70");
    });

    it("opens and closes a folded group while overview labels remain links", async () => {
        const wrapper = await mountSuspended(WikiNav, { props: { sections } });
        expect(wrapper.find("a[href='/docs/docs/guides/first-hour']").exists()).toBe(false);
        expect(wrapper.find("a[href='/docs/docs/guides/readme']").text()).toBe("Guides");

        const label = wrapper.findAll("button").find((button) => button.text() === "Concepts");
        await label!.trigger("click");
        expect(wrapper.find("a[href='/docs/docs/concepts/readme']").exists()).toBe(true);
        await label!.trigger("click");
        expect(wrapper.find("a[href='/docs/docs/concepts/readme']").exists()).toBe(false);
    });

    it("uses a non-overview group label as its toggle and follows current changes until toggled", async () => {
        const wrapper = await mountSuspended(WikiNav, { props: { sections, current: "/docs/concepts/readme" } });

        expect(wrapper.find("a[href='/docs/docs/concepts/readme']").exists()).toBe(true);
        const label = wrapper.findAll("button").find((button) => button.text() === "Concepts");
        expect(label).toBeDefined();

        await wrapper.setProps({ current: "/docs/guides/first-hour" });
        expect(wrapper.text()).toContain("First hour");
        await label!.trigger("click");
        await wrapper.setProps({ current: "/docs/guides/readme" });
        expect(wrapper.text()).toContain("First hour");
    });
});
