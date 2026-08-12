import type { EventHandlerRequest, H3Event } from "h3";
import { createError, getRouterParam } from "h3";
import { defineCachedEventHandler, useRuntimeConfig } from "nitropack/runtime";
import type { CachedEventHandlerOptions } from "nitropack";
import { ofetch } from "ofetch";
import getVendor, { type VendorConfig } from "../../../core/registry";
import type { TranslationMap } from "../../../core/domain/translations";
import { TranslationsError, TranslationsUnavailableError, UndefinedLocaleError } from "../../../core/errors";
import { OfetchHttpClient } from "../../../core/adapters/clients/OfetchHttpClient";

const cacheOptions: CachedEventHandlerOptions<TranslationMap> = {
    name: "translations",
    group: "i18n",
    maxAge: 60 * 60,
    staleMaxAge: 60 * 60 * 24,
    getKey,
    shouldBypassCache: () => import.meta.dev === true,
};

export default defineCachedEventHandler(async (event) => {
    const locale = getRouterParam(event, "locale");
    assertLocale(locale);

    const { vendor } = useRuntimeConfig(event).translations as { vendor: VendorConfig };

    const provider = await getVendor(vendor).catch(rethrowAsHttpError);
    const http = new OfetchHttpClient(ofetch.create({ baseURL: provider.baseURL }));

    return provider
        .setHttpClient(http)
        .getTranslations(locale)
        .catch((cause) => throwUnavailableError(cause, locale));
}, cacheOptions);

// #region utils
function assertLocale(locale?: string): asserts locale is string {
    if (locale) return;

    throw createError(new UndefinedLocaleError(locale));
}

// Only our own diagnoses become an HTTP status; anything else keeps its stack and reports as unhandled
function rethrowAsHttpError(cause: unknown): never {
    if (cause instanceof TranslationsError) throw createError(cause);

    throw cause;
}

function throwUnavailableError(cause: unknown, locale: string): never {
    throw createError(new TranslationsUnavailableError(locale, cause));
}

function getKey(event: H3Event<EventHandlerRequest>) {
    const locale = getRouterParam(event, "locale");
    assertLocale(locale);

    const { vendor } = useRuntimeConfig(event).translations as { vendor: VendorConfig };

    return [vendor.name, vendor.project, serializeOptions(vendor.options), locale].filter(Boolean).join(":");
}

// Options pick which upstream document a vendor fetches, so two option sets must never share an entry
// Percent-encoded because the key ends up as a cache storage path
function serializeOptions(options?: object): string {
    return options ? encodeURIComponent(JSON.stringify(options)) : "";
}
// #endregion
