import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Nuxt } from "@nuxt/schema";
import { CONTENT_API_PATH, type ContentConfig } from "./config";
import { UndefinedVendorError } from "#core/domain/errors";
import type { VendorConfig } from "#core/registry";

const kit = vi.hoisted(() => ({
    addServerHandler: vi.fn(),
    addImports: vi.fn(),
    resolve: vi.fn((path: string) => `resolved(${path})`),
}));

vi.mock("@nuxt/kit", () => ({
    defineNuxtModule: (definition: unknown) => definition,
    createResolver: () => ({ resolve: kit.resolve }),
    addServerHandler: kit.addServerHandler,
    addImports: kit.addImports,
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
    it("publishes the vendor config where the server handlers read it back", () => {
        expect(install({ vendor }).options.runtimeConfig.content).toEqual({ vendor });
    });

    it("mounts the list route on the path the composable fetches", () => {
        install({ vendor });

        expect(kit.addServerHandler).toHaveBeenCalledWith({
            route: `${CONTENT_API_PATH}/:resource`,
            method: "get",
            handler: "resolved(./runtime/server/content.get)",
        });
    });

    // A slug lookup lives on the server so a miss answers with a real 404, and so a vendor with a
    // native single-document endpoint can serve it without a list round-trip
    it("mounts a route of its own for a single document", () => {
        install({ vendor });

        expect(kit.addServerHandler).toHaveBeenCalledWith({
            route: `${CONTENT_API_PATH}/:resource/:slug`,
            method: "get",
            handler: "resolved(./runtime/server/contentItem.get)",
        });
    });

    it("auto-imports the composable, so a page needs no import of its own", () => {
        install({ vendor });

        expect(kit.addImports).toHaveBeenCalledWith({
            name: "useContent",
            from: "resolved(./runtime/composables/useContent)",
        });
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
            expect(kit.addServerHandler).not.toHaveBeenCalled();
        });
    });

    // NUXT_CONTENT_VENDOR_BASE_URL can still replace it at boot, so the values present during the
    // build are not necessarily the deployed ones — the provider is what validates this one
    it("accepts a base URL that is still unset at build time", () => {
        const unset: VendorConfig = { name: "wordpress", baseURL: "" };

        expect(install({ vendor: unset }).options.runtimeConfig.content).toEqual({ vendor: unset });
        expect(kit.addServerHandler).toHaveBeenCalledTimes(2);
    });
});
