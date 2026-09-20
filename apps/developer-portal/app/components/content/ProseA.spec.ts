import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import ProseA from "./ProseA.vue";

const NuxtLinkStub = {
    props: { to: String, target: String },
    template: "<a :href=\"to\" :target=\"target\"><slot /></a>",
};

describe("ProseA", () => {
    it("turns a repo target into an external master-branch forge link", async () => {
        useRuntimeConfig().public.repoUrl = "https://github.com/acme/repo";
        const wrapper = await mountSuspended(ProseA, {
            props: { href: "repo:packages/ui/README.md" },
            slots: { default: "UI README" },
            global: { stubs: { NuxtLink: NuxtLinkStub } },
        });

        expect(wrapper.find("a").attributes()).toMatchObject({
            href: "https://github.com/acme/repo/blob/master/packages/ui/README.md",
            target: "_blank",
        });
    });

    it("renders an unconfigured repo target as text rather than a dead link", async () => {
        useRuntimeConfig().public.repoUrl = "";
        const wrapper = await mountSuspended(ProseA, {
            props: { href: "repo:packages/ui/README.md" },
            slots: { default: "UI README" },
            global: { stubs: { NuxtLink: NuxtLinkStub } },
        });

        expect(wrapper.find("a").exists()).toBe(false);
        expect(wrapper.text()).toBe("UI README");
    });

    it("passes normal links and caller targets through unchanged", async () => {
        useRuntimeConfig().public.repoUrl = "";
        const wrapper = await mountSuspended(ProseA, {
            props: { href: "/docs/readme", target: "_blank" },
            slots: { default: "Readme" },
            global: { stubs: { NuxtLink: NuxtLinkStub } },
        });

        expect(wrapper.find("a").attributes()).toMatchObject({ href: "/docs/readme", target: "_blank" });
    });
});
