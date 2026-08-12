import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRANSLATIONS_API_PATH } from "#nuxt/config";
import type { TranslationMap } from "#core/domain/translations";

const messages = { shared: { health: "Health" } };

const useFetch = vi.fn();
const showError = vi.fn((error: Error) => error);
const runWithContext = vi.fn(<T>(callback: () => T) => callback());

vi.stubGlobal("defineI18nLocale", (loader: unknown) => loader);
vi.stubGlobal("useNuxtApp", () => ({ runWithContext }));
vi.stubGlobal("useFetch", useFetch);
vi.stubGlobal("showError", showError);

const load = (await import("./loader")).default as (locale: string) => Promise<TranslationMap>;

beforeEach(() => {
    vi.clearAllMocks();
});

describe("locale loader", () => {
    it("loads the messages from the BFF, deduplicating the request per locale", async () => {
        useFetch.mockResolvedValue({ data: { value: messages }, error: { value: null } });

        await expect(load("en-GB")).resolves.toBe(messages);
        expect(useFetch).toHaveBeenCalledWith(`${TRANSLATIONS_API_PATH}/en-GB`, { key: "translations:en-GB" });
    });

    it("surfaces a failed load through the Nuxt error page, inside the app context", async () => {
        const error = new Error("Translations unavailable");
        useFetch.mockResolvedValue({ data: { value: null }, error: { value: error } });

        await load("en-GB");

        expect(runWithContext).toHaveBeenCalled();
        expect(showError).toHaveBeenCalledWith(error);
    });
});
