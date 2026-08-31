import { describe, expect, it, vi } from "vitest";
import InternalProvider from "./InternalProvider";
import type { HttpClient } from "#core/ports/HttpClient";
import type { Vendor } from "#core/domain/vendor";

const messages = { shared: { health: "Health" } };

// Built the way the registry builds it: a vendor with no options is configured without the field
const vendor = { baseURL: "https://translations.test/", project: "external" } as Vendor;

describe("InternalProvider", () => {
    it("asks the translations server for the project's locale tree", async () => {
        const get = vi.fn().mockResolvedValue(messages);
        const http: HttpClient = { get };
        const provider = new InternalProvider(vendor, http);

        await expect(provider.getTranslations("en-GB")).resolves.toBe(messages);
        expect(get).toHaveBeenCalledWith("en-GB/external");
    });

    // Declared as an object, so a vendor that takes none must not hand its provider `undefined`
    it("exposes empty options rather than none, for the vendor that has none", () => {
        expect(new InternalProvider(vendor, { get: vi.fn() }).options).toEqual({});
    });
});
