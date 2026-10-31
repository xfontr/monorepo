import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import AboutFingerprint from "./Fingerprint.vue";

describe("about fingerprint", () => {
    it("is decoration only, hidden from assistive technology", async () => {
        const wrapper = await mountSuspended(AboutFingerprint);

        expect(wrapper.find("svg").attributes("aria-hidden")).toBe("true");
    });

    it("draws on load unless told to wait until it scrolls into view", async () => {
        const onLoad = await mountSuspended(AboutFingerprint);
        const onView = await mountSuspended(AboutFingerprint, { props: { drawOnView: true } });

        expect(onLoad.find("svg").attributes("data-waiting")).toBeUndefined();
        expect(onView.find("svg").attributes("data-waiting")).toBe("true");
    });

    // The draw animation offsets a dash of length 1, so a path measured any other way never finishes
    it("normalises every ridge to a length of one, each with its own stagger index", async () => {
        const wrapper = await mountSuspended(AboutFingerprint);

        const paths = wrapper.findAll("path");

        expect(paths.length).toBeGreaterThan(1);
        expect(paths.every((path) => path.attributes("pathLength") === "1")).toBe(true);
        expect(paths.map((path) => path.attributes("style"))).toEqual(
            paths.map((_, index) => `--ridge: ${index};`),
        );
    });
});
