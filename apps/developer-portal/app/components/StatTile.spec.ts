import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { describe, expect, it } from "vitest";
import StatTile from "./StatTile.vue";

const IconStub = defineComponent({
    props: { name: { type: String, default: "" } },
    template: '<i :data-icon="name" />',
});

const NuxtLinkStub = { props: { to: String }, template: '<a :href="to"><slot /></a>' };

describe("StatTile", () => {
    it("keeps a tile without a destination as a non-link container", () => {
        const wrapper = mount(StatTile, {
            props: { label: "Projects", value: 4 },
            global: { stubs: { UIcon: IconStub, NuxtLink: NuxtLinkStub } },
        });

        expect(wrapper.element.tagName).toBe("DIV");
        expect(wrapper.text()).toContain("Projects");
        expect(wrapper.text()).toContain("4");
        expect(wrapper.find("a").exists()).toBe(false);
    });

    it("uses the requested Nuxt destination when a tile is navigable", () => {
        const wrapper = mount(StatTile, {
            props: { label: "Docs", value: 12, to: "/docs" },
            global: { stubs: { UIcon: IconStub, NuxtLink: NuxtLinkStub } },
        });

        expect(wrapper.find("a").attributes("href")).toBe("/docs");
    });

    it("renders optional hint and icon and marks only non-neutral tones", () => {
        const warned = mount(StatTile, {
            props: {
                label: "Coverage",
                value: "75%",
                hint: "weighted",
                icon: "i-lucide-shield",
                tone: "warn",
            },
            global: { stubs: { UIcon: IconStub, NuxtLink: NuxtLinkStub } },
        });
        const neutral = mount(StatTile, {
            props: { label: "Empty", value: "—", tone: "neutral" },
            global: { stubs: { UIcon: IconStub } },
        });

        expect(warned.text()).toContain("weighted");
        expect(warned.find("[data-icon]").attributes("data-icon")).toBe("i-lucide-shield");
        expect(warned.find(".tone-warn").text()).toContain("75%");
        expect(neutral.find(".tone-neutral").exists()).toBe(false);
    });
});
