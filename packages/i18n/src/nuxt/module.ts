import { addServerHandler, createResolver, defineNuxtModule, installModule } from "@nuxt/kit";
import type { Nuxt } from "@nuxt/schema";
import type { LocaleObject } from "@nuxtjs/i18n";
import { TRANSLATIONS_API_PATH, type TranslationsConfig } from "./config";

export default defineNuxtModule<TranslationsConfig>({
    meta: { name: "@budget-forecast/i18n/nuxt", configKey: "translations" },

    async setup(resolvedOptions, nuxt) {
        const resolver = createResolver(import.meta.url);

        nuxt.options.runtimeConfig.translations = resolvedOptions;

        // BFF
        addServerHandler({
            route: `${TRANSLATIONS_API_PATH}/:locale`,
            handler: resolver.resolve("./runtime/server/translations.get"),
        });

        // Locale loader
        nuxt.hook("i18n:registerModule", (register) => {
            register({
                langDir: resolver.resolve("./runtime/locales"),
                locales: getLocaleCodes(nuxt).map((code) => ({ code, file: "loader.ts" })),
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
