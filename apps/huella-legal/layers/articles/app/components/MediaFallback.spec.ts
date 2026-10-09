import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import MediaFallback from "./MediaFallback.vue";

describe("media fallback", () => {
    it("is hidden from assistive tech, since it stands in for an image that has no alt to give", async () => {
        const wrapper = await mountSuspended(MediaFallback, {
            props: { label: "Imagen del artículo" },
        });

        expect(wrapper.attributes("aria-hidden")).toBe("true");
        expect(wrapper.text()).toContain("Imagen del artículo");
    });

    it("darkens to slate when asked, so it can stand in on a dark band", async () => {
        const wrapper = await mountSuspended(MediaFallback, { props: { tone: "slate" } });

        expect(wrapper.classes()).toContain("bg-huella-slate-800");
    });
});
