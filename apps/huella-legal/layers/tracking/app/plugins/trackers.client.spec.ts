import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NuxtApp } from "#app";
import type { Ref } from "vue";
import type { AnalyticsEvent } from "~/types/AnalyticsEvent";
import plugin from "./trackers.client";

const trackers = vi.hoisted(() => ({
    gtag: vi.fn(),
    hook: vi.fn(),
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

const run = () =>
    (plugin as unknown as (app: Pick<NuxtApp, "hook">) => Promise<void>)({
        hook: trackers.hook as unknown as NuxtApp["hook"],
    });

// The handler the run registered, called directly so earlier runs' listeners can't answer it
const raise = () =>
    (trackers.hook.mock.calls[0]![1] as (event: AnalyticsEvent) => void)({
        name: "share",
        params: { method: "print" },
    });

const gate = () => (trackers.trigger.mock.calls[0]![0] as { consent: Ref<boolean> }).consent;

const consentTo = (type: string, categories: string[]) =>
    window.dispatchEvent(new CustomEvent(type, { detail: { cookie: { categories } } }));

beforeEach(() => {
    vi.clearAllMocks();

    trackers.loadAnalytics.mockReturnValue({ proxy: { gtag: trackers.gtag } });
    trackers.config.googleAnalytics.id = "";
});

afterEach(() => {
    document.cookie = "cc_cookie=; max-age=0; path=/";
});

describe("the trackers plugin", () => {
    it("loads nothing for a tracker with no ID, so an unset env var never loads its script", async () => {
        await run();

        expect(trackers.loadAnalytics).not.toHaveBeenCalled();
    });

    it("holds a tracker's script until the reader accepts its category", async () => {
        trackers.config.googleAnalytics.id = "G-TEST";

        await run();

        expect(trackers.loadAnalytics).toHaveBeenCalledWith(
            expect.objectContaining({ id: "G-TEST" }),
        );
        expect(gate().value).toBe(false);

        consentTo("cc:onConsent", ["necessary", "analytics"]);

        expect(gate().value).toBe(true);
    });

    it("holds a tracker again once the reader withdraws its category", async () => {
        trackers.config.googleAnalytics.id = "G-TEST";

        await run();
        consentTo("cc:onConsent", ["necessary", "analytics"]);
        consentTo("cc:onChange", ["necessary"]);

        expect(gate().value).toBe(false);
    });

    it("drops an event raised before consent instead of sending it once the reader accepts", async () => {
        trackers.config.googleAnalytics.id = "G-TEST";

        await run();
        raise();
        consentTo("cc:onConsent", ["necessary", "analytics"]);

        expect(trackers.gtag).not.toHaveBeenCalled();
    });

    it("sends an event to the tracker as a GA event once its category is accepted", async () => {
        trackers.config.googleAnalytics.id = "G-TEST";

        await run();
        consentTo("cc:onConsent", ["necessary", "analytics"]);
        raise();

        expect(trackers.gtag).toHaveBeenCalledWith("event", "share", { method: "print" });
    });

    it("honours consent given on an earlier visit, so events raised while the page loads are sent", async () => {
        trackers.config.googleAnalytics.id = "G-TEST";
        document.cookie = `cc_cookie=${encodeURIComponent(
            JSON.stringify({ categories: ["necessary", "analytics"] }),
        )}; path=/`;

        await run();
        raise();

        expect(gate().value).toBe(true);
        expect(trackers.gtag).toHaveBeenCalledOnce();
    });
});
