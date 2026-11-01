import { mountSuspended } from "@nuxt/test-utils/runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { NEWSLETTER_ID, useNewsletterJump } from "./useNewsletterJump";

const setUp = async () => {
    let jump: ReturnType<typeof useNewsletterJump> | undefined;

    await mountSuspended(
        defineComponent({
            setup: () => {
                jump = useNewsletterJump();

                return () => null;
            },
        }),
    );

    return jump!;
};

const addBand = () => {
    const band = document.createElement("section");

    band.id = NEWSLETTER_ID;
    band.scrollIntoView = vi.fn();
    band.animate = vi.fn();
    document.body.append(band);

    return band;
};

const click = (init?: MouseEventInit) => new MouseEvent("click", { cancelable: true, ...init });

beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => callback(0));
});

afterEach(() => {
    document.getElementById(NEWSLETTER_ID)?.remove();
    vi.unstubAllGlobals();
});

describe("useNewsletterJump", () => {
    it("stays on a page that has its own band instead of sending the reader home", async () => {
        const jump = await setUp();
        const band = addBand();
        const event = click();

        jump(event);

        expect(event.defaultPrevented).toBe(true);
        expect(band.scrollIntoView).toHaveBeenCalledOnce();
        expect(band.animate).toHaveBeenCalledOnce();
    });

    it("lets the link go home from a page with no band, and washes the band once it lands", async () => {
        const jump = await setUp();
        const event = click();

        jump(event);

        expect(event.defaultPrevented).toBe(false);

        const band = addBand();

        await useNuxtApp().hooks.callHook("page:loading:end");

        expect(band.animate).toHaveBeenCalledOnce();
    });

    it("leaves a modified click to the browser, so it can still open home in a new tab", async () => {
        const jump = await setUp();
        const band = addBand();
        const event = click({ metaKey: true });

        jump(event);

        expect(event.defaultPrevented).toBe(false);
        expect(band.scrollIntoView).not.toHaveBeenCalled();
    });
});
