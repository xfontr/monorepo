import { describe, expect, it, vi } from "vitest";
import createProvider, { isVendorName, VENDOR_NAMES, type VendorConfig } from "./registry";
import InternalProvider from "./adapters/providers/InternalProvider";
import TolgeeProvider from "./adapters/providers/TolgeeProvider";
import { MisconfiguredVendorError, UndefinedVendorError } from "./domain/errors";
import type { HttpClient } from "./ports/HttpClient";

const http: HttpClient = { get: vi.fn() };

describe("createProvider", () => {
    it("builds the internal provider from its config", async () => {
        const provider = await createProvider({ name: "internal", baseURL: "https://translations.test/", project: "external" }, http);

        expect(provider).toBeInstanceOf(InternalProvider);
        expect(provider.baseURL).toBe("https://translations.test/");
        expect(provider.project).toBe("external");
    });

    it("hands vendor-specific options to the provider that declares them", async () => {
        const options = { token: "abc" };
        const provider = await createProvider({ name: "tolgee", baseURL: "https://translations.test/", project: "1", options }, http);

        expect(provider).toBeInstanceOf(TolgeeProvider);
        expect(provider.options).toEqual(options);
    });

    it("hands the transport to the provider, so it can never be built unable to fetch", async () => {
        const get = vi.fn();
        const provider = await createProvider({ name: "internal", baseURL: "https://translations.test/", project: "external" }, { get });

        await provider.getTranslations("en-GB");

        expect(get).toHaveBeenCalledWith("en-GB/external");
    });

    it("rejects an unregistered vendor name instead of returning a broken provider", async () => {
        const vendor = { name: "nope", baseURL: "https://translations.test/", project: "external" } as unknown as VendorConfig;

        await expect(createProvider(vendor, http)).rejects.toThrow(UndefinedVendorError);
        await expect(createProvider(vendor, http)).rejects.toThrow(/"nope".*internal, tolgee/);
    });

    it("rejects a missing vendor config the same way", async () => {
        await expect(createProvider(undefined as unknown as VendorConfig, http)).rejects.toThrow(UndefinedVendorError);
    });

    it("rejects a registered vendor whose config cannot work, rather than returning it", async () => {
        const vendor: VendorConfig = { name: "tolgee", baseURL: "", project: "", options: { token: "" } };

        await expect(createProvider(vendor, http)).rejects.toThrow(MisconfiguredVendorError);
        await expect(createProvider(vendor, http)).rejects.toThrow(/project is empty.*baseURL.*options\.token is empty/);
    });
});

// The registry drives both the runtime lookup and the config type, so these cannot be allowed to drift
describe("the registered vendors", () => {
    it("are the ones the config type offers", () => {
        expect(VENDOR_NAMES).toEqual(["internal", "tolgee"]);
    });

    it.each(VENDOR_NAMES)("recognise %s as a vendor name", (name) => {
        expect(isVendorName(name)).toBe(true);
    });

    it.each([undefined, "", "  ", "TOLGEE", "tolge", "phrase"])("do not recognise %o", (name) => {
        expect(isVendorName(name)).toBe(false);
    });
});
