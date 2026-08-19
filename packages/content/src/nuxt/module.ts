import { addImports, addServerHandler, createResolver, defineNuxtModule } from "@nuxt/kit";
import { UndefinedVendorError } from "#core/domain/errors";
import { isVendorName, VENDOR_NAMES } from "#core/registry";
import { CONTENT_API_PATH, type ContentConfig } from "./config";

export default defineNuxtModule<ContentConfig>({
    meta: { name: "@monorepo/content/nuxt", configKey: "content" },

    setup(resolvedOptions, nuxt) {
        const resolver = createResolver(import.meta.url);

        if (!isVendorName(resolvedOptions.vendor?.name)) {
            throw new UndefinedVendorError(resolvedOptions.vendor?.name, VENDOR_NAMES);
        }

        nuxt.options.runtimeConfig.content = resolvedOptions;

        // BFF
        addServerHandler({
            route: `${CONTENT_API_PATH}/:resource`,
            method: "get",
            handler: resolver.resolve("./runtime/server/content.get"),
        });

        addServerHandler({
            route: `${CONTENT_API_PATH}/:resource/:slug`,
            method: "get",
            handler: resolver.resolve("./runtime/server/contentItem.get"),
        });

        // Nuxt magic (autoimports)
        addImports({
            name: "useContent",
            from: resolver.resolve("./runtime/composables/useContent"),
        });
    },
});
