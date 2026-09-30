import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ProseA from "./ProseA.vue";

const NuxtLinkStub = {
    props: { to: String, target: String },
    template: "<a :href=\"to\" :target=\"target\"><slot /></a>",
};

describe("ProseA", () => {
    it("turns a repo target into an external master-branch forge link", () => {
        useRuntimeConfig().public.repoUrl = "https://github.com/acme/repo";
        const wrapper = mount(ProseA, {
            props: { href: "repo:packages/ui/README.md" },
            slots: { default: "UI README" },
            global: { stubs: { NuxtLink: NuxtLinkStub } },
        });

        expect(wrapper.find("a").attributes()).toMatchObject({
            href: "https://github.com/acme/repo/blob/master/packages/ui/README.md",
            target: "_blank",
        });
    });

    it("renders an unconfigured repo target as text rather than a dead link", () => {
        useRuntimeConfig().public.repoUrl = "";
        const wrapper = mount(ProseA, {
            props: { href: "repo:packages/ui/README.md" },
            slots: { default: "UI README" },
            global: { stubs: { NuxtLink: NuxtLinkStub } },
        });

        expect(wrapper.find("a").exists()).toBe(false);
        expect(wrapper.text()).toBe("UI README");
    });

    it("passes normal links and caller targets through unchanged", () => {
        useRuntimeConfig().public.repoUrl = "";
        const wrapper = mount(ProseA, {
            props: { href: "/docs/readme", target: "_blank" },
            slots: { default: "Readme" },
            global: { stubs: { NuxtLink: NuxtLinkStub } },
        });

        expect(wrapper.find("a").attributes()).toMatchObject({ href: "/docs/readme", target: "_blank" });
    });
});
