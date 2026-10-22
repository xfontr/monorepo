import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import FormChallenge from "./FormChallenge.vue";

const reset = vi.hoisted(() => vi.fn());

// The real widget would fetch Cloudflare's script, so only its contract with the challenge is kept
const NuxtTurnstile = defineComponent({
    name: "NuxtTurnstile",
    props: { modelValue: { type: String, default: undefined } },
    emits: ["update:modelValue"],
    setup: (_, { expose }) => {
        expose({ reset });

        return () => h("div", { "data-turnstile": "" });
    },
});

const setUp = async () => {
    let challenge: Challenge | undefined;

    const wrapper = await mountSuspended(FormChallenge, {
        attachTo: document.body,
        global: { stubs: { NuxtTurnstile } },
        slots: {
            default: (props: { challenge: Challenge }) => {
                challenge = props.challenge;

                return h("form", [h("input", { type: "email" })]);
            },
        },
    });

    const mint = async (token: string) => {
        await nextTick();
        wrapper.findComponent(NuxtTurnstile).vm.$emit("update:modelValue", token);
    };

    return { wrapper, challenge: challenge!, mint };
};

describe("FormChallenge", () => {
    beforeEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        document.body.replaceChildren();
    });

    it("mounts the widget only once its form is focused, so an idle page never loads it", async () => {
        const { wrapper } = await setUp();

        expect(wrapper.find("[data-turnstile]").exists()).toBe(false);

        wrapper.find("input").element.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
        await nextTick();

        expect(wrapper.find("[data-turnstile]").exists()).toBe(true);
    });

    it("hands the post the token, arming a widget nobody focused", async () => {
        const { challenge, mint } = await setUp();
        const send = vi.fn(async () => "sent");

        const pending = challenge(send);

        await mint("tok");

        await expect(pending).resolves.toBe("sent");
        expect(send).toHaveBeenCalledWith("tok");
    });

    it("resets the spent widget only once the post settles, failed or not", async () => {
        const { challenge, mint } = await setUp();
        const failure = new Error("403");
        const send = vi.fn(async () => {
            expect(reset).not.toHaveBeenCalled();
            throw failure;
        });

        const pending = challenge(send);

        await mint("tok");

        await expect(pending).rejects.toBe(failure);
        expect(reset).toHaveBeenCalledOnce();
    });

    it("spends the token, so a retry waits for the one the reset mints", async () => {
        const { challenge, mint } = await setUp();
        const send = vi.fn(async () => undefined);

        const first = challenge(send);

        await mint("spent");
        await first;

        const retry = challenge(send);

        await flushPromises();
        expect(send).toHaveBeenCalledOnce();

        await mint("fresh");
        await retry;

        expect(send).toHaveBeenLastCalledWith("fresh");
    });

    it("gives up on a widget that never yields a token, without posting", async () => {
        const { challenge } = await setUp();
        const send = vi.fn(async () => undefined);

        vi.useFakeTimers();

        const settled = challenge(send).then(
            () => "posted",
            () => "gave up",
        );

        await vi.advanceTimersByTimeAsync(30_000);

        expect(await settled).toBe("gave up");
        expect(send).not.toHaveBeenCalled();
    });
});
