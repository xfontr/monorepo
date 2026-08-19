import { addServerHandler, createResolver, defineNuxtModule, installModule } from "@nuxt/kit";
import type { Nuxt } from "@nuxt/schema";
import type { LocaleObject } from "@nuxtjs/i18n";
import { TRANSLATIONS_API_PATH, type TranslationsConfig } from "./config";

export default defineNuxtModule<TranslationsConfig>({
    meta: { name: "@monorepo/i18n/nuxt", configKey: "translations" },

    async setup(resolvedOptions, nuxt) {
        const resolver = createResolver(import.meta.url);
        const locales = getLocaleCodes(nuxt);

        warnAboutLocales(locales, nuxt);

        nuxt.options.runtimeConfig.translations = { ...resolvedOptions, locales };

        // BFF
        addServerHandler({
            route: `${TRANSLATIONS_API_PATH}/:locale`,
            method: "get",
            handler: resolver.resolve("./runtime/server/translations.get"),
        });

        // Locale loader
        nuxt.hook("i18n:registerModule", (register) => {
            register({
                langDir: resolver.resolve("./runtime/locales"),
                locales: locales.map((code) => ({ code, file: "loader.ts" })),
            });
        });

        // Install i18n module
        await installModule("@nuxtjs/i18n");
    },
});

function getLocaleCodes({ options }: Nuxt): string[] {
    const locales = options._layers.flatMap<string | LocaleObject>((layer) => layer.config.i18n?.locales ?? []);
    return [...new Set(locales.map((locale) => (typeof locale === "string" ? locale : locale.code)))];
}

function warnAboutLocales(locales: string[], { options }: Nuxt): void {
    if (!locales.length) {
        console.warn("[@monorepo/i18n] No locales declared under `i18n.locales`, so no loader was registered and nothing will translate.");
        return;
    }

    const defaultLocale = options._layers.find((layer) => layer.config.i18n?.defaultLocale)?.config.i18n?.defaultLocale;

    if (defaultLocale && !locales.includes(defaultLocale)) {
        console.warn(`[@monorepo/i18n] \`i18n.defaultLocale\` is "${defaultLocale}", which is not one of the declared locales (${locales.join(", ")}).`);
    }
}
