import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Ref } from "vue";
import plugin from "./trackers.client";

const trackers = vi.hoisted(() => ({
    loadAnalytics: vi.fn(),
    trigger: vi.fn(),
    config: { googleAnalytics: { id: "" } },
}));

mockNuxtImport("useRuntimeConfig", (original) => () => {
    const config = original();

    return { ...config, public: { ...config.public, trackers: trackers.config } };
});
mockNuxtImport("useScriptGoogleAnalytics", () => trackers.loadAnalytics);
mockNuxtImport("useScriptTriggerConsent", () => trackers.trigger);

const run = () => (plugin as unknown as () => void)();

const gate = () => (trackers.trigger.mock.calls[0]![0] as { consent: Ref<boolean> }).consent;

const consentTo = (type: string, categories: string[]) =>
    window.dispatchEvent(new CustomEvent(type, { detail: { cookie: { categories } } }));

beforeEach(() => {
    vi.clearAllMocks();

    trackers.config.googleAnalytics.id = "";
});

describe("the trackers plugin", () => {
    it("loads nothing for a tracker with no ID, so an unset env var never loads its script", () => {
        run();

        expect(trackers.loadAnalytics).not.toHaveBeenCalled();
    });

    it("holds a tracker's script until the reader accepts its category", () => {
        trackers.config.googleAnalytics.id = "G-TEST";

        run();

        expect(trackers.loadAnalytics).toHaveBeenCalledWith(
            expect.objectContaining({ id: "G-TEST" }),
        );
        expect(gate().value).toBe(false);

        consentTo("cc:onConsent", ["necessary", "analytics"]);

        expect(gate().value).toBe(true);
    });

    it("holds a tracker again once the reader withdraws its category", () => {
        trackers.config.googleAnalytics.id = "G-TEST";

        run();
        consentTo("cc:onConsent", ["necessary", "analytics"]);
        consentTo("cc:onChange", ["necessary"]);

        expect(gate().value).toBe(false);
    });
});
