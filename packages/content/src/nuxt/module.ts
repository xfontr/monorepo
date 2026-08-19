import { addImports, addServerHandler, createResolver, defineNuxtModule } from "@nuxt/kit";
import { UndefinedVendorError } from "#core/domain/errors";
import { isVendorName, VENDOR_NAMES } from "#core/registry";
import { CONTENT_API_PATH, type ContentConfig } from "./config";

export default defineNuxtModule<ContentConfig>({
    meta: { name: "@monorepo/content/nuxt", configKey: "content" },

    setup(resolvedOptions, nuxt) {
        const resolver = createResolver(import.meta.url);

        // An absent or unknown vendor fails the build instead of throwing on the first request.
        // baseURL is deliberately not checked here: NUXT_CONTENT_VENDOR_BASE_URL can still replace it
        // at boot, so the provider is the one that validates it.
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

        addImports({
            name: "useContent",
            from: resolver.resolve("./runtime/composables/useContent"),
        });
    },
});
