import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Nuxt } from "@nuxt/schema";
import type { ContentConfig } from "./config";
import { UndefinedVendorError } from "#core/domain/errors";
import type { VendorConfig } from "#core/registry";

const kit = vi.hoisted(() => ({
    addServerImports: vi.fn(),
    resolve: vi.fn((path: string) => `resolved(${path})`),
}));

vi.mock("@nuxt/kit", () => ({
    defineNuxtModule: (definition: unknown) => definition,
    createResolver: () => ({ resolve: kit.resolve }),
    addServerImports: kit.addServerImports,
}));

const { setup } = (await import("./module")).default as unknown as {
    setup: (options: ContentConfig, nuxt: Nuxt) => void
};

const vendor: VendorConfig = { name: "wordpress", baseURL: "https://wp.test/" };

function createNuxt() {
    return { options: { runtimeConfig: {} as Record<string, unknown> } };
}

function install(options: ContentConfig, nuxt = createNuxt()) {
    setup(options, nuxt as unknown as Nuxt);

    return nuxt;
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("content nuxt module", () => {
    it("publishes the vendor config where useContent reads it back", () => {
        expect(install({ vendor }).options.runtimeConfig.content).toEqual({ vendor });
    });

    it("auto-imports useContent into server code, and mounts no route", () => {
        install({ vendor });

        expect(kit.addServerImports).toHaveBeenCalledWith([{
            name: "useContent",
            from: "resolved(./runtime/server/utils/useContent)",
        }]);
    });

    // Failing the build beats throwing on the first request, which is a page nobody is watching
    describe("when the configured vendor does not exist", () => {
        it.each([
            ["an unregistered name", { name: "contentful", baseURL: "https://wp.test/" }],
            ["no name at all", { baseURL: "https://wp.test/" }],
            ["no vendor at all", undefined],
        ])("fails the build for %s", (_, broken) => {
            const options = { vendor: broken } as unknown as ContentConfig;

            expect(() => install(options)).toThrow(UndefinedVendorError);
            expect(() => install(options)).toThrow(/wordpress/);
            expect(kit.addServerImports).not.toHaveBeenCalled();
        });
    });

    // NUXT_CONTENT_VENDOR_BASE_URL can still replace it at boot, so the values present during the
    // build are not necessarily the deployed ones — the provider is what validates this one
    it("accepts a base URL that is still unset at build time", () => {
        const unset: VendorConfig = { name: "wordpress", baseURL: "" };

        expect(install({ vendor: unset }).options.runtimeConfig.content).toEqual({ vendor: unset });
        expect(kit.addServerImports).toHaveBeenCalledOnce();
    });
});
