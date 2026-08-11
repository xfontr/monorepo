import { addServerHandler, createResolver, defineNuxtModule, installModule } from "@nuxt/kit";
import { type TranslationsRuntimeConfig } from "./shared";
import { TRANSLATIONS_API_PATH } from "./config";

export default defineNuxtModule<TranslationsRuntimeConfig>({
    meta: { name: "@budget-forecast/i18n/nuxt", configKey: "translations" },

    async setup(resolvedOptions, { options, hook }) {
        const resolver = createResolver(import.meta.url);

        options.runtimeConfig.translations = resolvedOptions;

        // BFF
        addServerHandler({
            route: `${TRANSLATIONS_API_PATH}/:locale`,
            handler: resolver.resolve("./runtime/server/translations.get"),
        });

        // Locale loader
        hook("i18n:registerModule", (register) => {
            register({
                langDir: resolver.resolve("./runtime/locales"),
                locales: resolvedOptions.locales.map((locale) => ({ ...locale, file: "loader.ts" })),
            });
        });

        // Install i18n module
        await installModule("@nuxtjs/i18n");
    },
});
