import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Nuxt } from "@nuxt/schema";
import type { LocaleObject } from "@nuxtjs/i18n";
import { TRANSLATIONS_API_PATH } from "./config";
import { UndefinedVendorError } from "#core/domain/errors";
import type { VendorConfig } from "#core/registry";

const kit = vi.hoisted(() => ({
    addServerHandler: vi.fn(),
    installModule: vi.fn(),
    resolve: vi.fn((path: string) => `resolved(${path})`),
}));

vi.mock("@nuxt/kit", () => ({
    defineNuxtModule: (definition: unknown) => definition,
    createResolver: () => ({ resolve: kit.resolve }),
    addServerHandler: kit.addServerHandler,
    installModule: kit.installModule,
}));

const { setup } = (await import("./module")).default as unknown as {
    setup: (options: { vendor: VendorConfig }, nuxt: Nuxt) => Promise<void>
};

const vendor: VendorConfig = { name: "internal", baseURL: "https://translations.test/", project: "external" };

type LayerLocales = (string | LocaleObject)[] | undefined;

function createNuxt(...layers: LayerLocales[]) {
    return {
        options: {
            runtimeConfig: {} as Record<string, unknown>,
            _layers: layers.map((locales) => ({ config: { i18n: locales && { locales } } })),
        },
        hook: vi.fn<(name: string, callback: unknown) => void>(),
    };
}

type Layer = ReturnType<typeof createNuxt>["options"]["_layers"][number];

function declareDefaultLocale(nuxt: ReturnType<typeof createNuxt>, defaultLocale: string) {
    nuxt.options._layers.push({ config: { i18n: { defaultLocale } } } as unknown as Layer);

    return nuxt;
}

function registerLocales(nuxt: ReturnType<typeof createNuxt>) {
    const register = vi.fn();
    const hook = nuxt.hook.mock.calls.find(([name]) => name === "i18n:registerModule")?.[1];

    (hook as (register: unknown) => void)(register);

    return register.mock.calls[0]?.[0] as { langDir: string, locales: { code: string, file: string }[] };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("i18n nuxt module", () => {
    it("publishes the vendor config where the server handler reads it back", async () => {
        const nuxt = createNuxt(["en-GB"]);

        await setup({ vendor }, nuxt as unknown as Nuxt);

        expect(nuxt.options.runtimeConfig.translations).toEqual({ vendor, locales: ["en-GB"] });
    });

    it("publishes the same locales it registers loaders for", async () => {
        const nuxt = createNuxt(["en-GB", { code: "es-ES" }], ["en-GB"]);

        await setup({ vendor }, nuxt as unknown as Nuxt);

        const { locales } = nuxt.options.runtimeConfig.translations as { locales: string[] };

        expect(locales).toEqual(registerLocales(nuxt).locales.map(({ code }) => code));
    });

    it("mounts the BFF route on the path the locale loader fetches", async () => {
        const nuxt = createNuxt(["en-GB"]);

        await setup({ vendor }, nuxt as unknown as Nuxt);

        expect(kit.addServerHandler).toHaveBeenCalledWith({
            route: `${TRANSLATIONS_API_PATH}/:locale`,
            method: "get",
            handler: "resolved(./runtime/server/translations.get)",
        });
    });

    it("registers the loader for every locale declared across layers, without duplicates", async () => {
        const nuxt = createNuxt(["en-GB", { code: "es-ES" }], ["en-GB"], undefined);

        await setup({ vendor }, nuxt as unknown as Nuxt);
        const registered = registerLocales(nuxt);

        expect(registered.langDir).toBe("resolved(./runtime/locales)");
        expect(registered.locales).toEqual([
            { code: "en-GB", file: "loader.ts" },
            { code: "es-ES", file: "loader.ts" },
        ]);
    });

    it("says so when no layer declares locales, instead of registering nothing in silence", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const nuxt = createNuxt(undefined);

        await setup({ vendor }, nuxt as unknown as Nuxt);

        expect(registerLocales(nuxt).locales).toEqual([]);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("No locales declared"));

        warn.mockRestore();
    });

    // @nuxtjs/i18n prefixes every path when the default is not a declared locale, so `/` 404s
    it("says so when the default locale is not one of the declared ones", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const nuxt = declareDefaultLocale(createNuxt(["en-GB"]), "fr-FR");

        await setup({ vendor }, nuxt as unknown as Nuxt);

        expect(warn).toHaveBeenCalledWith(expect.stringContaining("\"fr-FR\""));

        warn.mockRestore();
    });

    it("stays quiet when the default locale is declared", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const nuxt = declareDefaultLocale(createNuxt(["en-GB"]), "en-GB");

        await setup({ vendor }, nuxt as unknown as Nuxt);

        expect(warn).not.toHaveBeenCalled();

        warn.mockRestore();
    });

    it("installs @nuxtjs/i18n so the registered loader is picked up", async () => {
        const nuxt = createNuxt(["en-GB"]);

        await setup({ vendor }, nuxt as unknown as Nuxt);

        expect(kit.installModule).toHaveBeenCalledWith("@nuxtjs/i18n");
    });

    // Failing the build beats throwing on the first request, which is a page nobody is watching
    describe("when the configured vendor does not exist", () => {
        it.each([
            ["an unregistered name", { name: "phrase", baseURL: "https://translations.test/", project: "external" }],
            ["no name at all", { baseURL: "https://translations.test/", project: "external" }],
            ["no vendor at all", undefined],
        ])("fails the build for %s", async (_, broken) => {
            const nuxt = createNuxt(["en-GB"]);
            const options = { vendor: broken } as unknown as { vendor: VendorConfig };

            await expect(setup(options, nuxt as unknown as Nuxt)).rejects.toThrow(UndefinedVendorError);
            await expect(setup(options, nuxt as unknown as Nuxt)).rejects.toThrow(/internal, tolgee/);
            expect(kit.addServerHandler).not.toHaveBeenCalled();
        });
    });
});
