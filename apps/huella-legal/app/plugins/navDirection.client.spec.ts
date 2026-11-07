import { afterEach, describe, expect, it } from "vitest";
import plugin from "./navDirection.client";

// Mimics Vue Router: a push runs `beforeEach` on the old entry, a popstate on the entry it lands on
const install = () => {
    let before = () => {};
    let after = () => {};
    const $router = {
        beforeEach: (fn: () => void) => (before = fn),
        afterEach: (fn: () => void) => (after = fn),
    };

    (plugin as unknown as (nuxtApp: unknown) => void)({ $router });

    const land = (position: number) => {
        window.history.replaceState({ position }, "");
        after();
    };

    return {
        push: (from: number) => {
            window.history.replaceState({ position: from }, "");
            before();
            land(from + 1);
        },
        pop: (to: number) => {
            window.history.replaceState({ position: to }, "");
            before();
            land(to);
        },
        land,
        leave: () => before(),
    };
};

const direction = () => document.documentElement.dataset.nav;

afterEach(() => {
    delete document.documentElement.dataset.nav;
    window.history.replaceState(null, "");
});

describe("the navigation direction plugin", () => {
    it("slides forward on a link click, so following a link never looks like going back", () => {
        const nav = install();
        nav.land(0);

        nav.push(0);

        expect(direction()).toBe("forward");
    });

    it("slides back when the back button lands on an earlier entry", () => {
        const nav = install();
        nav.land(0);
        nav.push(0);

        nav.pop(0);

        expect(direction()).toBe("back");
    });

    it("slides forward again when the forward button returns to a later entry", () => {
        const nav = install();
        nav.land(0);
        nav.push(0);
        nav.pop(0);

        nav.pop(1);

        expect(direction()).toBe("forward");
    });

    it("falls back to forward when the history entry carries no position", () => {
        const nav = install();
        nav.land(3);

        window.history.replaceState(null, "");
        nav.leave();

        expect(direction()).toBe("forward");
    });
});
