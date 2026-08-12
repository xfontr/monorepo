import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Nuxt } from "@nuxt/schema";
import type { LocaleObject } from "@nuxtjs/i18n";
import { TRANSLATIONS_API_PATH } from "./config";
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

        expect(nuxt.options.runtimeConfig.translations).toEqual({ vendor });
    });

    it("mounts the BFF route on the path the locale loader fetches", async () => {
        const nuxt = createNuxt(["en-GB"]);

        await setup({ vendor }, nuxt as unknown as Nuxt);

        expect(kit.addServerHandler).toHaveBeenCalledWith({
            route: `${TRANSLATIONS_API_PATH}/:locale`,
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

    it("registers nothing when no layer declares locales", async () => {
        const nuxt = createNuxt(undefined);

        await setup({ vendor }, nuxt as unknown as Nuxt);

        expect(registerLocales(nuxt).locales).toEqual([]);
    });

    it("installs @nuxtjs/i18n so the registered loader is picked up", async () => {
        const nuxt = createNuxt(["en-GB"]);

        await setup({ vendor }, nuxt as unknown as Nuxt);

        expect(kit.installModule).toHaveBeenCalledWith("@nuxtjs/i18n");
    });
});
