import { describe, expect, it, vi } from "vitest";
import TolgeeProvider, { type TolgeeProviderOptions } from "./TolgeeProvider";
import type { HttpClient } from "#core/ports/HttpClient";
import { MisconfiguredVendorError, UndefinedLocaleProviderError } from "#core/domain/errors";

const messages = { shared: { health: "Health" } };

describe("TolgeeProvider", () => {
    it("asks Tolgee for the project's locale tree, authenticated with the project token", async () => {
        const get = vi.fn().mockResolvedValue({ "en-GB": messages });
        const http: HttpClient = { get };
        const provider = new TolgeeProvider(
            { baseURL: "https://app.tolgee.io/", project: "1", options: { token: "abc" } },
            http,
        );

        await expect(provider.getTranslations("en-GB")).resolves.toBe(messages);
        expect(get).toHaveBeenCalledWith("/v2/projects/1/translations/en-GB", { headers: { "X-API-Key": "abc" } });
    });

    // The config claims a locale the project does not hold — a mismatch on our side, not a vendor failure
    it("refuses to invent a locale Tolgee answered without", async () => {
        const get = vi.fn().mockResolvedValue({ "es-ES": messages });
        const provider = new TolgeeProvider(
            { baseURL: "https://app.tolgee.io/", project: "1", options: { token: "abc" } },
            { get },
        );

        await expect(provider.getTranslations("en-GB")).rejects.toThrow(UndefinedLocaleProviderError);
        await expect(provider.getTranslations("en-GB")).rejects.toThrow(/"en-GB".*Tolgee/);
    });

    // An unset TRANSLATIONS_VENDOR_OPTIONS_TOKEN would otherwise reach Tolgee and come back as a 502
    it.each([{ token: "" }, { token: "  " }, undefined])("refuses to exist without a token (%o)", (options) => {
        const build = () => new TolgeeProvider(
            { baseURL: "https://app.tolgee.io/", project: "1", options: options as TolgeeProviderOptions },
            { get: vi.fn() },
        );

        expect(build).toThrow(MisconfiguredVendorError);
        expect(build).toThrow(/options\.token is empty/);
    });
});
