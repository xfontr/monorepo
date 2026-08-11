import { describe, expect, it } from "vitest";
import getVendor, { type VendorConfig } from "./registry";
import TranslationsInternalProvider from "./adapters/TranslationsInternalProvider";
import TestProvider from "./adapters/TestProvider";

describe("getVendor", () => {
    it("builds the internal provider from its config", async () => {
        const provider = await getVendor({ name: "internal", baseURL: "https://translations.test/", project: "external" });

        expect(provider).toBeInstanceOf(TranslationsInternalProvider);
        expect(provider.baseURL).toBe("https://translations.test/");
        expect(provider.project).toBe("external");
    });

    it("hands vendor-specific options to the provider that declares them", async () => {
        const provider = await getVendor({ name: "test", baseURL: "https://translations.test/", project: "external", options: { id: "abc" } });

        expect(provider).toBeInstanceOf(TestProvider);
        expect(provider.options).toEqual({ id: "abc" });
    });

    it("rejects an unregistered vendor name instead of returning a broken provider", async () => {
        const vendor = { name: "nope", baseURL: "https://translations.test/", project: "external" } as unknown as VendorConfig;

        await expect(getVendor(vendor)).rejects.toThrow();
    });
});
