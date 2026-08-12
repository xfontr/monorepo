import type { EventHandlerRequest, H3Event } from "h3";
import { createError, getRouterParam } from "h3";
import { defineCachedEventHandler, useRuntimeConfig } from "nitropack/runtime";
import type { CachedEventHandlerOptions } from "nitropack";
import { ofetch } from "ofetch";
import createProvider from "#core/registry";
import type { TranslationsConfig } from "#nuxt/config";
import type { TranslationMap } from "#core/domain/translations";
import { translationsKey } from "#core/translationsKey";
import { TranslationsError, TranslationsUnavailableError, UndefinedLocaleError } from "#core/domain/errors";
import { OfetchHttpClient } from "#core/adapters/clients/OfetchHttpClient";

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

    const { vendor } = useRuntimeConfig(event).translations as TranslationsConfig;

    const http = new OfetchHttpClient(ofetch.create({ baseURL: vendor.baseURL }));
    const provider = await createProvider(vendor, http).catch(rethrowAsHttpError);

    return provider
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

    const { vendor } = useRuntimeConfig(event).translations as TranslationsConfig;

    return translationsKey(vendor, locale);
}
// #endregion
