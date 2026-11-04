import { afterEach, describe, expect, it, vi } from "vitest";
import plugin from "./replayClick.client";

const slot = window as unknown as { __pendingClick?: HTMLElement | null };

// Runs the plugin, then resolves hydration the way Nuxt does once the app has mounted
const hydrate = () => {
    let resolve = () => {};
    const nuxtApp = {
        hooks: { hookOnce: (_name: string, fn: () => void) => (resolve = fn) },
    };

    (plugin as unknown as (nuxtApp: unknown) => void)(nuxtApp);
    resolve();
};

const pressed = () => {
    const button = document.createElement("button");
    const onClick = vi.fn();

    button.addEventListener("click", onClick);
    document.body.append(button);
    slot.__pendingClick = button;

    return { button, onClick };
};

afterEach(() => {
    delete slot.__pendingClick;
    document.body.replaceChildren();
});

describe("the click replay plugin", () => {
    it("clicks the control the reader pressed before hydration, once the app can answer", () => {
        const { onClick } = pressed();

        hydrate();

        expect(onClick).toHaveBeenCalledOnce();
    });

    it("leaves a control alone that left the page while the app hydrated", () => {
        const { button, onClick } = pressed();
        button.remove();

        hydrate();

        expect(onClick).not.toHaveBeenCalled();
    });

    it("closes the slot, so the loader stops keeping clicks the app already answers", () => {
        hydrate();

        expect(slot.__pendingClick).toBeNull();
    });
});
