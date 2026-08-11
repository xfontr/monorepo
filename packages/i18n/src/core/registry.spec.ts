import { describe, expect, it } from "vitest";
import getVendor, { type VendorConfig } from "./registry";
import InternalProvider from "./adapters/InternalProvider";
import TestProvider from "./adapters/TestProvider";
import { UndefinedVendorError } from "./errors";

describe("getVendor", () => {
    it("builds the internal provider from its config", async () => {
        const provider = await getVendor({ name: "internal", baseURL: "https://translations.test/", project: "external" });

        expect(provider).toBeInstanceOf(InternalProvider);
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

        await expect(getVendor(vendor)).rejects.toThrow(UndefinedVendorError);
        await expect(getVendor(vendor)).rejects.toThrow(/"nope".*internal, test/);
    });

    it("rejects a missing vendor config the same way", async () => {
        await expect(getVendor(undefined as unknown as VendorConfig)).rejects.toThrow(UndefinedVendorError);
    });
});
