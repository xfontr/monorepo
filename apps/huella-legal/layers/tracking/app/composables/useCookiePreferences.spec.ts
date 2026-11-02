import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCookiePreferences } from "./useCookiePreferences";

const preferences = vi.hoisted(() => ({
    showPreferences: vi.fn(),
    trackers: { googleAnalytics: { id: "" } },
}));

vi.mock("vanilla-cookieconsent", () => ({ showPreferences: preferences.showPreferences }));

mockNuxtImport("useRuntimeConfig", (original) => () => {
    const config = original();

    return { ...config, public: { ...config.public, trackers: preferences.trackers } };
});

beforeEach(() => {
    vi.clearAllMocks();

    preferences.trackers.googleAnalytics.id = "";
});

describe("useCookiePreferences", () => {
    it("hides the preferences link when no tracker is configured, since there is no banner", () => {
        expect(useCookiePreferences().enabled).toBe(false);
    });

    it("shows the preferences link once a tracker has an ID", () => {
        preferences.trackers.googleAnalytics.id = "G-TEST";

        expect(useCookiePreferences().enabled).toBe(true);
    });

    it("opens the banner's preferences modal", async () => {
        await useCookiePreferences().open();

        expect(preferences.showPreferences).toHaveBeenCalledOnce();
    });
});
