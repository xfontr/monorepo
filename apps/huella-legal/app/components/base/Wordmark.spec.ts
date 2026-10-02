import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import Wordmark from "./Wordmark.vue";

const global = { mocks: { $t: (key: string) => `t(${key})` } };

describe("wordmark", () => {
    it("takes the name from translations, with the accent word set apart", async () => {
        const wrapper = await mountSuspended(Wordmark, { global });

        expect(wrapper.text()).toBe("t(wordmark.lead) t(wordmark.accent)");
        expect(wrapper.find(".italic").text()).toBe("t(wordmark.accent)");
    });

    it("leaves the tagline out unless asked, so the header strip stays one line", async () => {
        const plain = await mountSuspended(Wordmark, { global });
        const tagged = await mountSuspended(Wordmark, { props: { tagline: true }, global });

        expect(plain.text()).not.toContain("t(wordmark.tagline)");
        expect(tagged.text()).toContain("t(wordmark.tagline)");
    });

    it("switches the accent to light teal on slate, where the ink accent would vanish", async () => {
        const wrapper = await mountSuspended(Wordmark, { props: { tone: "paper" }, global });

        expect(wrapper.find(".italic").classes()).toContain("text-huella-teal-300");
    });
});
