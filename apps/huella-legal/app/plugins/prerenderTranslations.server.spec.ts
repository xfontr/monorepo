import { describe, expect, it, vi } from "vitest";
import plugin from "./prerenderTranslations.server";

const run = () => {
    const getLocaleMessage = vi.fn(() => ({}));
    const nuxtApp = { $i18n: { locale: { value: "es-ES" }, getLocaleMessage } };

    const result = (plugin as unknown as (app: typeof nuxtApp) => unknown)(nuxtApp);

    return { result, getLocaleMessage };
};

describe("the prerender translations guard", () => {
    // Served live, a Tolgee outage heals on the next cache refresh, so raw keys beat a 502 page
    it("never fails a page rendered at request time, even with no messages loaded", () => {
        const { result, getLocaleMessage } = run();

        expect(result).toBeUndefined();
        expect(getLocaleMessage).not.toHaveBeenCalled();
    });

    // Run any earlier, it would find no messages on every page and fail every build
    it("runs after @nuxtjs/i18n has loaded the request's locale", () => {
        expect((plugin as unknown as { dependsOn?: string[] }).dependsOn).toEqual([
            "i18n:plugin:route-locale-detect",
        ]);
    });
});
