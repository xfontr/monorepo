import { addServerImports, createResolver, defineNuxtModule } from "@nuxt/kit";
import { UndefinedVendorError } from "#core/domain/errors";
import { isVendorName, VENDOR_NAMES } from "#core/registry";
import type { ContentConfig } from "./config";

export default defineNuxtModule<ContentConfig>({
    meta: { name: "@monorepo/content/nuxt", configKey: "content" },

    setup(resolvedOptions, nuxt) {
        const resolver = createResolver(import.meta.url);

        if (!isVendorName(resolvedOptions.vendor?.name)) {
            throw new UndefinedVendorError(resolvedOptions.vendor?.name, VENDOR_NAMES);
        }

        nuxt.options.runtimeConfig.content = resolvedOptions;

        addServerImports([
            {
                name: "useContent",
                from: resolver.resolve("./runtime/server/utils/useContent"),
            },
        ]);
    },
});
