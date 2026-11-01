import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import type { CookieConsentConfig } from "vanilla-cookieconsent";
import { beforeEach, describe, expect, it, vi } from "vitest";
import plugin from "./consent.client";

const consent = vi.hoisted(() => ({
    run: vi.fn(),
    trackers: { googleAnalytics: { id: "" } },
}));

vi.mock("vanilla-cookieconsent", () => ({ run: consent.run }));

mockNuxtImport("useRuntimeConfig", (original) => () => {
    const config = original();

    return { ...config, public: { ...config.public, trackers: consent.trackers } };
});
mockNuxtImport("onNuxtReady", () => (callback: () => void) => callback());

const run = () =>
    (plugin as unknown as (app: object) => void)({ $i18n: { t: (key: string) => key } });

const config = () => consent.run.mock.calls[0]![0] as CookieConsentConfig;

beforeEach(() => {
    vi.clearAllMocks();

    consent.trackers.googleAnalytics.id = "";
});

describe("the cookie consent plugin", () => {
    it("shows no banner when no tracker is configured", () => {
        run();

        expect(consent.run).not.toHaveBeenCalled();
    });

    it("clears a tracker's cookies and reloads when its category is withdrawn", () => {
        consent.trackers.googleAnalytics.id = "G-TEST";

        run();

        expect(config().categories.analytics?.autoClear).toEqual({
            cookies: [{ name: /^_ga/ }],
            reloadPage: true,
        });
    });
});
