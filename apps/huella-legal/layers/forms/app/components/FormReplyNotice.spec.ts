import { mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import FormReplyNotice from "./FormReplyNotice.vue";

const MESSAGES = { formReplyNotice: { description: "slower than usual", title: "slow" } };

const pace = vi.hoisted(() => ({ until: undefined as string | undefined }));

vi.mock("../composables/useReplyPace", () => ({ useReplyPace: () => ref(pace.until) }));

beforeEach(() => {
    useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
});

describe("reply notice", () => {
    it("warns until the last slow day has passed", async () => {
        pace.until = "2026-08-31";

        const wrapper = await mountSuspended(FormReplyNotice);

        expect(wrapper.text()).toContain("slower than usual");
    });

    it("renders nothing at the usual pace, so the forms look as they always have", async () => {
        pace.until = undefined;

        const wrapper = await mountSuspended(FormReplyNotice);

        expect(wrapper.text()).toBe("");
    });
});
